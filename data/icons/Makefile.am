icondir = $(datadir)/icons/

nobase_icon_DATA = \
	hicolor/16x16/apps/org.gnome.SoundRecorder.png \
	hicolor/22x22/apps/org.gnome.SoundRecorder.png \
	hicolor/24x24/apps/org.gnome.SoundRecorder.png \
	hicolor/32x32/apps/org.gnome.SoundRecorder.png \
	hicolor/48x48/apps/org.gnome.SoundRecorder.png \
	hicolor/256x256/apps/org.gnome.SoundRecorder.png \
	hicolor/symbolic/apps/org.gnome.SoundRecorder-symbolic.svg

EXTRA_DIST = $(nobase_icon_DATA) \
	hicolor/org.gnome.SoundRecorder.svg \
	.gitignore

gtk_update_icon_cache = gtk-update-icon-cache -f $(datadir)/icons/hicolor

install-data-hook: update-icon-cache
uninstall-hook: update-icon-cache
update-icon-cache:
	@-if test -z "$(DESTDIR)"; then \
		echo "Updating Gtk icon cache."; \
		$(gtk_update_icon_cache); \
	else \
		echo "*** Icon cache not updated.  After (un)install, run this:"; \
		echo "***   $(gtk_update_icon_cache)"; \
	fi

-include $(top_srcdir)/git.mk
