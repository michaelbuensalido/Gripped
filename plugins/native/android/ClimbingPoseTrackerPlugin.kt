package com.cruxlog.pose

import android.media.Image
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

/**
 * ClimbingPoseTrackerPlugin
 *
 * High-performance on-device Frame Processor Plugin for VisionCamera v4 on Android.
 * Utilizes Google ML Kit Pose Detection bundle (com.google.mlkit:pose-detection)
 * for real-time edge pose tracking of climbers.
 *
 * Normalizes all landmarks to [0.0, 1.0] relative to frame dimensions.
 *
 * Orientation fix: `frame.orientation` is derived from VisionCamera's frame metadata and
 * passed directly into `InputImage.fromMediaImage(mediaImage, rotationDegrees)`. ML Kit
 * uses this value to internally correct the pixel orientation before inference.
 * Without it, portrait-camera frames (rotated 90°) cause zero detections.
 *
 * Confidence threshold: `inFrameLikelihood >= 0.25f` — lower than the standard 0.5f
 * because climbers face the wall (back-body pose), which reduces model certainty.
 * Minimum 2 confident joints required to assert a climber is present.
 */
class ClimbingPoseTrackerPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {

  // Minimum in-frame likelihood to accept a landmark. Lowered for back-body climbing pose.
  private val kMinLandmarkConfidence = 0.25f

  // Minimum number of confident landmarks to declare a climber is present.
  private val kMinLandmarksForClimber = 2

  private val detectorOptions = PoseDetectorOptions.Builder()
    .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
    // Enable GPU acceleration for real-time throughput on modern Android devices
    .setPreferredHardwareConfigs(PoseDetectorOptions.CPU_GPU)
    .build()

  private val poseDetector = PoseDetection.getClient(detectorOptions)

  override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val image: Image = frame.image ?: return mapOf(
      "hasClimber" to false,
      "landmarks" to emptyMap<String, Any>()
    )

    // Pass the rotation degrees from frame metadata so ML Kit corrects the orientation
    // before inference. Omitting this causes 0 detections in portrait mode (90° offset).
    val inputImage = InputImage.fromMediaImage(image, frame.orientation.toDegrees())
    val width = image.width.toDouble()
    val height = image.height.toDouble()

    return try {
      val pose = Tasks.await(poseDetector.process(inputImage))
      val landmarks = mutableMapOf<String, Map<String, Any>>()

      val landmarkMappings = listOf(
        Pair(PoseLandmark.LEFT_SHOULDER, "leftShoulder"),
        Pair(PoseLandmark.RIGHT_SHOULDER, "rightShoulder"),
        Pair(PoseLandmark.LEFT_ELBOW, "leftElbow"),
        Pair(PoseLandmark.RIGHT_ELBOW, "rightElbow"),
        Pair(PoseLandmark.LEFT_WRIST, "leftWrist"),
        Pair(PoseLandmark.RIGHT_WRIST, "rightWrist"),
        Pair(PoseLandmark.LEFT_HIP, "leftHip"),
        Pair(PoseLandmark.RIGHT_HIP, "rightHip"),
        Pair(PoseLandmark.LEFT_KNEE, "leftKnee"),
        Pair(PoseLandmark.RIGHT_KNEE, "rightKnee"),
        Pair(PoseLandmark.LEFT_ANKLE, "leftAnkle"),
        Pair(PoseLandmark.RIGHT_ANKLE, "rightAnkle")
      )

      for ((landmarkType, key) in landmarkMappings) {
        val landmark = pose.getPoseLandmark(landmarkType)
        // Accept landmarks at or above the minimum confidence threshold
        if (landmark != null && landmark.inFrameLikelihood >= kMinLandmarkConfidence) {
          landmarks[key] = mapOf(
            "x" to (landmark.position.x / width),
            "y" to (landmark.position.y / height),
            "confidence" to landmark.inFrameLikelihood.toDouble()
          )
        }
      }

      // Require a minimum number of distinct landmarks before asserting climber presence.
      // This prevents a single noisy detection on an empty wall triggering the HUD.
      val hasClimber = landmarks.size >= kMinLandmarksForClimber

      mapOf(
        "hasClimber" to hasClimber,
        "landmarks" to landmarks
      )
    } catch (e: Exception) {
      mapOf(
        "hasClimber" to false,
        "landmarks" to emptyMap<String, Any>()
      )
    }
  }
}
