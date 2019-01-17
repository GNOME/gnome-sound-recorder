/* exported audioProfile displayTime list offsetController
            play recordPipeline view volumeValue wave ActiveArea
            RecordPipelineStates _SEC_TIMEOUT MainWindow
            EncoderComboBox ChannelsComboBox */
/*
* Copyright 2013 Meg Ford
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Library General Public
* License as published by the Free Software Foundation; either
* version 2 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
* Library General Public License for more details.
*
* You should have received a copy of the GNU Library General Public
* License along with this library; if not, see <http://www.gnu.org/licenses/>.
*
* Author: Meg Ford <megford@gnome.org>
*
*/

const Gettext = imports.gettext;
const _ = imports.gettext.gettext;
const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gst = imports.gi.Gst;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const Application = imports.application;
const AudioProfile = imports.audioProfile;
const FileUtil = imports.fileUtil;
const Info = imports.info;
const Listview = imports.listview;
const Params = imports.params;
const Play = imports.play;
const Preferences = imports.preferences;
const Record = imports.record;
const Waveform = imports.waveform;

let activeProfile = null;
var audioProfile = null;
var displayTime = null;
let grid = null;
let groupGrid;
let header;
var list = null;
let loadMoreButton = null;
var offsetController = null;
var play = null;
let previousSelRow = null;
var recordPipeline = null;
let recordButton = null;
let appMenuButton = null;
let selectable = null;
let setVisibleID = null;
let UpperBoundVal = 182;
var view = null;
var volumeValue = [];
var wave = null;

var ActiveArea = {
    RECORD: 0,
    PLAY: 1
};

const ListColumns = {
    NAME: 0,
    MENU: 1
};

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
};

var RecordPipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
};

const _TIME_DIVISOR = 60;
var _SEC_TIMEOUT = 100;

var MainWindow = new Lang.Class({
    Name: 'MainWindow',
    Extends: Gtk.ApplicationWindow,

     _init: function(params) {
        audioProfile = new AudioProfile.AudioProfile();
        offsetController = new FileUtil.OffsetController;
        displayTime = new FileUtil.DisplayTime;
        view = new MainView();
        play = new Play.Play();

        params = Params.fill(params, { title: GLib.get_application_name(),
                                       default_height: 480,
                                       default_width: 780,
                                       height_request: 480,
                                       width_request: 640,
                                       hexpand: true,
                                       vexpand: true,
                                       icon_name: "org.gnome.SoundRecorder" });
        this.parent(params);

        header = new Gtk.HeaderBar({ hexpand: true,
                                     show_close_button: true });
        this.set_titlebar(header);
        header.get_style_context().add_class('titlebar');

        recordButton = new RecordButton({ label: _("Record") });
        recordButton.get_style_context().add_class('suggested-action');
        header.pack_start(recordButton);

        this._addAppMenu();

        this.add(view);
        this.show_all();
    },

    _addAppMenu: function() {
        let menu = new Gio.Menu();
        menu.append(_("Preferences"), 'app.preferences');
        menu.append(_("About Sound Recorder"), 'app.about');

        appMenuButton = new Gtk.MenuButton({
          image: new Gtk.Image({ icon_name: 'open-menu-symbolic' }),
          menu_model: menu
        });
        header.pack_end(appMenuButton);
    }
});

const MainView = new Lang.Class({
    Name: 'MainView',
    Extends: Gtk.Stack,

    _init: function(params) {
        params = Params.fill(params, { vexpand: true,
                                       transition_type: Gtk.StackTransitionType.CROSSFADE,
                                       transition_duration: 100,
                                       visible: true });
        this.parent(params);

        this._addListviewPage('listviewPage');
        this.labelID = null;
    },

    _addEmptyPage: function() {
        this.emptyGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                        hexpand: true,
                                        vexpand: true,
                                        halign: Gtk.Align.CENTER,
                                        valign: Gtk.Align.CENTER });
        this._scrolledWin.add(this.emptyGrid);

        let emptyPageImage = new Gtk.Image({ icon_name: 'audio-input-microphone-symbolic',
                                             icon_size: Gtk.IconSize.DIALOG });
        emptyPageImage.get_style_context().add_class('dim-label');
        this.emptyGrid.add(emptyPageImage);
        let emptyPageTitle = new Gtk.Label({ label: _("Add Recordings"),
                                             halign: Gtk.Align.CENTER,
                                             valign: Gtk.Align.CENTER });
        emptyPageTitle.get_style_context().add_class('dim-label');
        this.emptyGrid.add(emptyPageTitle);
        let emptyPageDirections = new Gtk.Label({ label: _("Use the <b>Record</b> button to make sound recordings"),
                                                  use_markup: true,
                                                  max_width_chars: 30,
                                                  halign: Gtk.Align.CENTER,
                                                  valign: Gtk.Align.CENTER });
        emptyPageDirections.get_style_context().add_class('dim-label');
        this.emptyGrid.add(emptyPageDirections);
        this.emptyGrid.show_all();
    },

    _addListviewPage: function(name) {
        list = new Listview.Listview();
        list.setListTypeNew();
        list.enumerateDirectory();
        this._record = new Record.Record(audioProfile);

        groupGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                   hexpand: true,
                                   vexpand: true });
        this.add_titled(groupGrid, name, "View");
    },

    onPlayStopClicked: function() {
        if (play.getPipeStates() == PipelineStates.PLAYING) {
            play.stopPlaying();
            let listRow = this.listBox.get_selected_row();
            let rowGrid = listRow.get_child();
            rowGrid.foreach((child) => {
                if (child.name == "PauseButton") {
                    child.hide();
                    child.sensitive = false;
                }
                else if (child.name == "PlayLabelBox") {
                    child.show();
                    child.foreach((grandchild) => {
                        if (grandchild.name == "PlayTimeLabel") {
                            grandchild.hide();
                        }

                        if (grandchild.name == "DividerLabel") {
                            grandchild.hide();
                        }
                    });
                }
                else {
                    child.show();
                    child.sensitive = true;
                }
            });
        }
    },

    onRecordStopClicked: function() {
        this._record.stopRecording();
        this.recordGrid.hide();
        recordPipeline = RecordPipelineStates.STOPPED;
        recordButton.set_sensitive(true);
        if (this.listBox != null)
            this.listBox.set_selection_mode(Gtk.SelectionMode.SINGLE);
    },

    _formatTime: function(unformattedTime) {
        this.unformattedTime = unformattedTime;
        let seconds = Math.floor(this.unformattedTime);
        let hours = parseInt(seconds / Math.pow(_TIME_DIVISOR, 2));
        let hoursString = ""

        if (hours > 10)
            hoursString = hours + ":"
        else if (hours < 10 && hours > 0)
            hoursString = "0" + hours + ":"

        let minuteString = parseInt(seconds / _TIME_DIVISOR) % _TIME_DIVISOR;
        let secondString = parseInt(seconds % _TIME_DIVISOR);
        let timeString =
            hoursString +
            (minuteString < 10 ? "0" + minuteString : minuteString)+
            ":" +
            (secondString < 10 ? "0" + secondString : secondString);

        return timeString;
    },

    _updatePositionCallback: function() {
        let position = MainWindow.play.queryPosition();

        if (position >= 0) {
            this.progressScale.set_value(position);
        }
        return true;
    },

    presetVolume: function(source, vol) {
        if (source == ActiveArea.PLAY) {
            volumeValue[0].play = vol;
            Application.application.setSpeakerVolume(vol);
        } else {
            volumeValue[0].record = vol;
            Application.application.setMicVolume(vol);
        }
    },

    setVolume: function() {
        if (setVisibleID == ActiveArea.PLAY) {
            play.setVolume(volumeValue[0].play);
        } else if (setVisibleID == ActiveArea.RECORD) {
           this._record.setVolume(volumeValue[0].record);
        }
    },

    getVolume: function() {
        let volumeValue = this.playVolume.get_value();

        return volumeValue;
    },

    listBoxAdd: function() {
        selectable = true;
        this.groupGrid = groupGrid;
        let playVolume = Application.application.getSpeakerVolume();
        let micVolume = Application.application.getMicVolume();
        volumeValue.push({ record: micVolume, play: playVolume });
        activeProfile = Application.application.getPreferences();

        this.recordGrid = new Gtk.Grid({ name: "recordGrid",
                                         orientation: Gtk.Orientation.HORIZONTAL });
        this.groupGrid.add(this.recordGrid);

        this.widgetRecord = new Gtk.Toolbar({ show_arrow: false,
                                              halign: Gtk.Align.END,
                                              valign: Gtk.Align.FILL,
                                              icon_size: Gtk.IconSize.BUTTON,
                                              opacity: 1 });
        this.recordGrid.attach(this.widgetRecord, 0, 0, 2, 2);

        this._boxRecord = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        this._groupRecord = new Gtk.ToolItem({ child: this._boxRecord });
        this.widgetRecord.insert(this._groupRecord, -1);

        this.recordTextLabel = new Gtk.Label({ margin_bottom: 4,
                                               margin_end: 6,
                                               margin_start: 6,
                                               margin_top: 6 });
        this.recordTextLabel.label = _("Recording…");
        this._boxRecord.pack_start(this.recordTextLabel, false, true, 0);

        this.recordTimeLabel = new Gtk.Label({ margin_bottom: 4,
                                               margin_end: 6,
                                               margin_start: 6,
                                               margin_top: 6});

        this._boxRecord.pack_start(this.recordTimeLabel, false, true, 0);

        this.toolbarStart = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, expand: false });
        this.toolbarStart.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);

        // finish button (stop recording)
        let stopRecord = new Gtk.Button({ label: _("Done"),
                                          halign: Gtk.Align.FILL,
                                          valign: Gtk.Align.CENTER,
                                          hexpand: true,
                                          margin_bottom: 4,
                                          margin_end: 6,
                                          margin_start: 6,
                                          margin_top: 6 });
        stopRecord.get_style_context().add_class('text-button');
        stopRecord.connect("clicked", () => this.onRecordStopClicked());
        this.toolbarStart.pack_start(stopRecord, true, true, 0);
        this.recordGrid.attach(this.toolbarStart, 5, 1, 2, 2);
    },

    scrolledWinAdd: function() {
        this._scrolledWin = new Gtk.ScrolledWindow({ vexpand: true });
        this._scrolledWin.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        this.scrollbar = this._scrolledWin.get_vadjustment();

        this.scrollbar.connect("value_changed", () => {
                this.currentBound = this.scrollbar.get_value();
                UpperBoundVal = this.scrollbar.upper - this.scrollbar.page_size;
                if (UpperBoundVal == this.currentBound && loadMoreButton == null) {
                    this.addLoadMoreButton();
                } else if (UpperBoundVal != this.currentBound && loadMoreButton) {
                    loadMoreButton.destroy();
                    loadMoreButton = null;
                }
            });

        this.groupGrid.add(this._scrolledWin);
        this._scrolledWin.show();
        let sounds = list.getItemCount();
        let title;
        if (sounds > 0) {
            // Translators: This is the title in the headerbar
            title = Gettext.ngettext("%d Recorded Sound",
                                     "%d Recorded Sounds",
                                      sounds).format(sounds);
        } else {
            title = _("No Recorded Sounds");
        }
        header.set_title(title);

        this.listBox = null;
        this._startIdx = 0;
        this._endIdx = offsetController.getEndIdx();

        if (this._endIdx == -1) {
            this._scrolledWin.get_style_context().add_class('emptyGrid');
            this._addEmptyPage();
        } else {
            this.listBox = new Gtk.ListBox({ vexpand: true });
            this._scrolledWin.add(this.listBox);
            this.listBox.set_selection_mode(Gtk.SelectionMode.SINGLE);
            this.listBox.set_header_func(null);
            this.listBox.set_activate_on_single_click(true);
            this.listBox.connect("row-selected", () => {
                this.rowGridCallback()
            });
            this.listBox.show();

            this._files = [];
            this._files = list.getFilesInfoForList();

            for (let i = this._startIdx; i <= this._endIdx; i++) {
                this.rowGrid = new Gtk.Grid({ name: i.toString(),
                                              height_request: 45,
                                              orientation: Gtk.Orientation.VERTICAL,
                                              hexpand: true,
                                              vexpand: true });
                this.rowGrid.set_orientation(Gtk.Orientation.HORIZONTAL);
                this.listBox.add(this.rowGrid);
                this.rowGrid.show();

                // play button
                this.playImage = new Gtk.Image({ name: "PlayImage" });
                this.playImage.set_from_icon_name('media-playback-start-symbolic', Gtk.IconSize.BUTTON);
                this._playListButton = new Gtk.Button({ name: "PlayButton",
                                                        hexpand: false,
                                                        vexpand: true });
                this._playListButton.set_image(this.playImage);
                this._playListButton.set_tooltip_text(_("Play"));
                this.rowGrid.attach(this._playListButton, 0, 0, 2, 2);
                this._playListButton.show();
                this._playListButton.connect('clicked', (button) => {
                    let row = button.get_parent().get_parent();
                    this.listBox.select_row(row);
                    play.passSelected(row);
                    let gridForName = row.get_child();
                    let idx = parseInt(gridForName.name);
                    let file = this._files[idx];
                    this.onPlayPauseToggled(row, file);
                });

                // pause button
                this.pauseImage = Gtk.Image.new();
                this.pauseImage.set_from_icon_name('media-playback-pause-symbolic', Gtk.IconSize.BUTTON);
                this._pauseListButton = new Gtk.Button({ name: "PauseButton",
                                                         hexpand: false,
                                                         vexpand: true });
                this._pauseListButton.set_image(this.pauseImage);
                this._pauseListButton.set_tooltip_text(_("Pause"));
                this.rowGrid.attach(this._pauseListButton, 0, 0, 2, 2);
                this._pauseListButton.hide();
                this._pauseListButton.connect('clicked', (button) => {
                    let row = button.get_parent().get_parent();
                    this.listBox.select_row(row);
                    this.onPause(row);
                });

                this._fileName = new Gtk.Label({ name: "FileNameLabel",
                                                 ellipsize: Pango.EllipsizeMode.END,
                                                 halign: Gtk.Align.START,
                                                 valign: Gtk.Align.START,
                                                 margin_start: 15,
                                                 margin_top: 5,
                                                 use_markup: true,
                                                 width_chars: 35,
                                                 xalign: 0 });
                let markup = ('<b>'+ this._files[i].fileName + '</b>');
                this._fileName.label = markup;
                this._fileName.set_no_show_all(true);
                this.rowGrid.attach(this._fileName, 3, 0, 10, 3);
                this._fileName.show();

                this._playLabelBox = new Gtk.Box({ name: "PlayLabelBox",
                                                   orientation: Gtk.Orientation.HORIZONTAL,
                                                   height_request: 45 });
                this.rowGrid.attach(this._playLabelBox, 3, 1, 5, 1);
                this._playLabelBox.show();
                this.playDurationLabel = new Gtk.Label({ name: "PlayDurationLabel",
                                                         halign: Gtk.Align.END,
                                                         valign: Gtk.Align.END,
                                                         margin_start: 15,
                                                         margin_top: 5 });
                this.fileDuration = this._formatTime(this._files[i].duration/Gst.SECOND);
                this.playDurationLabel.label = this.fileDuration;
                this._playLabelBox.pack_start(this.playDurationLabel, false, true, 0);
                this.playDurationLabel.show();

                this.dividerLabel = new Gtk.Label({ name: "DividerLabel",
                                                    halign: Gtk.Align.START,
                                                    valign: Gtk.Align.END,
                                                    margin_top: 5 });
                this.dividerLabel.label = "/";
                this._playLabelBox.pack_start(this.dividerLabel, false, true, 0);
                this.dividerLabel.hide();

                this.playTimeLabel = new Gtk.Label({ name: "PlayTimeLabel",
                                                     halign: Gtk.Align.START,
                                                     valign: Gtk.Align.END,
                                                     margin_end: 15,
                                                     margin_top: 5 });
                this.playTimeLabel.label = "0:00";
                this._playLabelBox.pack_start(this.playTimeLabel, false, true, 0);
                this.playTimeLabel.hide();

                //Date Modified label
                this.dateModifiedLabel = new Gtk.Label({ name: "DateModifiedLabel",
                                                         halign: Gtk.Align.END,
                                                         valign: Gtk.Align.END,
                                                         margin_start: 15,
                                                         margin_top: 5 });
                this.dateModifiedLabel.label = this._files[i].dateModified;
                this.dateModifiedLabel.get_style_context().add_class('dim-label');
                this.dateModifiedLabel.set_no_show_all(true);
                this.rowGrid.attach(this.dateModifiedLabel, 3, 1, 6, 1);
                this.dateModifiedLabel.show();

                this.waveFormGrid = new Gtk.Grid({ name: "WaveFormGrid",
                                                   hexpand: true,
                                                   vexpand: true,
                                                   orientation: Gtk.Orientation.VERTICAL,
                                                   valign: Gtk.Align.FILL });
                this.waveFormGrid.set_no_show_all(true);
                this.rowGrid.attach(this.waveFormGrid, 12, 1, 17, 2);
                this.waveFormGrid.show();

                // info button
                this._info = new Gtk.Button({ name: "InfoButton",
                                              hexpand: false,
                                              vexpand: true,
                                              margin_end: 2 });
                this._info.image = Gtk.Image.new_from_icon_name("dialog-information-symbolic", Gtk.IconSize.BUTTON);
                this._info.connect("clicked", (button) => {
                    let row = button.get_parent().get_parent();
                    this.listBox.select_row(row);
                    let gridForName = row.get_child();
                    let idx = parseInt(gridForName.name);
                    let file = this._files[idx];
                    this._onInfoButton(file);
                });
                this._info.set_tooltip_text(_("Info"));
                this.rowGrid.attach(this._info, 27, 0, 1, 2);
                this._info.hide();

                // delete button
                this._delete = new Gtk.Button({ name: "DeleteButton",
                                                hexpand: false,
                                                margin_start: 2, });
                this._delete.image = Gtk.Image.new_from_icon_name("user-trash-symbolic", Gtk.IconSize.BUTTON);
                this._delete.connect("clicked", (button) => {
                    let row = button.get_parent().get_parent();
                    this.listBox.select_row(row);
                    this._deleteFile(row);
                });
                this._delete.set_tooltip_text(_("Delete"));
                this.rowGrid.attach(this._delete, 28, 0, 1, 2);
                this._delete.hide();
            }
        }
        list.monitorListview();
    },

    addLoadMoreButton: function() {
       loadMoreButton = new LoadMoreButton();
       loadMoreButton.connect('clicked', () => loadMoreButton.onLoadMore());
       this.groupGrid.add(loadMoreButton);
       loadMoreButton.show();
    },

    destroyLoadMoreButton: function() {
        if (loadMoreButton != null) {
            loadMoreButton.destroy();
            loadMoreButton = null;
        }
    },

    listBoxRefresh: function() {
        this.destroyLoadMoreButton();
        previousSelRow = null;

        if (this.listBox) {
            this.listBox.set_selection_mode(Gtk.SelectionMode.NONE);
        }

        list.setListTypeRefresh();
        list.enumerateDirectory();
    },

    listBoxLoadMore: function() {
       this.destroyLoadMoreButton();
       previousSelRow = null;
       this.listBox.set_selection_mode(Gtk.SelectionMode.NONE);
       offsetController.increaseEndIdxStep();
       list.setListTypeRefresh();
       list._setDiscover();
    },

    scrolledWinDelete: function() {
        this._scrolledWin.destroy();
        this.scrolledWinAdd();
    },

    hasPreviousSelRow: function() {
        this.destroyLoadMoreButton();
        if (previousSelRow != null) {
            let rowGrid = previousSelRow.get_child();
            rowGrid.foreach((child) => {
                let alwaysShow = child.get_no_show_all();

                if (!alwaysShow)
                    child.hide();

                if (child.name == "PauseButton") {
                    child.hide();
                    child.sensitive = false;
                }
                if (child.name == "PlayButton") {
                    child.show();
                    child.sensitive = true;
                }

                if (child.name == "PlayLabelBox") {
                    child.show();
                    child.foreach((grandchild) => {
                        if (grandchild.name == "PlayTimeLabel") {
                            grandchild.hide();
                        }

                        if (grandchild.name == "DividerLabel") {
                            grandchild.hide();
                        }
                    });
                }
            });

            if (play.getPipeStates() == PipelineStates.PLAYING || play.getPipeStates()== PipelineStates.PAUSED) {
                play.stopPlaying();
            }
        }
        previousSelRow = null;
    },

    rowGridCallback: function() {
        let selectedRow = this.listBox.get_selected_row();
        this.destroyLoadMoreButton();

        if (selectedRow) {
            if (previousSelRow != null) {
                this.hasPreviousSelRow();
            }

            previousSelRow = selectedRow;
            let selectedRowGrid = previousSelRow.get_child();
            selectedRowGrid.show_all();
            selectedRowGrid.foreach((child) => {
                let alwaysShow = child.get_no_show_all();

                if (!alwaysShow)
                    child.sensitive = true;

                if (child.name == "PauseButton") {
                    child.hide();
                    child.sensitive = false;
                }

                if (child.name == "WaveFormGrid")
                    child.sensitive = true;
            });
        }
    },

    _getFileFromRow: function(selected) {

        let fileForAction = null;
        let rowGrid = selected.get_child();
        rowGrid.foreach((child) => {
            if (child.name == "FileNameLabel") {
                let name = child.get_text();
                let application = Gio.Application.get_default();
                fileForAction = application.saveDir.get_child_for_display_name(name);
            }
        });

        return fileForAction;
    },

    _deleteFile: function(selected) {
        let fileToDelete = this._getFileFromRow(selected);
        fileToDelete.trash_async(GLib.PRIORITY_DEFAULT, null, null);
    },

    loadPlay: function(selected) {
        let fileToPlay = this._getFileFromRow(selected);

        return fileToPlay;
    },

    _onInfoButton: function(selected) {
        let infoDialog = new Info.InfoDialog(selected);

        infoDialog.widget.connect('response', (widget, response) => {
            infoDialog.widget.destroy();
        });
    },

    setLabel: function(time) {
        this.time = time

        this.timeLabelString = this._formatTime(time);

        if (setVisibleID == ActiveArea.RECORD) {
            this.recordTimeLabel.label = this.timeLabelString;
            this.recordTimeLabel.get_style_context().add_class('dim-label');
        } else if (setVisibleID == ActiveArea.PLAY) {
            this.playTimeLabel.label = this.timeLabelString;
        }
    },

    setNameLabel: function(newName, oldName, index) {

        let selected = this.listBox.get_row_at_index(index);
        let rowGrid = selected.get_child();
        rowGrid.foreach((child) => {
            if (child.name == "FileNameLabel") {
                let name = child.get_text();
                let markup = ('<b>'+ newName + '</b>');
                child.label = markup;
            }
        });
        rowGrid.set_name(newName);
    },

    onPause: function(listRow) {
        let activeState = play.getPipeStates();

        if (activeState == PipelineStates.PLAYING) {
            play.pausePlaying();

            let rowGrid = listRow.get_child();
            rowGrid.foreach((child) => {
                if (child.name == "PauseButton") {
                    child.hide();
                    child.sensitive = false;
                }

                if (child.name == "PlayButton") {
                    child.show();
                    child.sensitive = true;
                }
            });
        }
    },

    onPlayPauseToggled: function(listRow, selFile) {
        setVisibleID = ActiveArea.PLAY;
        let activeState = play.getPipeStates();

        if (activeState != PipelineStates.PLAYING) {
            play.startPlaying();


            let rowGrid = listRow.get_child();
            rowGrid.foreach((child) => {
                if (child.name == "InfoButton" || child.name == "DeleteButton" ||
                    child.name == "PlayButton") {
                    child.hide();
                    child.sensitive = false;
                }

                if (child.name == "PauseButton") {
                    child.show();
                    child.sensitive = true;
                }

                if (child.name == "PlayLabelBox") {
                    child.foreach((grandchild) => {
                        if (grandchild.name == "PlayTimeLabel") {
                            view.playTimeLabel = grandchild;
                        }

                        if (grandchild.name == "DividerLabel") {
                            grandchild.show();
                        }
                    });
                }

                if (child.name == "WaveFormGrid") {
                    this.wFGrid = child;
                    child.sensitive = true;
                }
            });

            if (activeState != PipelineStates.PAUSED) {
                wave = new Waveform.WaveForm(this.wFGrid, selFile);
            }
        }
    }
});

const RecordButton = new Lang.Class({
    Name: "RecordButton",
    Extends: Gtk.Button,

    _init: function(activeProfile) {
        this.parent();
        this.image = Gtk.Image.new_from_icon_name('media-record-symbolic', Gtk.IconSize.BUTTON);
        this.set_always_show_image(true);
        this.set_valign(Gtk.Align.CENTER);
        this.set_label(_("Record"));
        this.get_style_context().add_class('text-button');
        this.connect("clicked", () => this._onRecord());
    },

    _onRecord: function() {
        view.destroyLoadMoreButton();
        view.hasPreviousSelRow();

        if (view.listBox) {
            view.listBox.set_selection_mode(Gtk.SelectionMode.NONE);
        } else {
            view.emptyGrid.destroy();
        }

        this.set_sensitive(false);
        setVisibleID = ActiveArea.RECORD;
        view.recordGrid.show_all();

        if (activeProfile == null)
            activeProfile = 0;

        audioProfile.profile(activeProfile);
        view._record.startRecording(activeProfile);
        wave = new Waveform.WaveForm(view.recordGrid, null);
    }
});

var EncoderComboBox = new Lang.Class({
    Name: "EncoderComboBox",
    Extends: Gtk.ComboBoxText,

    // encoding setting labels in combobox
    _init: function() {
        this.parent();
        let combo = [_("Ogg Vorbis"), _("Opus"), _("FLAC"), _("MP3"), _("MOV")];

        for (let i = 0; i < combo.length; i++)
            this.append_text(combo[i]);
        this.set_property('valign', Gtk.Align.CENTER);
        this.set_sensitive(true);
        activeProfile = Application.application.getPreferences();
        this.set_active(activeProfile);
        this.connect("changed", () => this._onComboBoxTextChanged());
    },

    _onComboBoxTextChanged: function() {
        activeProfile = this.get_active();
        Application.application.setPreferences(activeProfile);
    }
});

var ChannelsComboBox = new Lang.Class({
    Name: "ChannelsComboBox",
    Extends: Gtk.ComboBoxText,

    // channel setting labels in combobox
    _init: function() {
        this.parent();
        let combo = [_("Mono"), _("Stereo")];

        for (let i = 0; i < combo.length; i++)
            this.append_text(combo[i]);
        this.set_property('valign', Gtk.Align.CENTER);
        this.set_sensitive(true);
        let chanProfile = Application.application.getChannelsPreferences();
        this.set_active(chanProfile);
        this.connect("changed", () => this._onChannelComboBoxTextChanged());
    },

    _onChannelComboBoxTextChanged: function() {
        let channelProfile = this.get_active();
        Application.application.setChannelsPreferences(channelProfile);
    }
});

const LoadMoreButton = new Lang.Class({
    Name: 'LoadMoreButton',
    Extends: Gtk.Button,

    _init: function() {
        this.parent();
        this._block = false;
        this.label = _("Load More");
        this.get_style_context().add_class('documents-load-more');
    },

    onLoadMore: function() {
        view.listBoxLoadMore();
    }
});
