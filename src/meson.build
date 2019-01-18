sound_recorder_sources = files(
  'application.js',
  'audioProfile.js',
  'fileUtil.js',
  'info.js',
  'listview.js',
  'main.js',
  'mainWindow.js',
  'params.js',
  'play.js',
  'preferences.js',
  'record.js',
  'util.js',
  'waveform.js',
)

app_conf = configuration_data()
app_conf.set('prefix', sound_recorder_prefix)
app_conf.set('libdir', sound_recorder_libdir)
app_conf.set('PACKAGE_VERSION', meson.project_version())
app_conf.set('GJS', gjs_console)

configure_file(
  input: 'org.gnome.SoundRecorder.in',
  output: application_id,
  install: true,
  install_dir: sound_recoder_pkgdatadir,
  configuration: app_conf
)

src_res = gnome.compile_resources(
  application_id + '.src',
  'org.gnome.SoundRecorder.src.gresource.xml',
  source_dir: '.',
  dependencies: sound_recorder_sources,
  gresource_bundle: true,
  install: true,
  install_dir: sound_recoder_pkgdatadir
)

run_target('run',
  command: join_paths(meson.build_root(), 'src', application_id),
  depends: [
    data_res,
    src_res,
  ]
)
