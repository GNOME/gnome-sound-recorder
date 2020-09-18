/* exported Row */
const { Gdk, Gio, GObject, Gtk } = imports.gi;
const { displayDateTime, formatTime } = imports.utils;
const { WaveForm, WaveType } = imports.waveform;

var RowState = {
    PLAYING: 0,
    PAUSED: 1,
};

var Row = GObject.registerClass({
    Template: 'resource:///org/gnome/SoundRecorder/ui/row.ui',
    InternalChildren: [
        'playbackStack', 'mainStack', 'waveformStack', 'rightStack',
        'name', 'entry', 'date', 'duration', 'revealer', 'playbackControls',
        'saveBtn', 'playBtn', 'pauseBtn',
    ],
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
        this._editMode = false;

        super._init({});

        this.waveform = new WaveForm({
            hexpand: true,
            halign: Gtk.Align.FILL,
            margin_top: 18,
            height_request: 60,
            margin_start: 12,
            margin_end: 12,
        }, WaveType.PLAYER);
        this._waveformStack.add_named(this.waveform, 'wave');

        if (this._recording._peaks.length > 0) {
            this.waveform.peaks = this._recording.peaks;
            this._waveformStack.visible_child_name = 'wave';
        } else {
            this._recording.loadPeaks();
        }

        if (recording.timeCreated > 0)
            this._date.label = displayDateTime(recording.timeCreated);
        else
            this._date.label = displayDateTime(recording.timeModified);

        recording.bind_property('name', this._name, 'label', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);
        recording.bind_property('name', this._entry, 'text', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);
        this.bind_property('expanded', this._revealer, 'reveal_child', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);

        this.actionGroup = new Gio.SimpleActionGroup();

        let exportAction = new Gio.SimpleAction({ name: 'export' });
        exportAction.connect('activate', () => {
            const window = Gio.Application.get_default().get_active_window();
            const dialog = Gtk.FileChooserNative.new(_('Export Recording'), window, Gtk.FileChooserAction.SAVE, _('_Export'), _('_Cancel'));
            dialog.set_current_name(`${this._recording.name}.${this._recording.extension}`);
            dialog.connect('response', (_dialog, response) => {
                if (response === Gtk.ResponseType.ACCEPT) {
                    const dest = dialog.get_file();
                    this._recording.save(dest);
                }
                dialog.destroy();
            });
            dialog.show();
        });
        this.actionGroup.add_action(exportAction);

        let saveRenameAction = new Gio.SimpleAction({ name: 'save', enabled: false });
        saveRenameAction.connect('activate', this.onRenameRecording.bind(this));
        this.actionGroup.add_action(saveRenameAction);

        this.renameAction = new Gio.SimpleAction({ name: 'rename', enabled: true });
        this.renameAction.connect('activate', action => {
            this.editMode = true;
            action.enabled = false;
        });
        this.renameAction.bind_property('enabled', saveRenameAction, 'enabled', GObject.BindingFlags.INVERT_BOOLEAN);
        this.actionGroup.add_action(this.renameAction);

        let pauseAction = new Gio.SimpleAction({ name: 'pause', enabled: false });
        pauseAction.connect('activate', () => {
            this.emit('pause');
            this.state = RowState.PAUSED;
        });
        this.actionGroup.add_action(pauseAction);

        let playAction = new Gio.SimpleAction({ name: 'play', enabled: true });
        playAction.connect('activate', () => {
            this.emit('play', this._recording.uri);
            this.state = RowState.PLAYING;
        });
        this.actionGroup.add_action(playAction);

        let deleteAction = new Gio.SimpleAction({ name: 'delete' });
        deleteAction.connect('activate', () => {
            this.emit('deleted');
        });
        this.actionGroup.add_action(deleteAction);

        let seekBackAction = new Gio.SimpleAction({ name: 'seek-backward' });
        seekBackAction.connect('activate', () => {
            this.emit('seek-backward');
        });
        this.actionGroup.add_action(seekBackAction);

        let seekForwardAction = new Gio.SimpleAction({ name: 'seek-forward' });
        seekForwardAction.connect('activate', () => {
            this.emit('seek-forward');
        });
        this.actionGroup.add_action(seekForwardAction);

        this.insert_action_group('recording', this.actionGroup);

        this.waveform.connect('button-press-event', _ => {
            pauseAction.activate(null);
        });

        this._entry.connect('key-press-event', (_, event) => {
            const key = event.get_keyval()[1];
            this._entry.get_style_context().remove_class('error');

            if (key === Gdk.KEY_Escape)
                this.editMode = false;
        });

        this._recording.connect('peaks-updated', _recording => {
            this._waveformStack.visible_child_name = 'wave';
            this.waveform.peaks = _recording.peaks;
        });

        this._recording.connect('peaks-loading', _ => {
            this._waveformStack.visible_child_name = 'loading';
        });

        // Force LTR, we don't want forward/play/backward
        this._playbackControls.direction = Gtk.TextDirection.LTR;

        // Force LTR, we don't want reverse hh:mm::ss
        this._duration.direction = Gtk.TextDirection.LTR;
        this._duration.markup = formatTime(recording.duration);
        recording.connect('notify::duration', () => {
            this._duration.label = formatTime(recording.duration);
        });
    }

    onRenameRecording() {
        try {
            if (this._name.label !== this._entry.text)
                this._recording.name = this._entry.text;

            this.editMode = false;
            this.renameAction.enabled = true;
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
            this.grab_focus();
        }

        for (const action of this.actionGroup.list_actions()) {
            if (action !== 'save')
                this.actionGroup.lookup(action).enabled = !state;
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
            this.actionGroup.lookup('play').enabled = false;
            this.actionGroup.lookup('pause').enabled = true;
            this._playbackStack.visible_child_name = 'pause';
            this._pauseBtn.grab_focus();
            break;
        case RowState.PAUSED:
            this.actionGroup.lookup('play').enabled = true;
            this.actionGroup.lookup('pause').enabled = false;
            this._playbackStack.visible_child_name = 'play';
            this._playBtn.grab_focus();
            break;
        }
    }

    get state() {
        return this._state;
    }
});
