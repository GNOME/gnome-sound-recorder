/* exported Row */
const { Gdk, Gio, GObject, Gst, Gtk } = imports.gi;
const { displayDateTime, formatTime } = imports.utils;
const { WaveForm, WaveType } = imports.waveform;

var RowState = {
    PLAYING: 0,
    PAUSED: 1,
};

var Row = GObject.registerClass({
    Template: 'resource:///org/gnome/SoundRecorder/ui/row.ui',
    InternalChildren: ['playbackStack', 'mainStack', 'playButton', 'waveformStack', 'pauseButton', 'name', 'entry', 'date', 'duration', 'revealer', 'playbackControls', 'rightStack', 'squeezer', 'saveBtn', 'renameBtn', 'exportBtn', 'saveBtn', 'rightStack', 'seekBackward', 'seekForward', 'optionBtn', 'deleteBtn'],
    Signals: {
        'play': { param_types: [GObject.TYPE_STRING] },
        'pause': {},
        'seek-backward': {},
        'seek-forward': {},
        'deleted': {},
    },
    Properties: {
        'expanded': GObject.ParamSpec.boolean(
            'expanded',
            'Row active status', 'Row active status',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
    },
}, class Row extends Gtk.ListBoxRow {
    _init(recording) {
        this._recording = recording;
        this._expanded = false;
        super._init({});

        this.waveform = new WaveForm({
            hexpand: true,
            halign: Gtk.Align.FILL,
            margin_bottom: 24,
            height_request: 60,
            margin_left: 12,
            margin_right: 12,
        }, WaveType.PLAYER);
        this._waveformStack.add_named(this.waveform, 'wave');

        recording.bind_property('name', this._name, 'label', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);
        recording.bind_property('name', this._entry, 'text', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);
        this.bind_property('expanded', this._revealer, 'reveal_child', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);

        this._editMode = false;

        let actionGroup = new Gio.SimpleActionGroup();

        let renameAction = new Gio.SimpleAction({ name: 'rename' });
        let exportAction = new Gio.SimpleAction({ name: 'export' });

        exportAction.connect('activate', () => {
            const dialog = Gtk.FileChooserNative.new(_('Export Recording'), null, Gtk.FileChooserAction.SAVE, _('_Export'), _('_Cancel'));
            dialog.set_current_name(this._recording.name);
            dialog.connect('response', (_dialog, _response) => {
                if (_response === Gtk.ResponseType.ACCEPT) {
                    const dest = dialog.get_file();
                    this._recording.save(dest);
                }
                _dialog.destroy();
            });

            dialog.run();
        });

        renameAction.connect('activate', () => {
            this.editMode = true;
        });

        actionGroup.add_action(renameAction);
        actionGroup.add_action(exportAction);
        this.insert_action_group('recording', actionGroup);


        this._entry.connect('key-press-event', (_, event) => {
            const key = event.get_keyval()[1];
            this._entry.get_style_context().remove_class('error');

            if (key === Gdk.KEY_Escape)
                this.editMode = false;
        });

        if (recording.timeCreated > 0)
            this._date.label = displayDateTime(recording.timeCreated);
        else
            this._date.label = displayDateTime(recording.timeModified);

        this.waveform.peaks = this._recording.peaks;
        this._recording.connect('peaks-updated', _ => {
            this._waveformStack.visible_child_name = 'wave';
            this.waveform.peaks = this._recording.peaks;
        });

        this._recording.connect('peaks-loading', _ => {
            this._waveformStack.visible_child_name = 'loading';
        });

        recording.connect('notify::duration', () => {
            this._duration.label = formatTime(recording.duration / Gst.SECOND);
        });

        this.waveform.connect('button-press-event', _ => {
            this.emit('pause');
            this.state = RowState.PAUSED;
        });

        this._playButton.connect('clicked', () => {
            this.emit('play', recording.uri);
            this.state = RowState.PLAYING;
        });

        this._pauseButton.connect('clicked', () => {
            this.emit('pause');
            this.state = RowState.PAUSED;
        });

        this._seekBackward.connect('clicked', _ => this.emit('seek-backward'));
        this._seekForward.connect('clicked', _ => this.emit('seek-forward'));

        this._deleteBtn.connect('clicked', () => {
            recording.delete();
            this.emit('deleted');
        });
    }

    onSaveRecording() {
        try {
            if (this._name.label !== this._entry.text)
                this._recording.name = this._entry.text;

            this.editMode = false;
            this._entry.get_style_context().remove_class('error');
        } catch (e) {
            this._entry.get_style_context().add_class('error');
        }
    }

    set editMode(state) {
        this._mainStack.visible_child_name = state ? 'edit' : 'display';
        this._editMode = state;

        if (state) {
            if (!this.expanded)
                this.activate();

            this._entry.grab_focus();
            this._saveBtn.grab_default();
            this._rightStack.visible_child_name = 'save';
        } else {
            this._rightStack.visible_child_name = 'options';
        }
    }

    get editMode() {
        return this._editMode;
    }

    set expanded(state) {
        this._expanded = state;
        this.notify('expanded');
    }

    get expanded() {
        return this._expanded;
    }

    set state(rowState) {
        this._state = rowState;

        switch (rowState) {
        case RowState.PLAYING:
            this._playbackStack.visible_child_name = 'pause';
            break;
        case RowState.PAUSED:
            this._playbackStack.visible_child_name = 'play';
            break;
        }
    }

    get state() {
        return this._state;
    }
});
