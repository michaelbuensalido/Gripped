const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'ios', 'VisionCameraV3PoseDetection.m');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('#import <MLKitPoseDetectionAccurate/MLKAccuratePoseDetectorOptions.h>', '#import <MLKitPoseDetection/MLKPoseDetectorOptions.h>');
content = content.replace('MLKAccuratePoseDetectorOptions *options =', 'MLKPoseDetectorOptions *options =');
content = content.replace('[[MLKAccuratePoseDetectorOptions alloc] init]', '[[MLKPoseDetectorOptions alloc] init]');

fs.writeFileSync(filePath, content);
console.log('Patched for standard MLKPoseDetectorOptions.');
