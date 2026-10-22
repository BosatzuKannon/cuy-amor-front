const { withGradleProperties } = require('@expo/config-plugins');

const GRADLE_JVM_ARGS = '-Xmx4g -XX:MaxMetaspaceSize=1024m';

/**
 * The Android project is generated on every CI run (`expo prebuild --clean`),
 * so the Gradle heap has to be configured through the Expo config instead of
 * editing android/gradle.properties by hand.
 */
module.exports = function withAndroidGradleHeap(config) {
  return withGradleProperties(config, (config) => {
    const items = config.modResults;
    const jvmArgs = items.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs',
    );

    if (jvmArgs) {
      jvmArgs.value = GRADLE_JVM_ARGS;
    } else {
      items.push({
        type: 'property',
        key: 'org.gradle.jvmargs',
        value: GRADLE_JVM_ARGS,
      });
    }

    return config;
  });
};
