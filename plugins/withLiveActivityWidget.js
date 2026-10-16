const fs = require('fs');
const path = require('path');
const { withXcodeProject, withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const WIDGET_TARGET_NAME = 'CruxLogWidget';
const APP_GROUP_IDENTIFIER = 'group.com.cruxlog.app';

function getMainAppDevelopmentTeam(pbxProject) {
  const configs = pbxProject.pbxXCBuildConfigurationSection();
  for (const key in configs) {
    const config = configs[key];
    const bs = config.buildSettings;
    if (!bs || !bs.PRODUCT_NAME) continue;
    const productName = String(bs.PRODUCT_NAME).replace(/"/g, '');
    if (productName.includes('Extension') || productName.includes('Widget') || productName.includes('Saveto')) {
      continue;
    }
    const developmentTeam = bs.DEVELOPMENT_TEAM ? String(bs.DEVELOPMENT_TEAM).replace(/"/g, '') : null;
    if (developmentTeam) {
      return developmentTeam;
    }
  }
  return 'K4QNPLAWX7';
}

function copyWidgetFiles(platformProjectRoot) {
  const sourceDir = path.resolve(__dirname, 'native', 'ios', WIDGET_TARGET_NAME);
  const destDir = path.join(platformProjectRoot, WIDGET_TARGET_NAME);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = [
    'LiveActivityIntents.swift',
    'CruxLogWidgetLiveActivity.swift',
    'CruxLogWidgetBundle.swift',
    'Info.plist',
    'CruxLogWidget.entitlements',
  ];

  for (const file of files) {
    const srcFile = path.join(sourceDir, file);
    const dstFile = path.join(destDir, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, dstFile);
    }
  }
}

function applyWidgetTargetToPbxProject(pbxProject, { appIdentifier, currentProjectVersion, marketingVersion }) {
  const existingTarget = pbxProject.pbxTargetByName(WIDGET_TARGET_NAME);
  if (existingTarget) {
    return pbxProject;
  }

  const devTeam = getMainAppDevelopmentTeam(pbxProject);
  const widgetBundleId = `${appIdentifier}.${WIDGET_TARGET_NAME}`;

  const sourceFiles = [
    'LiveActivityIntents.swift',
    'CruxLogWidgetLiveActivity.swift',
    'CruxLogWidgetBundle.swift',
  ];
  const configFiles = [
    'Info.plist',
    'CruxLogWidget.entitlements',
  ];
  const allFiles = [...sourceFiles, ...configFiles];

  const extGroup = pbxProject.addPbxGroup(allFiles, WIDGET_TARGET_NAME, WIDGET_TARGET_NAME);

  const groups = pbxProject.hash.project.objects.PBXGroup;
  Object.keys(groups).forEach((key) => {
    if (
      typeof groups[key] === 'object' &&
      groups[key].name === undefined &&
      groups[key].path === undefined
    ) {
      pbxProject.addToPbxGroup(extGroup.uuid, key);
    }
  });

  const projObjects = pbxProject.hash.project.objects;
  projObjects.PBXTargetDependency = projObjects.PBXTargetDependency || {};
  projObjects.PBXContainerItemProxy = projObjects.PBXContainerItemProxy || {};

  const target = pbxProject.addTarget(WIDGET_TARGET_NAME, 'app_extension', WIDGET_TARGET_NAME);

  pbxProject.addBuildPhase(
    sourceFiles,
    'PBXSourcesBuildPhase',
    'Sources',
    target.uuid
  );
  pbxProject.addBuildPhase(
    [],
    'PBXResourcesBuildPhase',
    'Resources',
    target.uuid
  );
  pbxProject.addBuildPhase(
    [],
    'PBXFrameworksBuildPhase',
    'Frameworks',
    target.uuid
  );

  // Also add LiveActivityIntents.swift to the main app target's Sources build phase
  // so iOS 17+ AppIntents metadata is embedded in both the app and widget extension
  const mainTarget = pbxProject.pbxTargetByName('CruxLog');
  if (mainTarget) {
    const fileRefs = pbxProject.hash.project.objects.PBXFileReference;
    let intentsFileRefUuid = null;
    for (const refKey in fileRefs) {
      if (
        typeof fileRefs[refKey] === 'object' &&
        (fileRefs[refKey].path === 'LiveActivityIntents.swift' ||
          fileRefs[refKey].name === 'LiveActivityIntents.swift')
      ) {
        intentsFileRefUuid = refKey;
        break;
      }
    }

    if (intentsFileRefUuid) {
      const buildFiles = pbxProject.hash.project.objects.PBXBuildFile;
      const newBuildFileUuid = pbxProject.generateUuid();
      buildFiles[newBuildFileUuid] = {
        isa: 'PBXBuildFile',
        fileRef: intentsFileRefUuid,
        fileRef_comment: 'LiveActivityIntents.swift',
      };
      buildFiles[`${newBuildFileUuid}_comment`] = 'LiveActivityIntents.swift in Sources';

      const mainSourcesPhase = pbxProject.pbxSourcesBuildPhaseObj(mainTarget.uuid);
      if (mainSourcesPhase && Array.isArray(mainSourcesPhase.files)) {
        const alreadyAdded = mainSourcesPhase.files.some(
          (f) => f.comment && f.comment.includes('LiveActivityIntents.swift')
        );
        if (!alreadyAdded) {
          mainSourcesPhase.files.push({
            value: newBuildFileUuid,
            comment: 'LiveActivityIntents.swift in Sources',
          });
        }
      }
    }
  }

  const configurations = pbxProject.pbxXCBuildConfigurationSection();
  for (const key in configurations) {
    const cfg = configurations[key];
    const bs = cfg.buildSettings;
    if (!bs) continue;
    if (typeof bs.PRODUCT_NAME !== 'undefined' && bs.PRODUCT_NAME === `"${WIDGET_TARGET_NAME}"`) {
      bs.CLANG_ENABLE_MODULES = 'YES';
      bs.INFOPLIST_FILE = `"${WIDGET_TARGET_NAME}/Info.plist"`;
      bs.CODE_SIGN_ENTITLEMENTS = `"${WIDGET_TARGET_NAME}/CruxLogWidget.entitlements"`;
      bs.CODE_SIGN_STYLE = 'Automatic';
      bs.CURRENT_PROJECT_VERSION = `"${currentProjectVersion}"`;
      bs.GENERATE_INFOPLIST_FILE = 'YES';
      bs.IPHONEOS_DEPLOYMENT_TARGET = '16.4';
      bs.MARKETING_VERSION = `"${marketingVersion}"`;
      bs.PRODUCT_BUNDLE_IDENTIFIER = `"${widgetBundleId}"`;
      bs.SKIP_INSTALL = 'YES';
      bs.SWIFT_EMIT_LOC_STRINGS = 'YES';
      bs.SWIFT_VERSION = '5.0';
      bs.TARGETED_DEVICE_FAMILY = '"1,2"';
      if (devTeam) {
        bs.DEVELOPMENT_TEAM = `"${devTeam}"`;
        bs.CODE_SIGN_IDENTITY = '"Apple Development"';
      }
    }
  }

  if (devTeam) {
    const widgetTarget = pbxProject.pbxTargetByName(WIDGET_TARGET_NAME);
    if (widgetTarget) {
      pbxProject.addTargetAttribute('DevelopmentTeam', devTeam, widgetTarget);
      pbxProject.addTargetAttribute('ProvisioningStyle', 'Automatic', widgetTarget);
    }
  }

  return pbxProject;
}

const withLiveActivityWidget = (config) => {
  config = withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    config.modResults.NSSupportsLiveActivitiesFrequentUpdates = true;
    config.modResults.AppGroupIdentifier = APP_GROUP_IDENTIFIER;
    return config;
  });

  config = withEntitlementsPlist(config, (config) => {
    const existingGroups = config.modResults['com.apple.security.application-groups'] || [];
    if (!existingGroups.includes(APP_GROUP_IDENTIFIER)) {
      config.modResults['com.apple.security.application-groups'] = [
        ...existingGroups,
        APP_GROUP_IDENTIFIER,
      ];
    }
    return config;
  });

  config = withXcodeProject(config, async (config) => {
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    copyWidgetFiles(platformProjectRoot);

    applyWidgetTargetToPbxProject(config.modResults, {
      appIdentifier: config.ios?.bundleIdentifier || 'com.cruxlog.app',
      currentProjectVersion: config.ios?.buildNumber || '1',
      marketingVersion: config.version || '1.0.0',
    });

    return config;
  });

  return config;
};

withLiveActivityWidget.copyWidgetFiles = copyWidgetFiles;
withLiveActivityWidget.applyWidgetTargetToPbxProject = applyWidgetTargetToPbxProject;

module.exports = withLiveActivityWidget;
