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
  '@0@.src'.format(application_id),
  '@0@.src.gresource.xml'.format(application_id),
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
