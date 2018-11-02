#!/usr/bin/python3

import os
import subprocess
import sys

destdir = os.environ.get('DESTDIR', '')
datadir = sys.argv[1]
bindir = os.path.normpath(destdir + os.sep + sys.argv[2])

if not os.path.exists(bindir):
  os.makedirs(bindir)

src = os.path.join(datadir, 'gnome-sound-recorder', 'org.gnome.SoundRecorder')
dest = os.path.join(bindir, 'gnome-sound-recorder')
subprocess.call(['ln', '-s', '-f', src, dest])

if not os.environ.get('DESTDIR'):
    print('Compiling gsettings schemas...')
    subprocess.call(['glib-compile-schemas', os.path.join(datadir, 'glib-2.0', 'schemas')])

    print('Updating icon cache...')
    subprocess.call(['gtk-update-icon-cache', '-qtf', os.path.join(datadir, 'icons', 'hicolor')])

    print('Updating desktop database...')
    subprocess.call(['update-desktop-database', '-q', os.path.join(datadir, 'applications')])
