// Shim react-native-linear-gradient to expo-linear-gradient for Expo compatibility
const { LinearGradient } = require('expo-linear-gradient');

module.exports = LinearGradient;
module.exports.LinearGradient = LinearGradient;
module.exports.default = LinearGradient;
