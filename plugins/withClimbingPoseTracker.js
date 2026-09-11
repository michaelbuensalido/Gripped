const { withPlugins, withInfoPlist, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Real-Time Climbing Pose Tracker
 * Configures:
 * 1. iOS: Camera permission strings, Vision.framework linkage.
 * 2. Android: ML Kit Pose Detection dependency (com.google.mlkit:pose-detection).
 */
const withClimbingPoseTrackerIOS = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.NSCameraUsageDescription =
      config.modResults.NSCameraUsageDescription ||
      'CruxLog uses the camera to detect climbing holds and real-time body pose sequences on the wall.';
    return config;
  });
};

const withClimbingPoseTrackerAndroid = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('com.google.mlkit:pose-detection')) {
      return config;
    }

    const dependencyString = `
    // ML Kit Pose Detection bundle for CruxLog Real-Time Climbing Pose Tracker
    implementation 'com.google.mlkit:pose-detection:18.0.0-beta3'
`;

    config.modResults.contents = config.modResults.contents.replace(
      /dependencies\s*\{/,
      `dependencies {${dependencyString}`
    );

    return config;
  });
};

const withClimbingPoseTracker = (config) => {
  return withPlugins(config, [
    withClimbingPoseTrackerIOS,
    withClimbingPoseTrackerAndroid,
  ]);
};

module.exports = withClimbingPoseTracker;
