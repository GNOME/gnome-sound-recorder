/* exported SIGINT SIGTERM application Application */
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

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gst = imports.gi.Gst;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;

const MainWindow = imports.mainWindow;
const Preferences = imports.preferences;

var SIGINT = 2;
var SIGTERM = 15;

var application = null;
let settings = null;

var Application = GObject.registerClass(class Application extends Gtk.Application {
    _init() {
        super._init({ application_id: pkg.name });
        GLib.set_application_name(_("SoundRecorder"));
    }

    _initAppMenu() {
        let preferences = new Gio.SimpleAction({ name: 'preferences' });
        preferences.connect('activate', () => {
            this._showPreferences();
        });
        this.add_action(preferences);

        let aboutAction = new Gio.SimpleAction({ name: 'about' });
        aboutAction.connect('activate', () => {
            this._showAbout();
        });
        this.add_action(aboutAction);

        let quitAction = new Gio.SimpleAction({ name: 'quit' });
        quitAction.connect('activate', () => {
            this.quit();
        });
        this.add_action(quitAction);
        this.add_accelerator('<Primary>q', 'app.quit', null);
    }

    vfunc_startup() {
        super.vfunc_startup();

        this._loadStyleSheet();
        log(_("Sound Recorder started"));
        Gst.init(null);
        this._initAppMenu();
        application = this;
        settings = new Gio.Settings({ schema: pkg.name });
        this.ensure_directory();
    }

    ensure_directory() {
        /* Translators: "Recordings" here refers to the name of the directory where the application places files */
        let path = GLib.build_filenamev([GLib.get_home_dir(), _("Recordings")]);

        // Ensure Recordings directory
        GLib.mkdir_with_parents(path, parseInt("0755", 8));
        this.saveDir = Gio.file_new_for_path(path);
    }

    vfunc_activate() {
        (this.window = new MainWindow.MainWindow({ application: this })).show();
        if (pkg.name.endsWith('Devel'))
            this.window.get_style_context().add_class("devel");
    }

    onWindowDestroy() {
        if (MainWindow.wave.pipeline)
            MainWindow.wave.pipeline.set_state(Gst.State.NULL);
        if (MainWindow._record.pipeline)
            MainWindow._record.pipeline.set_state(Gst.State.NULL);

        if (MainWindow.play.play)
            MainWindow.play.play.set_state(Gst.State.NULL);
    }

    _showPreferences() {
        let preferencesDialog = new Preferences.Preferences();

        preferencesDialog.widget.connect('response', (widget, response) => {
            preferencesDialog.widget.destroy();
        });
    }

    getPreferences() {
        let set = settings.get_int("media-type-preset");
        return set;
    }

    setPreferences(profileName) {
        settings.set_int("media-type-preset", profileName);
    }

    getChannelsPreferences() {
        let set = settings.get_int("channel");
        return set;
    }

    setChannelsPreferences(channel) {
        settings.set_int("channel", channel);
    }

    getMicVolume() {
        let micVolLevel = settings.get_double("mic-volume");
        return micVolLevel;
    }

    setMicVolume(level) {
         settings.set_double("mic-volume", level);
    }

    getSpeakerVolume() {
        let speakerVolLevel = settings.get_double("speaker-volume");
        return speakerVolLevel;
    }

    setSpeakerVolume(level) {
         settings.set_double("speaker-volume", level);
    }

    _loadStyleSheet() {
        let provider = new Gtk.CssProvider();
        provider.load_from_resource('/org/gnome/SoundRecorder/application.css');
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    }

    _showAbout() {
        let aboutDialog = new Gtk.AboutDialog();
        aboutDialog.artists = [ 'Reda Lazri <the.red.shortcut@gmail.com>',
                                'Garrett LeSage <garrettl@gmail.com>',
                                'Hylke Bons <hylkebons@gmail.com>',
                                'Sam Hewitt <hewittsamuel@gmail.com>' ];
        aboutDialog.authors = [ 'Meg Ford <megford@gnome.org>' ];
        /* Translators: Replace "translator-credits" with your names, one name per line */
        aboutDialog.translator_credits = _("translator-credits");
        aboutDialog.program_name = _("Sound Recorder");
        aboutDialog.copyright = 'Copyright ' + String.fromCharCode(0x00A9) + ' 2013' + String.fromCharCode(0x2013) + 'Meg Ford';
        aboutDialog.license_type = Gtk.License.GPL_2_0;
        aboutDialog.logo_icon_name = pkg.name;
        aboutDialog.version = pkg.version;
        aboutDialog.website = 'https://wiki.gnome.org/Apps/SoundRecorder';
        aboutDialog.wrap_license = true;
        aboutDialog.modal = true;
        aboutDialog.transient_for = this.window;

        aboutDialog.show();
        aboutDialog.connect('response', function() {
            aboutDialog.destroy();
        });
    }
});
