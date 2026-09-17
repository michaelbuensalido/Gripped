const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'ios', 'VisionCameraV3PoseDetection.m');
let content = fs.readFileSync(filePath, 'utf8');

// replace the dispatch group and async call with synchronous call
const asyncCallRegex = /dispatch_group_t dispatchGroup = dispatch_group_create\(\);[\s\S]*?dispatch_group_wait\(dispatchGroup, DISPATCH_TIME_FOREVER\);/m;

const syncCall = `
    NSError *error = nil;
    NSArray<MLKPose *> *poses = [self.poseDetector resultsInImage:image error:&error];
    
    if (error == nil && poses != nil && poses.count > 0) {
        [result setValue:@(YES) forKey:@"hasClimber"];
        MLKPose *pose = poses.firstObject;
        NSMutableDictionary *landmarks = [[NSMutableDictionary alloc] init];
        
        NSArray<MLKPoseLandmark *> *allLandmarks = pose.landmarks;
        for (MLKPoseLandmark *landmark in allLandmarks) {
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
            
            MLKVision3DPoint *position = landmark.position;
            // Normalize coordinates (0.0 to 1.0)
            double normX = position.x / frameWidth;
            double normY = position.y / frameHeight;
            
            landmarks[name] = @{
                @"x": @(normX),
                @"y": @(normY),
                @"confidence": @(landmark.inFrameLikelihood)
            };
        }
        [result setValue:landmarks forKey:@"landmarks"];
    } else if (error != nil) {
        // You can expose the error string back to JS if needed
        [result setValue:error.localizedDescription forKey:@"error"];
    }
`;

content = content.replace(asyncCallRegex, syncCall);
fs.writeFileSync(filePath, content);
console.log('Fixed async/sync issue.');
