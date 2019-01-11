icon_dir = join_paths('icons', 'hicolor', 'scalable', 'apps')
install_data(
  join_paths(icon_dir, '@0@.svg'.format(application_id)),
  install_dir: join_paths(sound_recorder_datadir, icon_dir)
)

icon_dir = join_paths('icons', 'hicolor', 'symbolic', 'apps')
install_data(
  join_paths(icon_dir, '@0@-symbolic.svg'.format(application_id)),
  install_dir: join_paths(sound_recorder_datadir, icon_dir)
)

i18n.merge_file(
  'desktop',
  input: '@0@.desktop.in'.format(application_id),
  output: '@0@.desktop'.format(application_id),
  install: true,
  install_dir: join_paths(sound_recorder_datadir, 'applications'),
  po_dir: po_dir,
  type: 'desktop'
)

gsettings_conf = configuration_data()
gsettings_conf.set('GETTEXT_PACKAGE', meson.project_name ())
configure_file(
  input: 'org.gnome.gnome-sound-recorder.gschema.xml',
  output: 'org.gnome.gnound-sound-recorder.gschema.xml',
  configuration: gsettings_conf,
  install: true,
  install_dir: sound_recorder_schemadir
)

install_data(
  'application.css',
  install_dir: sound_recoder_pkgdatadir
)

subdir('appdata')
