const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'ios', 'VisionCameraV3PoseDetection.m');
let content = fs.readFileSync(filePath, 'utf8');

// Add property
content = content.replace(
  '@interface VisionCameraV3PoseDetectionPlugin : FrameProcessorPlugin\n@end',
  '@interface VisionCameraV3PoseDetectionPlugin : FrameProcessorPlugin\n@property (nonatomic, strong) MLKPoseDetector *poseDetector;\n@end'
);

// Initialize inside initWithProxy
content = content.replace(
  'return self;\n}',
  '  MLKPoseDetectorOptions *options = [[MLKPoseDetectorOptions alloc] init];\n  options.detectorMode = MLKPoseDetectorModeStream;\n  _poseDetector = [MLKPoseDetector poseDetectorWithOptions:options];\n  return self;\n}'
);

// Remove the instantiation from callback and use self.poseDetector
content = content.replace(
  /    MLKPoseDetectorOptions \*options =[\s\S]*?\[MLKPoseDetector poseDetectorWithOptions:options\];/,
  ''
);

content = content.replace(
  /\[poseDetector processImage:image/g,
  '[self.poseDetector processImage:image'
);

fs.writeFileSync(filePath, content);
console.log('Fixed detector instantiation.');
