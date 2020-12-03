/* exported Application RecordingsDir CacheDir Settings */
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

const { Gdk, Gio, GLib, GObject, Gst, Gtk, Handy } = imports.gi;

var RecordingsDir = Gio.file_new_for_path(GLib.build_filenamev([GLib.get_user_data_dir(), pkg.name]));
var CacheDir = Gio.file_new_for_path(GLib.build_filenamev([GLib.get_user_cache_dir(), pkg.name]));
var Settings = new Gio.Settings({ schema: pkg.name });

const { Window } = imports.window;

var Application = GObject.registerClass(class Application extends Gtk.Application {
    _init() {
        super._init({ application_id: pkg.name });
        GLib.set_application_name(_('Sound Recorder'));
        GLib.set_prgname('gnome-sound-recorder');
        GLib.setenv('PULSE_PROP_media.role', 'production', 1);
        GLib.setenv('PULSE_PROP_application.icon_name', pkg.name, 1);

        this.add_main_option('version', 'v'.charCodeAt(0), GLib.OptionFlags.NONE, GLib.OptionArg.NONE,
            'Print version information and exit', null);

        this.connect('handle-local-options', (app, options) => {
            if (options.contains('version')) {
                print(pkg.version);
                /* quit the invoked process after printing the version number
                 * leaving the running instance unaffected
                 */
                return 0;
            }
            return -1;
        });
    }

    _initAppMenu() {
        const profileAction = Settings.create_action('audio-profile');
        this.add_action(profileAction);

        const channelAction = Settings.create_action('audio-channel');
        this.add_action(channelAction);

        let aboutAction = new Gio.SimpleAction({ name: 'about' });
        aboutAction.connect('activate', this._showAbout.bind(this));
        this.add_action(aboutAction);

        let quitAction = new Gio.SimpleAction({ name: 'quit' });
        quitAction.connect('activate', () => {
            this.get_active_window().close();
        });
        this.add_action(quitAction);

        this.set_accels_for_action('app.quit', ['<Primary>q']);
        this.set_accels_for_action('win.open-primary-menu', ['F10']);
        this.set_accels_for_action('win.show-help-overlay', ['<Primary>question']);
        this.set_accels_for_action('recorder.start', ['<Primary>r']);
        this.set_accels_for_action('recorder.pause', ['space']);
        this.set_accels_for_action('recorder.resume', ['space']);
        this.set_accels_for_action('recorder.cancel', ['Delete']);
        this.set_accels_for_action('recorder.stop', ['s']);
        /* TODO: Fix recording.* keybindings */
        this.set_accels_for_action('recording.play', ['space']);
        this.set_accels_for_action('recording.pause', ['space']);
        this.set_accels_for_action('recording.seek-backward', ['b']);
        this.set_accels_for_action('recording.seek-forward', ['n']);
        this.set_accels_for_action('recording.rename', ['F2']);
        this.set_accels_for_action('recording.delete', ['Delete']);
        this.set_accels_for_action('recording.export', ['<Primary>s']);
    }

    vfunc_startup() {
        super.vfunc_startup();
        log('Sound Recorder (%s)'.format(pkg.name));
        log('Version: %s'.format(pkg.version));

        let provider = new Gtk.CssProvider();
        provider.load_from_resource('/org/gnome/SoundRecorder/application.css');
        Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(),
            provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        this.set_resource_base_path('/org/gnome/SoundRecorder/');
        Handy.init();
        Gst.init(null);

        try {
            CacheDir.make_directory_with_parents(null);
            RecordingsDir.make_directory_with_parents(null);
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                error(`Failed to create directory ${e}`);

        }
        this._initAppMenu();
    }

    vfunc_activate() {
        this.window = new Window({ application: this });
        if (pkg.name.endsWith('Devel'))
            this.window.get_style_context().add_class('devel');
        this.window.show();
    }

    _showAbout() {
        let aboutDialog = new Gtk.AboutDialog({
            artists: ['Reda Lazri <the.red.shortcut@gmail.com>',
                'Garrett LeSage <garrettl@gmail.com>',
                'Hylke Bons <hylkebons@gmail.com>',
                'Sam Hewitt <hewittsamuel@gmail.com>'],
            authors: ['Meg Ford <megford@gnome.org>',
                'Bilal Elmoussaoui <bil.elmoussaoui@gmail.com>',
                'Felipe Borges <felipeborges@gnome.org>',
                'Kavan Mevada <kavanmevada@gmail.com>'],
            /* Translators: Replace "translator-credits" with your names, one name per line */
            translator_credits: _('translator-credits'),
            program_name: GLib.get_application_name(),
            comments: _('A Sound Recording Application for GNOME'),
            license_type: Gtk.License.GPL_2_0,
            logo_icon_name: pkg.name,
            version: pkg.version,
            website: 'https://wiki.gnome.org/Apps/SoundRecorder',
            copyright: 'Copyright 2013-2019 Meg Ford\nCopyright 2019-2020 Bilal Elmoussaoui & Felipe Borges',
            wrap_license: true,
            modal: true,
            transient_for: this.window,
        });
        aboutDialog.show();
    }
});
