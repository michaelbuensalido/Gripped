#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#if __has_include("CruxLog-Swift.h")
#import "CruxLog-Swift.h"
#elif __has_include("cruxlog-Swift.h")
#import "cruxlog-Swift.h"
#endif

VISION_EXPORT_SWIFT_FRAME_PROCESSOR(detectClimbingPose, ClimbingPoseTrackerPlugin)
