const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const shimPath = path.resolve(__dirname, "shims/react-native-linear-gradient.js");

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "react-native-linear-gradient": shimPath,
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-linear-gradient") {
    return {
      filePath: shimPath,
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
