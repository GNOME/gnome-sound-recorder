/* exported ErrorDialog, ErrState, SourceType */
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

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const MainWindow = imports.mainWindow;

var ErrState = {
    OFF: 0,
    ON: 1
};

var SourceType = {
    RECORD: 0,
    PLAY: 1
};

var ErrorDialog = class ErrorDialog {
    showErrorDialog(source, errorDialogState, errorStrOne, errorStrTwo) {
        if (errorDialogState == ErrState.OFF) {
            let errorDialog = new Gtk.MessageDialog ({ resizable: false,
                                                       modal: true,
                                                       destroy_with_parent: true,
                                                       buttons: Gtk.ButtonsType.OK,
                                                       message_type: Gtk.MessageType.WARNING });

            if (errorStrOne != null)
                errorDialog.set_property('text', errorStrOne);

            if (errorStrTwo != null)
                errorDialog.set_property('secondary-text', errorStrTwo);

            errorDialog.set_transient_for(Gio.Application.get_default().get_active_window());
            errorDialog.connect ('response', () => {
                errorDialog.destroy();

                if(source == SourceType.RECORD) {
                    // FIXME: Why does this only work from inside a signal callback?
                    MainWindow.view.onRecordStopClicked();
                } else {
                     MainWindow.view.onPlayStopClicked();
                }
            });
            errorDialog.show();
        }
    }
}