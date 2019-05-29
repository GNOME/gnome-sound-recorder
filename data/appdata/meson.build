appdata_conf = configuration_data()
appdata_conf.set('app-id', application_id)

appdata_file = i18n.merge_file(
  'appdata-file',
  input: configure_file(
  	input: 'org.gnome.SoundRecorder.appdata.xml.in.in',
  	output: '@BASENAME@',
  	configuration: appdata_conf
	),
  output: '@0@.appdata.xml'.format(application_id),
  po_dir: po_dir,
  install: true,
  install_dir: join_paths(sound_recorder_datadir, 'metainfo')
)

appstream_util = find_program('appstream-util', required: false)
if appstream_util.found()
  test(
    'validate-appdata', appstream_util,
    args: [
      'validate-relax', '--nonet', appdata_file.full_path()
    ]
  )
endif
