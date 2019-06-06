icon_dir = join_paths('icons', 'hicolor', 'scalable', 'apps')
install_data(
  join_paths(icon_dir, 'org.gnome.SoundRecorder.svg'),
  rename: '@0@.svg'.format(application_id),
  install_dir: join_paths(sound_recorder_datadir, icon_dir)
)

icon_dir = join_paths('icons', 'hicolor', 'symbolic', 'apps')
install_data(
  join_paths(icon_dir, 'org.gnome.SoundRecorder-symbolic.svg'),
  rename: '@0@-symbolic.svg'.format(application_id),
  install_dir: join_paths(sound_recorder_datadir, icon_dir)
)

desktop_conf = configuration_data()
desktop_conf.set('app-id', application_id)
desktop_file = i18n.merge_file(
  'desktop',
  input: configure_file(
  	input: 'org.gnome.SoundRecorder.desktop.in.in',
  	output: '@BASENAME@',
  	configuration: desktop_conf
  ),
  output: '@0@.desktop'.format(application_id),
  install: true,
  install_dir: join_paths(sound_recorder_datadir, 'applications'),
  po_dir: po_dir,
  type: 'desktop'
)
desktop_file_validate = find_program('desktop-file-validate', required: false)
if desktop_file_validate.found()
  test(
    'validate-desktop',
    desktop_file_validate,
    args: [
      desktop_file.full_path()
    ]
  )
endif

gsettings_conf = configuration_data()
gsettings_conf.set('app-id', application_id)
configure_file(
  input: 'org.gnome.SoundRecorder.gschema.xml.in',
  output: '@0@.gschema.xml'.format(application_id),
  configuration: gsettings_conf,
  install: true,
  install_dir: sound_recorder_schemadir
)

gnome.compile_resources(
  application_id + '.data',
  'org.gnome.SoundRecorder.data.gresource.xml',
  gresource_bundle: true,
  install_dir: sound_recorder_pkgdatadir,
  install: true
)

subdir('appdata')
