const { withEntitlementsPlist, withXcodeProject } = require('@expo/config-plugins');

const withStripPushNotifications = (config) => {
  // 1. Remove aps-environment from entitlements
  config = withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });

  // 2. Remove Push capability from pbxproj
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    
    // Find all target attributes and remove com.apple.Push
    const attributes = xcodeProject.getFirstProject().firstProject.attributes;
    if (attributes && attributes.TargetAttributes) {
      for (const targetId in attributes.TargetAttributes) {
        const target = attributes.TargetAttributes[targetId];
        if (target.SystemCapabilities && target.SystemCapabilities['com.apple.Push']) {
          delete target.SystemCapabilities['com.apple.Push'];
        }
      }
    }
    
    return config;
  });

  return config;
};

module.exports = withStripPushNotifications;
