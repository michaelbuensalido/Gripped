const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'ios', 'VisionCameraV3PoseDetection.m');
let content = fs.readFileSync(filePath, 'utf8');

// The initialization failed to inject because of `\n` mismatch maybe?
const initTarget = '  return self;\n}';
if (content.includes(initTarget) && !content.includes('_poseDetector =')) {
  content = content.replace(
    initTarget,
    '  MLKPoseDetectorOptions *options = [[MLKPoseDetectorOptions alloc] init];\n  options.detectorMode = MLKPoseDetectorModeStream;\n  _poseDetector = [MLKPoseDetector poseDetectorWithOptions:options];\n  return self;\n}'
  );
}

// And let's remove the MLKPoseDetectorOptions alloc from callback
content = content.replace(/    MLKPoseDetectorOptions \*options =[\s\S]*?\[MLKPoseDetector poseDetectorWithOptions:options\];/m, '');

fs.writeFileSync(filePath, content);
console.log('Fixed detector instantiation step 2.');
