const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'ios', 'VisionCameraV3PoseDetection.m');
let content = fs.readFileSync(filePath, 'utf8');

// Fix MLKVision3DPoint import
if (!content.includes('#import <MLKitVision/MLKVision3DPoint.h>')) {
  content = content.replace('#import <MLKitVision/MLKVisionImage.h>', '#import <MLKitVision/MLKVisionImage.h>\n#import <MLKitVision/MLKVision3DPoint.h>');
}

// Replace the switch statement with a dictionary approach
const switchPattern = /NSString \*name = @"";[\s\S]*?default: continue;[\s\S]*?}/;

const dictApproach = `
                    static NSDictionary *typeToName = nil;
                    static dispatch_once_t onceToken;
                    dispatch_once(&onceToken, ^{
                        typeToName = @{
                            MLKPoseLandmarkTypeLeftShoulder: @"leftShoulder",
                            MLKPoseLandmarkTypeRightShoulder: @"rightShoulder",
                            MLKPoseLandmarkTypeLeftElbow: @"leftElbow",
                            MLKPoseLandmarkTypeRightElbow: @"rightElbow",
                            MLKPoseLandmarkTypeLeftWrist: @"leftWrist",
                            MLKPoseLandmarkTypeRightWrist: @"rightWrist",
                            MLKPoseLandmarkTypeLeftHip: @"leftHip",
                            MLKPoseLandmarkTypeRightHip: @"rightHip",
                            MLKPoseLandmarkTypeLeftKnee: @"leftKnee",
                            MLKPoseLandmarkTypeRightKnee: @"rightKnee",
                            MLKPoseLandmarkTypeLeftAnkle: @"leftAnkle",
                            MLKPoseLandmarkTypeRightAnkle: @"rightAnkle"
                        };
                    });
                    
                    NSString *name = typeToName[landmark.type];
                    if (name == nil) {
                        continue;
                    }
`;

content = content.replace(switchPattern, dictApproach.trim());

fs.writeFileSync(filePath, content);
console.log('Fixed Objective-C strings and imports.');
