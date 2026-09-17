const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'ios', 'VisionCameraV3PoseDetection.m');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('#import <MLKitPoseDetection/MLKPoseDetector.h>', '#import <MLKitPoseDetectionCommon/MLKPoseDetector.h>');
content = content.replace('#import <MLKitPoseDetection/MLKPoseLandmark.h>', '#import <MLKitPoseDetectionCommon/MLKPoseLandmark.h>');
content = content.replace('#import <MLKitPoseDetection/MLKPose.h>', '#import <MLKitPoseDetectionCommon/MLKPose.h>');

fs.writeFileSync(filePath, content);
console.log('Fixed imports.');
