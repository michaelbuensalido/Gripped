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
 *
 * Orientation fix: The back camera sensor on iOS outputs frames rotated 90° clockwise
 * relative to the portrait UI. We must tell Vision the frame is in `.right` orientation
 * so it internally rotates the pixel data before inference. Using `.up` would force the
 * model to look for an upright person in a sideways frame → zero detections.
 *
 * Confidence threshold: Lowered to 0.2 (from 0.5) because climbers face the wall,
 * showing only their back, which reduces per-joint model confidence significantly.
 */
@objc(ClimbingPoseTrackerPlugin)
public class ClimbingPoseTrackerPlugin: FrameProcessorPlugin {

  // Minimum per-joint confidence accepted. Lower than default because climbers
  // face away from camera (back-of-body pose), reducing Vision's certainty.
  private let kMinJointConfidence: Float = 0.2

  // Minimum number of confident joints required to declare a climber is present.
  private let kMinJointsForClimber: Int = 2

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  /// Derives the correct CGImagePropertyOrientation from the VisionCamera frame metadata.
  /// VisionCamera v4 exposes `frame.orientation` as UIInterfaceOrientation.
  /// The back camera sensor is rotated 90° CW from portrait, so:
  ///   - Portrait device         → frame data is landscape-right  → `.right`
  ///   - Landscape-right device  → frame data is upright          → `.up`
  ///   - Landscape-left device   → frame data is upside-down      → `.down`
  ///   - Portrait-upsideDown     → frame data is landscape-left   → `.left`
  private func imageOrientation(from frame: Frame) -> CGImagePropertyOrientation {
    switch frame.orientation {
    case .landscapeRight:
      return .up        // device rotated CW → frame is already upright
    case .landscapeLeft:
      return .down      // device rotated CCW → frame is upside-down
    case .portraitUpsideDown:
      return .left      // device upside-down → frame is landscape-left
    default:
      // .portrait (default shooting orientation on iOS)
      // Back camera raw frames are rotated 90° CW → Vision needs `.right`
      return .right
    }
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
      return [
        "hasClimber": false,
        "landmarks": [:]
      ]
    }

    let request = VNDetectHumanBodyPoseRequest()
    // Use the orientation derived from device/frame metadata instead of hardcoded `.up`
    let orientation = imageOrientation(from: frame)
    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation, options: [:])

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
        if let point = recognizedPoints[jointName], point.confidence >= kMinJointConfidence {
          // Invert y to convert from Vision's bottom-left origin to screen top-left origin.
          // Do NOT invert X: for the back camera, no left-right mirroring is needed.
          landmarks[key] = [
            "x": Double(point.location.x),
            "y": Double(1.0 - point.location.y),
            "confidence": Double(point.confidence)
          ]
        }
      }

      // Require at least kMinJointsForClimber confident joints before asserting a climber
      // is present. A single noisy detection on an empty wall should not trigger the HUD.
      let hasClimber = landmarks.count >= kMinJointsForClimber

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
