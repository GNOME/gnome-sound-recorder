app_conf = configuration_data()
app_conf.set('prefix', sound_recorder_prefix)
app_conf.set('libdir', sound_recorder_libdir)
app_conf.set('PACKAGE_VERSION', meson.project_version())
app_conf.set('GJS', gjs_console)
app_conf.set('APPLICATION_ID', application_id)

configure_file(
  input: 'org.gnome.SoundRecorder.in',
  output: application_id,
  install: true,
  install_dir: sound_recorder_pkgdatadir,
  configuration: app_conf
)

source_res_conf = configuration_data()
source_res_conf.set('profile', profile)
gnome.compile_resources(
  application_id + '.src',
  configure_file(
  	input: 'org.gnome.SoundRecorder.src.gresource.xml.in',
  	output: '@BASENAME@',
  	configuration: source_res_conf
  ),
  source_dir: '.',
  gresource_bundle: true,
  install: true,
  install_dir: sound_recorder_pkgdatadir
)
