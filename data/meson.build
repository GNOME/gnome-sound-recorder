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

desktop_file = i18n.merge_file(
  'desktop',
  input: '@0@.desktop.in'.format(application_id),
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

install_data(
  application_id + '.gschema.xml',
  install_dir: sound_recorder_schemadir
)

install_data(
  'application.css',
  install_dir: sound_recoder_pkgdatadir
)

subdir('appdata')
