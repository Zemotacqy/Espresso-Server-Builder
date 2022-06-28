const {fs} = require('@appium/support');
const path = require('path');
const { copyGradleProjectRecursively } = require('./utils.js');
const { ServerBuilder } = require('./server-builder.js');

const TIMESTAMP = Math.floor(+new Date() / 1000);

const KEYSTORE_PASS = "<keystore pass>";
const KEYSTORE_ALIAS = "browserstack";
const BUDDIES = "com.huji.foodtricks.buddies"
const TEST_SERVER_PATH = `${__dirname}/espresso-server`;
const KEYSTORE_PATH = `${__dirname}/${KEYSTORE_ALIAS}.keystore`;
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
    let start_time = Math.floor(+new Date());
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
    console.log(`\n\nTime Taken: ${Math.floor(+new Date()) - start_time}ms`)
  }
}

const signingConfig = {
  zipAlign: true,
  keystoreFile: KEYSTORE_PATH,
  keystorePassword: KEYSTORE_PASS,
  keyAlias: KEYSTORE_ALIAS,
  keyPassword: KEYSTORE_PASS
};

opts = {
  "espressoBuildConfig": null,
  "tmpDir": TEST_SERVER_PATH,
  "showGradleLog": true,
  "appPackage": BUDDIES,
  "signingConfig": signingConfig
};

var d = new Driver(opts)
d.buildNewModServer();
