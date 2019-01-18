/* exported Preferences */
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
const Gtk = imports.gi.Gtk;

const _ = imports.gettext.gettext;
const C_ = imports.gettext.pgettext;

const MainWindow = imports.mainWindow;
const Main = imports.main;

let formatComboBoxText = null;
let channelsComboBoxText = null;
let recordVolume= null;
let playVolume = null;

var Preferences = class Preferences {
    constructor() {
        this.widget = new Gtk.Dialog ({ title: _("Preferences"),
                                        resizable: false,
                                        modal: true,
                                        destroy_with_parent: true,
                                        default_width: 400,
                                        margin_top: 5,
                                        use_header_bar: 1,
                                        hexpand: true });

        this.widget.set_transient_for(Gio.Application.get_default().get_active_window());

        let grid = new Gtk.Grid ({ orientation: Gtk.Orientation.VERTICAL,
                                   row_homogeneous: true,
                                   column_homogeneous: true,
                                   halign: Gtk.Align.CENTER,
                                   row_spacing: 6,
                                   column_spacing: 24,
                                   margin_bottom: 12,
                                   margin_end: 24,
                                   margin_start: 24,
                                   margin_top: 12 });
        let contentArea = this.widget.get_content_area();
        contentArea.pack_start(grid, true, true, 2);

        let formatLabel = new Gtk.Label({ label: _("Preferred format"),
                                          halign: Gtk.Align.END });
        formatLabel.get_style_context().add_class('dim-label');
        grid.attach(formatLabel, 0, 0, 2, 1);

        formatComboBoxText = new MainWindow.EncoderComboBox();
        grid.attach(formatComboBoxText, 2, 0, 2, 1);

        let channelsLabel = new Gtk.Label({ label: _("Default mode"),
                                            halign: Gtk.Align.END });
        channelsLabel.get_style_context().add_class('dim-label');
        grid.attach(channelsLabel, 0, 1, 2, 1);

        channelsComboBoxText = new MainWindow.ChannelsComboBox();
        grid.attach(channelsComboBoxText, 2, 1, 2, 1);

        let volumeLabel = new Gtk.Label({ label: _("Volume"),
                                          halign: Gtk.Align.END });
        volumeLabel.get_style_context().add_class('dim-label');
        grid.attach(volumeLabel, 0, 2, 2, 1);

        playVolume = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL });
        this.playRange = Gtk.Adjustment.new(MainWindow.volumeValue[0].play, 0, 1.0, 0.05, 0.0, 0.0);
        playVolume.set_adjustment(this.playRange);
        playVolume.set_sensitive(true);
        playVolume.connect("value-changed", () => {
            MainWindow.view.presetVolume(MainWindow.ActiveArea.PLAY, playVolume.get_value());
        });
        grid.attach(playVolume, 2, 2, 2, 1);

        let micVolLabel = new Gtk.Label({ label: _("Microphone"),
                                          halign: Gtk.Align.END });
        micVolLabel.get_style_context().add_class('dim-label');
        grid.attach(micVolLabel, 0, 3, 2, 1);

        recordVolume = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL });
        this.recordRange = Gtk.Adjustment.new(MainWindow.volumeValue[0].record, 0, 1.0, 0.05, 0.0, 0.0);
        recordVolume.set_adjustment(this.recordRange);
        recordVolume.set_sensitive(true);
        recordVolume.connect("value-changed", () => {
            MainWindow.view.presetVolume(MainWindow.ActiveArea.RECORD, recordVolume.get_value());
        });
        grid.attach(recordVolume, 2, 3, 2, 1);

        this.widget.show_all();
    }

    onDoneClicked() {
        this.widget.destroy();
    }
}
