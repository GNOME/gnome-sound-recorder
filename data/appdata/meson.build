appdata_conf = configuration_data()
appdata_conf.set('appid', application_id)
i18n.merge_file(
  'appdata-file',
  input: configure_file(
    input: files('org.gnome.SoundRecorder.appdata.xml.in'),
    output: 'org.gnome.SoundRecorder.appdata.xml.in',
    configuration: appdata_conf
  ),
  output: 'org.gnome.SoundRecorder.appdata.xml',
  po_dir: po_dir,
  install: true,
  install_dir: join_paths(sound_recorder_datadir, 'metainfo')
)