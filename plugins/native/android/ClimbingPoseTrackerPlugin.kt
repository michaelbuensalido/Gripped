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
 */
class ClimbingPoseTrackerPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {

  private val options = PoseDetectorOptions.Builder()
    .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
    .build()

  private val poseDetector = PoseDetection.getClient(options)

  override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val image: Image = frame.image ?: return mapOf(
      "hasClimber" to false,
      "landmarks" to emptyMap<String, Any>()
    )

    val inputImage = InputImage.fromMediaImage(image, frame.orientation.toDegrees())
    val width = image.width.toDouble()
    val height = image.height.toDouble()

    return try {
      val pose = Tasks.await(poseDetector.process(inputImage))
      val landmarks = mutableMapOf<String, Map<String, Any>>()

      val landmarkMappings = listOf(
        Pair(PoseLandmark.LEFT_WRIST, "leftWrist"),
        Pair(PoseLandmark.RIGHT_WRIST, "rightWrist"),
        Pair(PoseLandmark.LEFT_ELBOW, "leftElbow"),
        Pair(PoseLandmark.RIGHT_ELBOW, "rightElbow"),
        Pair(PoseLandmark.LEFT_HIP, "leftHip"),
        Pair(PoseLandmark.RIGHT_HIP, "rightHip"),
        Pair(PoseLandmark.LEFT_ANKLE, "leftAnkle"),
        Pair(PoseLandmark.RIGHT_ANKLE, "rightAnkle")
      )

      for ((landmarkType, key) in landmarkMappings) {
        val landmark = pose.getPoseLandmark(landmarkType)
        if (landmark != null && landmark.inFrameLikelihood > 0.15f) {
          landmarks[key] = mapOf(
            "x" to (landmark.position.x / width),
            "y" to (landmark.position.y / height),
            "confidence" to landmark.inFrameLikelihood.toDouble()
          )
        }
      }

      val hasClimber = landmarks.isNotEmpty() &&
        (landmarks.containsKey("leftWrist") || landmarks.containsKey("rightWrist"))

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
