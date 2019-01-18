/* exported Record */
/*
 * Copyright 2013 Meg Ford
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, see <http://www.gnu.org/licenses/>.
 *
 *  Author: Meg Ford <megford@gnome.org>
 *
 */

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gst = imports.gi.Gst;
const GstAudio = imports.gi.GstAudio;
const GstPbutils = imports.gi.GstPbutils;
const Gtk = imports.gi.Gtk;
const Pango = imports.gi.Pango;
const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Application = imports.application;
const AudioProfile = imports.audioProfile;
const MainWindow = imports.mainWindow;
const Listview = imports.listview;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
};

const ErrState = {
    OFF: 0,
    ON: 1
};

const Channels = {
    MONO: 0,
    STEREO: 1
};

const _TENTH_SEC = 100000000;

let errorDialogState;

var Record = class Record {
    _recordPipeline() {
        errorDialogState = ErrState.OFF;
        this.baseTime = 0;
        this._view = MainWindow.view;
        this._buildFileName = new BuildFileName();
        this.initialFileName = this._buildFileName.buildInitialFilename();
        let localDateTime = this._buildFileName.getOrigin();
        this.gstreamerDateTime = Gst.DateTime.new_from_g_date_time(localDateTime);

        if (this.initialFileName == -1) {
            this._showErrorDialog(_("Unable to create Recordings directory."));
            errorDialogState = ErrState.ON;
            this.onEndOfStream();
        }

        this.pipeline = new Gst.Pipeline({ name: "pipe" });
        this.srcElement = Gst.ElementFactory.make("pulsesrc", "srcElement");

        if (this.srcElement == null) {
            let inspect = "gst-inspect-1.0 pulseaudio";
            let [res, out, err, status] =  GLib.spawn_command_line_sync(inspect);
            let err_str = String(err)
            if (err_str.replace(/\W/g, ''))
                this._showErrorDialog(_("Please install the GStreamer 1.0 PulseAudio plugin."));
            else
                this._showErrorDialog(_("Your audio capture settings are invalid."));

            errorDialogState = ErrState.ON;
            this.onEndOfStream();
            return;
        }

        this.pipeline.add(this.srcElement);
        this.audioConvert = Gst.ElementFactory.make("audioconvert", "audioConvert");
        this.pipeline.add(this.audioConvert);
        this.caps = Gst.Caps.from_string("audio/x-raw, channels=" + this._getChannels());
        this.clock = this.pipeline.get_clock();
        this.recordBus = this.pipeline.get_bus();
        this.recordBus.add_signal_watch();
        this.recordBus.connect("message", (recordBus, message) => {
            if (message != null) {
                this._onMessageReceived(message);
            }
        });
        this.level = Gst.ElementFactory.make("level", "level");
        this.pipeline.add(this.level);
        this.volume = Gst.ElementFactory.make("volume", "volume");
        this.pipeline.add(this.volume);
        this.ebin = Gst.ElementFactory.make("encodebin", "ebin");
        this.ebin.connect("element-added", (ebin, element) => {
            let factory = element.get_factory();

            if (factory != null) {
                this.hasTagSetter = factory.has_interface("GstTagSetter");
                if (this.hasTagSetter == true) {
                    this.taglist = Gst.TagList.new_empty();
                    this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_APPLICATION_NAME, _("Sound Recorder"));
                    element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                    this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_TITLE, this.initialFileName);
                    element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                    this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_DATE_TIME, this.gstreamerDateTime);
                    element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                }
            }
        });
        this.pipeline.add(this.ebin);
        let ebinProfile = this.ebin.set_property("profile", this._mediaProfile);
        let srcpad = this.ebin.get_static_pad("src");
        this.filesink = Gst.ElementFactory.make("filesink", "filesink");
        this.filesink.set_property("location", this.initialFileName);
        this.pipeline.add(this.filesink);

        if (!this.pipeline || !this.filesink) {
            this._showErrorDialog(_("Not all elements could be created."));
            errorDialogState = ErrState.ON;
            this.onEndOfStream();
        }

        let srcLink = this.srcElement.link(this.audioConvert);
        let audioConvertLink = this.audioConvert.link_filtered(this.level, this.caps);
        let levelLink = this.level.link(this.volume);
        let volLink = this.volume.link(this.ebin);
        let ebinLink = this.ebin.link(this.filesink);

        if (!srcLink || !audioConvertLink || !levelLink || !ebinLink) {
            this._showErrorDialog(_("Not all of the elements were linked."));
            errorDialogState = ErrState.ON;
            this.onEndOfStream();
        }

        GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, Application.SIGINT, Application.application.onWindowDestroy);
        GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, Application.SIGTERM, Application.application.onWindowDestroy);
    }

    _updateTime() {
        let time = this.pipeline.query_position(Gst.Format.TIME)[1]/Gst.SECOND;

        if (time >= 0) {
            this._view.setLabel(time, 0);
        }

        return true;
    }

    startRecording(profile) {
        this.profile = profile;
        this._audioProfile = MainWindow.audioProfile;
        this._mediaProfile = this._audioProfile.mediaProfile();

        if (this._mediaProfile == -1) {
            this._showErrorDialog(_("No Media Profile was set."));
            errorDialogState = ErrState.ON;
        }

        if (!this.pipeline || this.pipeState == PipelineStates.STOPPED )
            this._recordPipeline();

        let ret = this.pipeline.set_state(Gst.State.PLAYING);
        this.pipeState = PipelineStates.PLAYING;

        if (ret == Gst.StateChangeReturn.FAILURE) {
            this._showErrorDialog(_("Unable to set the pipeline \n to the recording state."));
            errorDialogState = ErrState.ON;
            this._buildFileName.getTitle().delete_async(GLib.PRIORITY_DEFAULT, null, null);
        } else {
            MainWindow.view.setVolume();
        }

        if (!this.timeout) {
            this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, MainWindow._SEC_TIMEOUT, () => this._updateTime());
        }
    }

    stopRecording() {
        let sent = this.pipeline.send_event(Gst.Event.new_eos());

        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
        }

        if (MainWindow.wave != null)
            MainWindow.wave.endDrawing();
    }

    onEndOfStream() {
        this.pipeline.set_state(Gst.State.NULL);
        this.pipeState = PipelineStates.STOPPED;

        if (this.recordBus)
	        this.recordBus.remove_signal_watch();

        this._updateTime();
        errorDialogState = ErrState.OFF;
    }

    _onMessageReceived(message) {
        this.localMsg = message;
        let msg = message.type;
        switch(msg) {

        case Gst.MessageType.ELEMENT:
            if (GstPbutils.is_missing_plugin_message(this.localMsg)) {
                let errorOne = null;
                let errorTwo = null;
                let detail = GstPbutils.missing_plugin_message_get_installer_detail(this.localMsg);

                if (detail != null)
                    errorOne = detail;

                let description = GstPbutils.missing_plugin_message_get_description(this.localMsg);

                if (description != null)
                    errorTwo = description;

                this._showErrorDialog(errorOne, errorTwo);
                errorDialogState = ErrState.ON;
                break;
            }

            let s = message.get_structure();
                if (s) {
                    if (s.has_name("level")) {
                        let p = null;
                        let peakVal = 0;
                        let val = 0;
                        let st = s.get_value("timestamp");
                        let dur = s.get_value("duration");
                        let runTime = s.get_value("running-time");
                        peakVal = s.get_value("peak");

                        if (peakVal) {
                            let val = peakVal.get_nth(0);

                            if (val > 0)
			                    val = 0;
                            let value = Math.pow(10, val/20);
                            this.peak = value;


                            if  (this.clock == null) {
                                this.clock = this.pipeline.get_clock();
                            }
                            try {
                                this.absoluteTime = this.clock.get_time();
                            } catch(error) {
                                this.absoluteTime = 0;
                            }


                            if (this.baseTime == 0)
                                this.baseTime = this.absoluteTime;

                            this.runTime = this.absoluteTime- this.baseTime;
                            let approxTime = Math.round(this.runTime/_TENTH_SEC);
                            MainWindow.wave._drawEvent(approxTime, this.peak);
                            }
                        }
                    }
            break;

        case Gst.MessageType.EOS:
            this.onEndOfStream();
            break;

        case Gst.MessageType.WARNING:
            let warningMessage = message.parse_warning()[0];
            log(warningMessage.toString());
            break;

        case Gst.MessageType.ERROR:
            let errorMessage = message.parse_error();
            this._showErrorDialog(errorMessage.toString());
            errorDialogState = ErrState.ON;
            break;
        }
    }

    setVolume(value) {
        if (this.volume) {
            this.volume.set_volume(GstAudio.StreamVolumeFormat.CUBIC, value);
        }
    }

    _getChannels() {

        let channels = null;
        let channelsPref = Application.application.getChannelsPreferences();

        switch(channelsPref) {
        case Channels.MONO:
            channels = 1;
            break;

        case Channels.STEREO:
            channels = 2;
            break;

        default:
            channels = 2;
        }

        return channels;
    }

    _showErrorDialog(errorStrOne, errorStrTwo) {
        if (errorDialogState == ErrState.OFF) {
            let errorDialog = new Gtk.MessageDialog ({ modal: true,
                                                       destroy_with_parent: true,
                                                       buttons: Gtk.ButtonsType.OK,
                                                       message_type: Gtk.MessageType.WARNING });
            if (errorStrOne != null) {
                errorDialog.set_property("text", errorStrOne);
            }

            if (errorStrTwo != null)
                errorDialog.set_property("secondary-text", errorStrTwo);

            errorDialog.set_transient_for(Gio.Application.get_default().get_active_window());
            errorDialog.connect("response", () => {
                errorDialog.destroy();
                MainWindow.view.onRecordStopClicked();
                this.onEndOfStream();
            });
            errorDialog.show();
        }
    }
}

const BuildFileName = class BuildFileName {
    buildInitialFilename() {
        var fileExtensionName = MainWindow.audioProfile.fileExtensionReturner();
        var dir = Gio.Application.get_default().saveDir;
        this.dateTime = GLib.DateTime.new_now_local();
        var clipNumber = Listview.trackNumber + 1;
        /* Translators: ""Clip %d"" is the default name assigned to a file created
            by the application (for example, "Clip 1"). */
        var clipName = _("Clip %d").format(clipNumber.toString());
        this.clip = dir.get_child_for_display_name(clipName);
        var file = this.clip.get_path();
        return file;
    }

    getTitle() {
        return this.clip;
    }

    getOrigin() {
        return this.dateTime;
    }
}
