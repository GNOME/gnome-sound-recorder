/* exported containerProfileMap audioCodecMap AudioProfile */
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
 *  Author: Meg Ford <megford@gnome.org>
 *
 */

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
const Mainloop = imports.mainloop;

const MainWindow = imports.mainWindow;
const Preferences = imports.preferences;

const comboBoxMap = {
    OGG_VORBIS: 0,
    OPUS: 1,
    FLAC: 2,
    MP3: 3,
    MP4: 4
};

var containerProfileMap = {
    OGG: "application/ogg",
    ID3: "application/x-id3",
    MP4: "video/quicktime,variant=(string)iso",
    AUDIO_OGG: "application/ogg;audio/ogg;video/ogg"
};


var audioCodecMap = {
    FLAC: "audio/x-flac",
    MP3: "audio/mpeg,mpegversion=(int)1,layer=(int)3",
    MP4: "audio/mpeg,mpegversion=(int)4",
    OPUS: "audio/x-opus",
    VORBIS: "audio/x-vorbis"
};

var AudioProfile = class AudioProfile {
    profile(profileName) {
        if (profileName) {
            this._profileName = profileName;
        } else {
            this._profileName = comboBoxMap.OGG_VORBIS;
        }

        switch(this._profileName) {

        case comboBoxMap.OGG_VORBIS:
            this._values = { container: containerProfileMap.OGG, audio: audioCodecMap.VORBIS };
            break;

        case comboBoxMap.OPUS:
            this._values = { container: containerProfileMap.OGG, audio: audioCodecMap.OPUS };
            break;

        case comboBoxMap.FLAC:
            this._values = { audio: audioCodecMap.FLAC };
            break;

        case comboBoxMap.MP3:
            this._values = { container: containerProfileMap.ID3, audio: audioCodecMap.MP3 };
            break;

        case comboBoxMap.MP4:
            this._values = { container: containerProfileMap.MP4, audio: audioCodecMap.MP4 };
            break;

        default:
            break;
        }
    }

    mediaProfile() {
        let audioCaps;
        this._containerProfile = null;
        if (this._values.audio && this._values.container) {
            let caps = Gst.Caps.from_string(this._values.container);
            this._containerProfile = GstPbutils.EncodingContainerProfile.new("record", null, caps, null);
            audioCaps = Gst.Caps.from_string(this._values.audio);
            this.encodingProfile = GstPbutils.EncodingAudioProfile.new(audioCaps, null, null, 1);
            this._containerProfile.add_profile(this.encodingProfile);
            return this._containerProfile;
        } else if (!this._values.container && this._values.audio) {
            audioCaps = Gst.Caps.from_string(this._values.audio);
            this.encodingProfile = GstPbutils.EncodingAudioProfile.new(audioCaps, null, null, 1);
            return this.encodingProfile;
        } else {
            return -1;
        }
    }

    fileExtensionReturner() {
        let suffixName;

        if (this._values.audio) {
            if (this._containerProfile != null)
                suffixName = this._containerProfile.get_file_extension();

            if (suffixName == null)
                suffixName = this.encodingProfile.get_file_extension();
        }

        this.audioSuffix = ("." + suffixName);
        return this.audioSuffix;
    }
}
