const {fs} = require('@appium/support');
const path = require('path');
const { copyGradleProjectRecursively } = require('./utils.js');
const { ServerBuilder } = require('./server-builder.js');

const TIMESTAMP = Math.floor(+new Date() / 1000);

const KEYSTORE_PASS = "<keypass>";
const KEYSTORE_ALIAS = "browserstack";
const BUDDIES = "com.android.iunoob.bloodbank"
const TEST_SERVER_PATH = `${__dirname}/espresso-server`;
const KEYSTORE_PATH = `${__dirname}/Browserstack.keystore`;
const DEST_BUILD_PATH = `${TEST_SERVER_PATH}/espresso-server-${TIMESTAMP}`;
const DEST_APK_PATH = `${DEST_BUILD_PATH}/androidTest_${TIMESTAMP}.apk`;
const TEST_SERVER_ROOT = "/Users/manish/browserstack/appium/node_modules/appium-espresso-driver/espresso-server";

class Driver {
  constructor (opts) {
    this.espressoBuildConfig = opts.espressoBuildConfig;
    this.tmpDir = opts.tmpDir;
    this.showGradleLog = opts.showGradleLog;
    this.appPackage = opts.appPackage;
    this.signingConfig = opts.signingConfig;
  }

  async buildNewModServer () {
    let buildConfiguration = {};
    if (this.espressoBuildConfig) {
      let buildConfigurationStr;
      if (await fs.exists(this.espressoBuildConfig)) {
        console.log(`Loading the build configuration from '${this.espressoBuildConfig}'`);
        buildConfigurationStr = await fs.readFile(this.espressoBuildConfig, 'utf8');
      } else {
        console.log(`Loading the build configuration from 'espressoBuildConfig' capability`);
        buildConfigurationStr = this.espressoBuildConfig;
      }
      try {
        buildConfiguration = JSON.parse(buildConfigurationStr);
      } catch (e) {
        console.log('Cannot parse the build configuration JSON', e);
        throw e;
      }
    }
    const dirName = fs.sanitizeName(`espresso-server-${TIMESTAMP}`, {
      replacement: '-',
    });
    const serverPath = path.resolve(this.tmpDir, dirName);
    console.log(`Building espresso server in '${serverPath}'`);
    console.log(`The build folder root could be customized by changing the 'tmpDir' capability`);
    await fs.rimraf(serverPath);
    await fs.mkdirp(serverPath);
    console.log(`Copying espresso server template from ('${TEST_SERVER_ROOT}' to '${serverPath}')`);
    await copyGradleProjectRecursively(TEST_SERVER_ROOT, serverPath);
    console.log('Bulding espresso server');
    await new ServerBuilder({
      serverPath, buildConfiguration,
      showGradleLog: this.showGradleLog,
      testAppPackage: this.appPackage,
      signingConfig: this.signingConfig
    }).build();
    const apkPath = path.resolve(serverPath, 'app', 'build', 'outputs', 'apk', 'androidTest', 'debug', 'app-debug-androidTest.apk');
    console.log(`APK built here '${apkPath}'`);
    console.log(`Copying built apk from '${apkPath}' to '${DEST_APK_PATH}'`);
    await fs.copyFile(apkPath, DEST_APK_PATH);
    await fs.rimraf(serverPath);
  }
}

const signingConfig = {
  zipAlign: true,
  keystoreFile: KEYSTORE_PATH,
  keystorePassword: KEYSTORE_PASS,
  keyAlias: KEYSTORE_ALIAS,
  keyPassword: KEYSTORE_PASS
};

// "{\"additionalAppDependencies\":[],\"additionalAndroidTestDependencies\":[],\"toolsVersions\":{\"androidGradlePlugin\":\"3.2.1\",\"gradle\":\"4.8\",\"compileSdk\":\"28\",\"buildTools\":\"28.0.3\",\"minSdk\":\"17\",\"targetSdk\":\"28\"}}",
const additionalAppDependencies = ["com.google.android.gms:play-services-places:16.0.0", "com.google.android.gms:play-services-location:16.0.0", "com.google.android.gms:play-services-maps:16.0.0", "com.android.support:multidex:1.0.3", "com.google.firebase:firebase-auth:16.0.5", "com.google.firebase:firebase-database:16.0.3", "com.google.firebase:firebase-core:16.0.4", "com.android.volley:volley:1.1.1", "pl.droidsonroids.gif:android-gif-drawable:1.2.15", "com.squareup.retrofit2:retrofit:2.3.0"];
const additionalAndroidTestDependencies = ["androidx.test.ext:truth:1.3.0"];
var dependenciesArray = [];
dependenciesArray.push(additionalAppDependencies[Math.floor(Math.random()*additionalAppDependencies.length)]);

opts = {
  "espressoBuildConfig": `{"additionalAppDependencies":["${dependenciesArray}"],"additionalAndroidTestDependencies":${additionalAndroidTestDependencies}}`,
  "tmpDir": TEST_SERVER_PATH,
  "showGradleLog": true,
  "appPackage": BUDDIES,
  "signingConfig": signingConfig
};

let start_time = Math.floor(+new Date());
try {
  var d = new Driver(opts)
  d.buildNewModServer();
} catch (e) {
  console.log(`Error: ${e}`)
}
console.log(`\n\nTime Taken: ${Math.floor(+new Date()) - start_time}ms`)
