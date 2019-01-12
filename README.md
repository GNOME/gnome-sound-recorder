# Sound Recorder

A simple, modern sound recorder for GNOME

<a href="https://flathub.org/apps/details/org.gnome.SoundRecorder">
<img src="https://flathub.org/assets/badges/flathub-badge-i-en.png" width="190px" />
</a>


### Dependencies

- `meson >= 0.46.0`
- `gjs >= 1.48.0`
- `gio-2.0 >= 2.43.4`
- `glib-2.0 >= 2.39.3`
- `gtk+-3.0 >= 3.12.0`
- `gobject-introspection-1.0 >= 1.31.6`


### Manual installation

You can build and install the application from source code using Meson build system.

```
meson _build --prefix=$PREFIX
ninja -C _build
sudo ninja -C _build install
```

We also offer a Flatpak nightly build that you can download and install for testing the latest changes.
