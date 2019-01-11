AC_INIT([gnome-sound-recorder],[3.28.2],[gnome-sound-recorder])

AC_CONFIG_MACRO_DIR([m4])
AC_CONFIG_HEADERS([config.h])

AM_INIT_AUTOMAKE([1.11 foreign -Wno-portability tar-ustar dist-xz])
AM_SILENT_RULES([yes])

LT_INIT([disable-static])
GETTEXT_PACKAGE=gnome-sound-recorder
AC_SUBST(GETTEXT_PACKAGE)
AC_DEFINE_UNQUOTED(GETTEXT_PACKAGE, "$GETTEXT_PACKAGE",
                  [The prefix for our gettext translation domains.])
IT_PROG_INTLTOOL([0.26])

GLIB_GSETTINGS
GOBJECT_INTROSPECTION_REQUIRE([0.9.6])

GLIB_MIN_VERSION=2.46
GTK_MIN_VERSION=3.12
GOBJECT_MIN_VERSION=1.31.6
PKG_CHECK_MODULES([DEPS], [gdk-3.0
                  gdk-pixbuf-2.0
                  glib-2.0 >= $GLIB_MIN_VERSION
                  gobject-introspection-1.0 >= $GOBJECT_MIN_VERSION
                  gtk+-3.0 >= $GTK_MIN_VERSION])

# Check for required plugins (stolen from Totem's configure.ac)
gst10_toolsdir=`$PKG_CONFIG --variable=toolsdir gstreamer-1.0`
gst10_inspect="$gst10_toolsdir/gst-inspect-1.0"

#Give error and exit if we don't have the gst_inspect tool
AC_MSG_CHECKING([GStreamer 1.0 inspection tool])
if test -r "$gst10_inspect"; then
	AC_MSG_RESULT([yes])
else
	AC_MSG_RESULT([no])
	AC_MSG_ERROR([
		Cannot find required GStreamer-1.0 tool 'gst-inspect-1.0'.
		It should be part of gstreamer-1_0-utils. Please install it.
	])
fi

# Check for elements from gst-plugins-base
# Set plugins which contain below elements
for base_element in playbin audioconvert uridecodebin
do
	AC_MSG_CHECKING([GStreamer 1.0 $base_element element])
	if $gst10_inspect $base_element >/dev/null 2>/dev/null; then
		AC_MSG_RESULT([yes])
	else
		AC_MSG_RESULT([no])
		AC_MSG_ERROR([
			Cannot find required GStreamer-1.0 plugin '$1'.
			It should be part of gst-plugins-base. Please install it.
		])

	fi
	shift;
done

# Check for elements from gst-plugins-good
# Set plugins which contain below elements
for good_element in flacenc flacparse qtmux qtdemux oggdemux
do
	AC_MSG_CHECKING([GStreamer 1.0 $good_element element])
	if $gst10_inspect $good_element >/dev/null 2>/dev/null; then
		AC_MSG_RESULT([yes])
	else
		AC_MSG_RESULT([no])
		AC_MSG_ERROR([
			Cannot find required GStreamer-1.0 plugin '$1'.
			It should be part of gst-plugins-good. Please install it.
		])
	fi
	shift;
done

# Do a diff check for pulseaudio since we've run into problems on deb systems
AC_MSG_CHECKING([GStreamer 1.0 pulseaudio element])
if $gst10_inspect pulseaudio >/dev/null 2>/dev/null; then
	AC_MSG_RESULT([yes])
else
	AC_MSG_RESULT([no])
	AC_MSG_WARN([
		Cannot find required GStreamer-1.0 plugin PulseAudio.
		It should be part of gst-plugins-good on RPM-based distros
		and gstreamer1.0-pulseaudio on Debian-based distros.
		Please install it.
	])
fi

# Check for elements from gst-plugins-bad
# but don't exit if they aren't installed. Just print error.
# Set plugins which contain below elements
for bad_element in id3mux
do
	AC_MSG_CHECKING([GStreamer 1.0 $bad_element element])
	if $gst10_inspect $bad_element >/dev/null 2>/dev/null; then
		AC_MSG_RESULT([yes])
	else
		AC_MSG_RESULT([no])
		AC_MSG_WARN([
			Cannot find required GStreamer-1.0 plugin '$1'.
			It should be part of gst-plugins-bad. Please install it.
		])

	fi
	shift;
done


AC_PATH_PROG(GJS, [gjs])

GLIB_COMPILE_RESOURCES=`$PKG_CONFIG --variable glib_compile_resources gio-2.0`
AC_SUBST(GLIB_COMPILE_RESOURCES)


AC_OUTPUT([
Makefile
data/Makefile
data/appdata/Makefile
data/icons/Makefile
src/Makefile
po/Makefile.in
])
