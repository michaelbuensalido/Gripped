import Foundation
import Vision
import VisionCamera
import CoreMedia

/**
 * ClimbingPoseTrackerPlugin
 *
 * High-performance on-device Frame Processor Plugin for VisionCamera v4 on iOS.
 * Utilizes Apple Vision's VNDetectHumanBodyPoseRequest running natively on the Apple Neural Engine
 * with zero third-party binary dependencies.
 *
 * Extracts 8 core climbing landmarks:
 * - Wrists (leftWrist, rightWrist)
 * - Elbows (leftElbow, rightElbow)
 * - Hips (leftHip, rightHip)
 * - Ankles (leftAnkle, rightAnkle)
 *
 * All coordinates are normalized to [0.0, 1.0] in top-left screen coordinate space.
 */
@objc(ClimbingPoseTrackerPlugin)
public class ClimbingPoseTrackerPlugin: FrameProcessorPlugin {

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
      return [
        "hasClimber": false,
        "landmarks": [:]
      ]
    }

    let request = VNDetectHumanBodyPoseRequest()
    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up, options: [:])

    do {
      try handler.perform([request])
    } catch {
      return [
        "hasClimber": false,
        "landmarks": [:]
      ]
    }

    guard let observations = request.results, let observation = observations.first else {
      return [
        "hasClimber": false,
        "landmarks": [:]
      ]
    }

    do {
      let recognizedPoints = try observation.recognizedPoints(.all)
      var landmarks: [String: [String: Any]] = [:]

      let jointMap: [(VNHumanBodyPoseObservation.JointName, String)] = [
        (.leftWrist, "leftWrist"),
        (.rightWrist, "rightWrist"),
        (.leftElbow, "leftElbow"),
        (.rightElbow, "rightElbow"),
        (.leftHip, "leftHip"),
        (.rightHip, "rightHip"),
        (.leftAnkle, "leftAnkle"),
        (.rightAnkle, "rightAnkle"),
      ]

      for (jointName, key) in jointMap {
        if let point = recognizedPoints[jointName], point.confidence > 0.1 {
          // Invert y to convert from Vision's bottom-left origin to screen top-left origin
          landmarks[key] = [
            "x": Double(point.location.x),
            "y": Double(1.0 - point.location.y),
            "confidence": Double(point.confidence)
          ]
        }
      }

      let hasClimber = !landmarks.isEmpty && (landmarks["leftWrist"] != nil || landmarks["rightWrist"] != nil)

      return [
        "hasClimber": hasClimber,
        "landmarks": landmarks
      ]
    } catch {
      return [
        "hasClimber": false,
        "landmarks": [:]
      ]
    }
  }
}
