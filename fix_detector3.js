const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'ios', 'VisionCameraV3PoseDetection.m');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'MLKPoseDetectorOptions *options = [[MLKPoseDetectorOptions alloc] init];\n  options.detectorMode = MLKPoseDetectorModeStream;\n  _poseDetector = [MLKPoseDetector poseDetectorWithOptions:options];',
  'MLKPoseDetectorOptions *mlkOptions = [[MLKPoseDetectorOptions alloc] init];\n  mlkOptions.detectorMode = MLKPoseDetectorModeStream;\n  _poseDetector = [MLKPoseDetector poseDetectorWithOptions:mlkOptions];'
);

fs.writeFileSync(filePath, content);
console.log('Fixed options variable shadowing.');
