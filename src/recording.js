/* exported Recording */
const { Gio, GLib, GObject, GstPbutils } = imports.gi;
const { CacheDir } = imports.application;
const ByteArray = imports.byteArray;

var Recording = new GObject.registerClass({
    Signals: {
        'peaks-updated': {},
    },
    Properties: {
        'duration': GObject.ParamSpec.int(
            'duration',
            'Recording Duration', 'Recording duration in seconds',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXINT16, 0),
        'name': GObject.ParamSpec.string(
            'name',
            'Recording Name', 'Recording name in string',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            null),
    },
}, class Recording extends GObject.Object {
    _init(file) {
        this._file = file;
        this._peaks = [];
        super._init({});

        let info = file.query_info('time::created,time::modified', 0, null);

        let timeModified = info.get_attribute_uint64('time::modified');
        let timeCreated = info.get_attribute_uint64('time::created');
        this._timeModified = GLib.DateTime.new_from_unix_local(timeModified);
        this._timeCreated = GLib.DateTime.new_from_unix_local(timeCreated);

        this.readPeaks();

        var discoverer = new GstPbutils.Discoverer();
        discoverer.start();
        discoverer.connect('discovered', (_discoverer, audioInfo) => {
            this._duration = audioInfo.get_duration();
            this.notify('duration');
        });

        discoverer.discover_uri_async(this.uri);
    }

    get name() {
        return this._file.get_basename();
    }

    set name(filename) {
        if (filename && filename !== this.name) {
            this._file = this._file.set_display_name(filename, null);
            this.notify('name');
        }
    }

    get timeModified() {
        return this._timeModified;
    }

    get timeCreated() {
        return this._timeCreated;
    }

    get duration() {
        if (this._duration)
            return this._duration;
        else
            return undefined;
    }

    get file() {
        return this._file;
    }

    get uri() {
        return this._file.get_uri();
    }

    // eslint-disable-next-line camelcase
    set peaks(data) {
        if (data.length > 0) {
            this._peaks = data;
            this.emit('peaks-updated');
            const buffer = new GLib.Bytes(JSON.stringify(data));
            this.waveformCache.replace_contents_bytes_async(buffer, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null, (obj, res) => {
                obj.replace_contents_finish(res);
            });
        }
    }

    // eslint-disable-next-line camelcase
    get peaks() {
        return this._peaks;
    }

    delete() {
        this._file.trash_async(GLib.PRIORITY_HIGH, null, null);
        this.waveformCache.trash_async(GLib.PRIORITY_DEFAULT, null, null);
    }

    get waveformCache() {
        return CacheDir.get_child(`${this.name}_data`);
    }

    readPeaks() {
        if (this.waveformCache.query_exists(null)) {
            this.waveformCache.load_bytes_async(null, (obj, res) => {
                const bytes = obj.load_bytes_finish(res)[0];
                try {
                    this._peaks = JSON.parse(ByteArray.toString(bytes.get_data()));
                    this.emit('peaks-updated');
                } catch (error) {
                    log(`Error reading waveform data file: ${this.name}_data`);
                }
            });
        }
    }

});
