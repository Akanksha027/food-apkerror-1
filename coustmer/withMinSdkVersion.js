const { withProjectBuildGradle, withGradleProperties } = require('expo/config-plugins');

const NDK_VERSION = '27.0.12077973';
const MIN_SDK = 24;

const subprojectsBlock = `
// Force minSdkVersion ${MIN_SDK} on all Android library subprojects so that
// CMake/NDK prefab modules (e.g. hermestooling) built for minSdk ${MIN_SDK} can link.
subprojects {
  afterEvaluate { project ->
    if (project.hasProperty('android')) {
      if (project.android.hasProperty('defaultConfig')) {
        def currentMin = project.android.defaultConfig.minSdkVersion?.apiLevel ?: 0
        if (currentMin < ${MIN_SDK}) {
          project.android.defaultConfig.minSdkVersion ${MIN_SDK}
        }
      }
    }
  }
}
`;

function withMinSdkBuildGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      // Inject ext block
      if (!config.modResults.contents.includes('ext {\n  minSdkVersion =')) {
        config.modResults.contents = config.modResults.contents.replace(
          'allprojects {',
          `ext {\n  minSdkVersion = ${MIN_SDK}\n  ndkVersion = "${NDK_VERSION}"\n}\n\nallprojects {`
        );
      }
      // Inject subprojects force block
      if (!config.modResults.contents.includes('Force minSdkVersion')) {
        config.modResults.contents = config.modResults.contents.replace(
          'apply plugin: "expo-root-project"',
          subprojectsBlock + '\napply plugin: "expo-root-project"'
        );
      }
    }
    return config;
  });
}

function withNdkGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const set = (key, value) => {
      const existing = props.find(p => p.type === 'property' && p.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };
    set('android.ndkVersion', NDK_VERSION);
    set('android.minSdkVersion', String(MIN_SDK));
    return config;
  });
}

module.exports = function withAndroidBuildFix(config) {
  config = withMinSdkBuildGradle(config);
  config = withNdkGradleProperties(config);
  return config;
};
