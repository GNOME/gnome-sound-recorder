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

var Gettext = imports.gettext;
var _ = imports.gettext.gettext;
var Gio = imports.gi.Gio;
var GLib = imports.gi.GLib;
var GObject = imports.gi.GObject;
var Gst = imports.gi.Gst;
var GstPbutils = imports.gi.GstPbutils;
var Lang = imports.lang;
var Signals = imports.signals;

var Listview = imports.listview;
var MainWindow = imports.mainWindow;
var Record = imports.record;

var _OFFSET_STEP = 20;
var CurrentEndIdx;
var totItems;

var OffsetController = new Lang.Class({
    Name: 'OffsetController',

    _init: function(context) {
        this._offset = 0;
        this._itemCount = 0;
        this._context = context;
        CurrentEndIdx = _OFFSET_STEP;
    },

    getOffset: function() {
        return this._offset;
    },

    getEndIdx: function() {
        totItems = MainWindow.list.getItemCount();
        if (CurrentEndIdx < totItems) {
            this.endIdx = CurrentEndIdx -1;
        } else {
            this.endIdx = totItems - 1;
        }

        return this.endIdx;
    },

    increaseEndIdxStep: function() {
        CurrentEndIdx += _OFFSET_STEP;
    },

    getcidx: function() {
        return CurrentEndIdx;
    }
});

var DisplayTime = new Lang.Class({
    Name: 'DisplayTime',

    getDisplayTime: function(mtime) {
        var text = "";
        var DAY = 86400000000;
        var now = GLib.DateTime.new_now_local();
        var difference = now.difference(mtime);
        var days = Math.floor(difference / DAY);
        var weeks = Math.floor(difference / (7 * DAY));
        var months = Math.floor(difference / (30 * DAY));
        var years = Math.floor(difference / (365 * DAY));

        if (difference < DAY) {
            text = mtime.format('%X');
        } else if (difference < 2 * DAY) {
            text = _("Yesterday");
        } else if (difference < 7 * DAY) {
            text = Gettext.ngettext("%d day ago",
                                    "%d days ago",
                                     days).format(days);
        } else if (difference < 14 * DAY) {
            text = _("Last week");
        } else if (difference < 28 * DAY) {
            text = Gettext.ngettext("%d week ago",
                                     "%d weeks ago",
                                     weeks).format(weeks);
        } else if (difference < 60 * DAY) {
            text = _("Last month");
        } else if (difference < 360 * DAY) {
            text = Gettext.ngettext("%d month ago",
                                     "%d months ago",
                                     months).format(months);
        } else if (difference < 730 * DAY) {
            text = _("Last year");
        } else {
            text = Gettext.ngettext("%d year ago",
                                    "%d years ago",
                                    years).format(years);
        }
        return text;
    }
});


