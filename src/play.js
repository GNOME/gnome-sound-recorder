/* exported Play */
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
 * Author: Meg Ford <megford@gnome.org>
 *
 */

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gst = imports.gi.Gst;
const GstAudio = imports.gi.GstAudio;
const GstPbutils = imports.gi.GstPbutils;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Application = imports.application;
const MainWindow = imports.mainWindow;
const Waveform = imports.waveform;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2,
    NULL: 3
};

const ErrState = {
    OFF: 0,
    ON: 1
}

let errorDialogState;

const _TENTH_SEC = 100000000;

var Play = new Lang.Class({
    Name: "Play",

    _playPipeline: function() {
        errorDialogState = ErrState.OFF;
        let uri = this._fileToPlay.get_uri();
        this.play = Gst.ElementFactory.make("playbin", "play");
        this.play.set_property("uri", uri);
        this.sink = Gst.ElementFactory.make("pulsesink", "sink");
        this.play.set_property("audio-sink", this.sink);
        this.clock = this.play.get_clock();
        this.playBus = this.play.get_bus();
        this.playBus.add_signal_watch();
        this.playBus.connect("message", Lang.bind(this,
            function(playBus, message) {

                if (message != null) {
                    this._onMessageReceived(message);
                }
            }));
    },

    startPlaying: function() {
        this.baseTime = 0;

        if (!this.play || this.playState == PipelineStates.STOPPED ) {
            this._playPipeline();
        }

        if (this.playState == PipelineStates.PAUSED) {
            this.updatePosition();
            this.play.set_base_time(this.clock.get_time());
            this.baseTime = this.play.get_base_time() - this.runTime;
        }

        this.ret = this.play.set_state(Gst.State.PLAYING);
        this.playState = PipelineStates.PLAYING;

        if (this.ret == Gst.StateChangeReturn.FAILURE) {
            this._showErrorDialog(_('Unable to play recording'));
            errorDialogState = ErrState.ON;
        } else if (this.ret == Gst.StateChangeReturn.SUCCESS) {
            MainWindow.view.setVolume();
        }
        GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, Application.SIGINT, Application.application.onWindowDestroy);
        GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, Application.SIGTERM, Application.application.onWindowDestroy);
    },

    pausePlaying: function() {
        this.play.set_state(Gst.State.PAUSED);
        this.playState = PipelineStates.PAUSED;

        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
        }
    },

    stopPlaying: function() {
        if (this.playState != PipelineStates.STOPPED) {
            this.onEnd();
        }
    },

    onEnd: function() {
        this.play.set_state(Gst.State.NULL);
        this.playState = PipelineStates.STOPPED;
        this.playBus.remove_signal_watch();
        this._updateTime();

        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
        }

        if (MainWindow.wave != null)
            MainWindow.wave.endDrawing();

        errorDialogState = ErrState.OFF;
    },

    onEndOfStream: function() {
        MainWindow.view.onPlayStopClicked();
    },

    _onMessageReceived: function(message) {
        this.localMsg = message;
        let msg = message.type;
        switch(msg) {

        case Gst.MessageType.EOS:
            this.onEndOfStream();
            break;

        case Gst.MessageType.WARNING:
            let warningMessage = message.parse_warning()[0];
            log(warningMessage.toString());
            break;

        case Gst.MessageType.ERROR:
            let errorMessage = message.parse_error()[0];
            this._showErrorDialog(errorMessage.toString());
            errorDialogState = ErrState.ON;
            break;

        case Gst.MessageType.ASYNC_DONE:
            if (this.sought) {
                this.play.set_state(this._lastState);
                MainWindow.view.setProgressScaleSensitive();
            }
            this.updatePosition();
            break;

        case Gst.MessageType.CLOCK_LOST:
            this.pausePlaying();
            break;

        case Gst.MessageType.NEW_CLOCK:
            if (this.playState == PipelineStates.PAUSED) {
                this.clock = this.play.get_clock();
                this.startPlaying();
            }
            break;
        }
    },

    getPipeStates: function() {
        return this.playState;
    },

    _updateTime: function() {
        let time = this.play.query_position(Gst.Format.TIME)[1]/Gst.SECOND;
        this.trackDuration = this.play.query_duration(Gst.Format.TIME)[1];
        this.trackDurationSecs = this.trackDuration/Gst.SECOND;

        if (time >= 0 && this.playState != PipelineStates.STOPPED) {
            MainWindow.view.setLabel(time);
        } else if (time >= 0 && this.playState == PipelineStates.STOPPED) {
            MainWindow.view.setLabel(0);
        }

        let absoluteTime = 0;

        if  (this.clock == null) {
            this.clock = this.play.get_clock();
        }
        try {
            absoluteTime = this.clock.get_time();
        } catch(error) {
            // no-op
        }

        if (this.baseTime == 0)
            this.baseTime = absoluteTime;

        this.runTime = absoluteTime- this.baseTime;
        let approxTime = Math.round(this.runTime/_TENTH_SEC);

        if (MainWindow.wave != null) {
            MainWindow.wave._drawEvent(approxTime);
        }

        return true;
    },

    queryPosition: function() {
        let position = 0;
        while (position == 0) {
            position = this.play.query_position(Gst.Format.TIME)[1]/Gst.SECOND;
        }

        return position;
    },

    updatePosition: function() {
        if (!this.timeout) {
            this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, Lang.bind(this,
                this._updateTime));
        }
    },

    setVolume: function(value) {
        this.play.set_volume(GstAudio.StreamVolumeFormat.CUBIC, value);
    },

    passSelected: function(selected) {
        this._selected = selected;
        this._fileToPlay = MainWindow.view.loadPlay(this._selected);
    },

    _showErrorDialog: function(errorStrOne, errorStrTwo) {
        if (errorDialogState == ErrState.OFF) {
            let errorDialog = new Gtk.MessageDialog ({ destroy_with_parent: true,
                                                       buttons: Gtk.ButtonsType.OK,
                                                       message_type: Gtk.MessageType.WARNING });

            if (errorStrOne != null)
                errorDialog.set_property('text', errorStrOne);

            if (errorStrTwo != null)
                errorDialog.set_property('secondary-text', errorStrTwo);

            errorDialog.set_transient_for(Gio.Application.get_default().get_active_window());
            errorDialog.connect ('response', Lang.bind(this,
                function() {
                    errorDialog.destroy();
                    this.onEndOfStream();
                }));
            errorDialog.show();
        }
    }
});
