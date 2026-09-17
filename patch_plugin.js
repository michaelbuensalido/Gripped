const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'ios', 'VisionCameraV3PoseDetection.m');
let content = fs.readFileSync(filePath, 'utf8');

const newObjC = `
#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/Frame.h>
#import <MLKitVision/MLKVisionImage.h>
#import <MLKitPoseDetection/MLKPoseDetector.h>
#import <MLKitPoseDetectionAccurate/MLKAccuratePoseDetectorOptions.h>
#import <MLKitPoseDetection/MLKPoseLandmark.h>
#import <MLKitPoseDetection/MLKPose.h>

@interface VisionCameraV3PoseDetectionPlugin : FrameProcessorPlugin
@end

@implementation VisionCameraV3PoseDetectionPlugin

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy
                  withOptions:(NSDictionary* _Nullable)options {
  self = [super initWithProxy:proxy withOptions:options];
  return self;
}

- (id)callback:(Frame *)frame withArguments:(NSDictionary *)arguments {
    CMSampleBufferRef buffer = frame.buffer;
    UIImageOrientation orientation = frame.orientation;
    
    MLKAccuratePoseDetectorOptions *options =
    [[MLKAccuratePoseDetectorOptions alloc] init];
    options.detectorMode = MLKPoseDetectorModeStream;
    
    MLKPoseDetector *poseDetector =
    [MLKPoseDetector poseDetectorWithOptions:options];
    
    MLKVisionImage *image = [[MLKVisionImage alloc] initWithBuffer:buffer];
    image.orientation = orientation;
    
    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(buffer);
    double frameWidth = (double)CVPixelBufferGetWidth(pixelBuffer);
    double frameHeight = (double)CVPixelBufferGetHeight(pixelBuffer);
    
    // For portrait orientations, width and height are swapped
    if (orientation == UIImageOrientationLeft || orientation == UIImageOrientationRight || orientation == UIImageOrientationLeftMirrored || orientation == UIImageOrientationRightMirrored) {
        double temp = frameWidth;
        frameWidth = frameHeight;
        frameHeight = temp;
    }

    dispatch_group_t dispatchGroup = dispatch_group_create();
    dispatch_group_enter(dispatchGroup);
    
    __block NSMutableDictionary *result = [[NSMutableDictionary alloc] init];
    [result setValue:@(NO) forKey:@"hasClimber"];
    [result setValue:[[NSMutableDictionary alloc] init] forKey:@"landmarks"];
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
        [poseDetector processImage:image
                        completion:^(NSArray<MLKPose *> *_Nullable poses,
                                     NSError *_Nullable error) {
            
            if (error == nil && poses != nil && poses.count > 0) {
                [result setValue:@(YES) forKey:@"hasClimber"];
                MLKPose *pose = poses.firstObject;
                NSMutableDictionary *landmarks = [[NSMutableDictionary alloc] init];
                
                NSArray<MLKPoseLandmark *> *allLandmarks = pose.landmarks;
                for (MLKPoseLandmark *landmark in allLandmarks) {
                    NSString *name = @"";
                    switch (landmark.type) {
                        case MLKPoseLandmarkTypeLeftShoulder: name = @"leftShoulder"; break;
                        case MLKPoseLandmarkTypeRightShoulder: name = @"rightShoulder"; break;
                        case MLKPoseLandmarkTypeLeftElbow: name = @"leftElbow"; break;
                        case MLKPoseLandmarkTypeRightElbow: name = @"rightElbow"; break;
                        case MLKPoseLandmarkTypeLeftWrist: name = @"leftWrist"; break;
                        case MLKPoseLandmarkTypeRightWrist: name = @"rightWrist"; break;
                        case MLKPoseLandmarkTypeLeftHip: name = @"leftHip"; break;
                        case MLKPoseLandmarkTypeRightHip: name = @"rightHip"; break;
                        case MLKPoseLandmarkTypeLeftKnee: name = @"leftKnee"; break;
                        case MLKPoseLandmarkTypeRightKnee: name = @"rightKnee"; break;
                        case MLKPoseLandmarkTypeLeftAnkle: name = @"leftAnkle"; break;
                        case MLKPoseLandmarkTypeRightAnkle: name = @"rightAnkle"; break;
                        default: continue; // skip face and hands/feet points to save bandwidth
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
            }
            dispatch_group_leave(dispatchGroup);
        }];
    });
    dispatch_group_wait(dispatchGroup, DISPATCH_TIME_FOREVER);
    
    return result;
}

VISION_EXPORT_FRAME_PROCESSOR(VisionCameraV3PoseDetectionPlugin, detectPose)

@end
`;

fs.writeFileSync(filePath, newObjC.trim());
console.log('Patched VisionCameraV3PoseDetection.m successfully.');
