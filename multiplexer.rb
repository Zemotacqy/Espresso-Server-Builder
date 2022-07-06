10.times do
  start_time = Time.now.to_i
  puts "Starting building Espresso Server at: #{start_time}"
  # Platform Command
  # `export ANDROID_SDK_ROOT="/usr/local/.browserstack/android-sdk"; export JAVA_HOME="/nix/store/0ww3dz29sn707n6sqr58bwkv7xyczpjl-openjdk-11.0.10+9/lib/openjdk"; export PATH=$JAVA_HOME/bin:$PATH; /home/ritesharora/.nvm/versions/node/v12.6.0/bin/node driver.js`

  # Codesigner Command
  `node driver.js`
  puts "Time Taken: #{Time.now.to_i - start_time}"
end
