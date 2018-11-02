foreach icon_size: ['16x16', '22x22', '24x24', '32x32', '48x48', '256x256']
  icon_dir = join_paths('icons', 'hicolor', icon_size, 'apps')

  install_data(
    join_paths(icon_dir, 'org.gnome.SoundRecorder.png'),
    install_dir: join_paths(sound_recorder_datadir, icon_dir)
  )
endforeach

icon_dir = join_paths('icons', 'hicolor', 'symbolic', 'apps')
install_data(
  join_paths(icon_dir, 'org.gnome.SoundRecorder-symbolic.svg'),
  install_dir: join_paths(sound_recorder_datadir, icon_dir)
)

i18n.merge_file(
  'desktop',
  input: 'org.gnome.SoundRecorder.desktop.in',
  output: 'org.gnome.SoundRecorder.desktop',
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
