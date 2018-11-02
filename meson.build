project(
  'gnome-sound-recorder',
  version: '3.28.1',
  license: 'GPL2+',
  meson_version: '>= 0.46.0'
)

application_id = 'org.gnome.SoundRecorder'

sound_recorder_prefix = get_option('prefix')
sound_recorder_bindir = join_paths(sound_recorder_prefix, get_option('bindir'))
sound_recorder_libdir = join_paths(sound_recorder_prefix, get_option('libdir'))
sound_recorder_datadir = join_paths(sound_recorder_prefix, get_option('datadir'))
sound_recoder_pkgdatadir = join_paths(sound_recorder_datadir, meson.project_name())

sound_recorder_schemadir = join_paths(sound_recorder_datadir, 'glib-2.0', 'schemas')

gjs_dep = dependency('gjs-1.0', version: '>= 1.48.0')
gjs_console = gjs_dep.get_pkgconfig_variable('gjs_console')

# Lets check whether the dependencies exist
dependency('gio-2.0', version: '>= 2.43.4')
dependency('glib-2.0', version: '>= 2.39.3')
dependency('gtk+-3.0', version: '>= 3.12.0')
dependency('gobject-introspection-1.0', version: '>= 1.31.6')

gnome = import('gnome')
i18n = import('i18n')

po_dir = join_paths(meson.source_root(), 'po')

subdir('src')
subdir('data')
subdir('po')

meson.add_install_script(
  join_paths('build-aux', 'meson_post_install.py'),
  sound_recorder_datadir,
  sound_recorder_bindir
)