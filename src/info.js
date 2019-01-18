/* exported InfoDialog */
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

var InfoDialog = class InfoDialog {
    constructor(fileNav) {
        let fileName = fileNav;

        this._file = Gio.File.new_for_uri(fileNav.uri);

        this.widget = new Gtk.Dialog ({ resizable: false,
                                        modal: true,
                                        destroy_with_parent: true,
                                        default_width: 400 });
        this.widget.set_transient_for(Gio.Application.get_default().get_active_window());
        let header = new Gtk.HeaderBar({ title: _("Info") });
        header.set_show_close_button(false);
        this.widget.set_titlebar(header);


        let cancelButton = new Gtk.Button({ label: _("Cancel") });
        cancelButton.connect("clicked", () => this.onCancelClicked());

        header.pack_start(cancelButton);

        let doneButton = new Gtk.Button({ label: _("Done") });
        doneButton.connect("clicked", () => this.onDoneClicked());

        header.pack_end(doneButton);

        let headerBarSizeGroup = new Gtk.SizeGroup({ mode: Gtk.SizeGroupMode.HORIZONTAL });

        headerBarSizeGroup.add_widget(cancelButton);
        headerBarSizeGroup.add_widget(doneButton);

        let grid = new Gtk.Grid ({ orientation: Gtk.Orientation.VERTICAL,
                                   row_homogeneous: true,
                                   column_homogeneous: true,
                                   halign: Gtk.Align.CENTER,
                                   row_spacing: 6,
                                   column_spacing: 12,
                                   margin_bottom: 18,
                                   margin_end: 18,
                                   margin_start: 18,
                                   margin_top: 18 });

        let contentArea = this.widget.get_content_area();
        contentArea.pack_start(grid, true, true, 2);

        // File Name item
        // Translators: "File Name" is the label next to the file name
        // in the info dialog
        this._name = new Gtk.Label({ label: C_("File Name", "Name"),
                                     halign: Gtk.Align.END });
        this._name.get_style_context ().add_class('dim-label');
        grid.add(this._name);


        // Source item
        this._source = new Gtk.Label({ label: _("Source"),
                                       halign: Gtk.Align.END });
        this._source.get_style_context ().add_class('dim-label');

        if (fileName.appName != null) {
            grid.add(this._source);
        }

        // Date Modified item
        this._dateModifiedLabel = new Gtk.Label({ label: _("Date Modified"),
                                                  halign: Gtk.Align.END });
        this._dateModifiedLabel.get_style_context ().add_class('dim-label');
        grid.add(this._dateModifiedLabel);

        // Date Created item
        this._dateCreatedLabel = new Gtk.Label({ label: _("Date Created"),
                                                 halign: Gtk.Align.END });
        this._dateCreatedLabel.get_style_context ().add_class('dim-label');

        if (fileName.dateCreated != null) {
            grid.add(this._dateCreatedLabel);
        }

        // Media type item
        // Translators: "Type" is the label next to the media type
        // (Ogg Vorbis, AAC, ...) in the info dialog
        this._mediaType = new Gtk.Label({ label: C_("Media Type", "Type"),
                                          halign: Gtk.Align.END });
        this._mediaType.get_style_context ().add_class('dim-label');
        grid.add(this._mediaType);

        // File name value
        this._fileNameEntry = new Gtk.Entry({ activates_default: true,
                                              text: fileName.fileName,
                                              editable: true,
                                              hexpand: true,
                                              width_chars: 40,
                                              halign: Gtk.Align.START });
        grid.attach_next_to(this._fileNameEntry, this._name, Gtk.PositionType.RIGHT, 2, 1);

        // Source value
        let sourceLink = this._file.get_parent();
        let sourcePath = sourceLink.get_path();

        this._sourceData = new Gtk.LinkButton({ label: sourcePath,
                                                uri: sourceLink.get_uri(),
                                                halign: Gtk.Align.START });
        if (fileName.appName != null)
            grid.attach_next_to(this._sourceData, this._source, Gtk.PositionType.RIGHT, 2, 1);

        // Date Modified value
        if (fileName.dateModified != null) {
            this._dateModifiedData = new Gtk.Label({ label: fileName.dateModified,
                                                     halign: Gtk.Align.START });
            grid.attach_next_to(this._dateModifiedData, this._dateModifiedLabel, Gtk.PositionType.RIGHT, 2, 1);
        }

        // Date Created value
        if (fileName.dateCreated) {
            this._dateCreatedData = new Gtk.Label({ label: fileName.dateCreated,
                                                    halign: Gtk.Align.START });
            grid.attach_next_to(this._dateCreatedData, this._dateCreatedLabel, Gtk.PositionType.RIGHT, 2, 1);
        }

        // Media type data
        this._mediaTypeData = new Gtk.Label({ label: fileName.mediaType || _("Unknown"),
                                              halign: Gtk.Align.START });
        grid.attach_next_to(this._mediaTypeData, this._mediaType, Gtk.PositionType.RIGHT, 2, 1);

        this.widget.show_all();
    }

    onDoneClicked() {
        let newFileName = this._fileNameEntry.get_text();
        this._file.set_display_name_async(newFileName, GLib.PRIORITY_DEFAULT, null, null);
        this.widget.destroy();
    }

    onCancelClicked() {
        this.widget.destroy();
    }
}
