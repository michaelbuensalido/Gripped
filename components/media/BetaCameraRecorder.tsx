
import { CameraView, useCameraPermissions as useExpoCameraPermissions, useMicrophonePermissions as useExpoMicrophonePermissions } from 'expo-camera';

const isExpoGo = typeof globalThis !== 'undefined' && (globalThis as any).expo?.modules?.ExponentConstants?.appOwnership === 'expo';

let VisionCamera: any = null;
let useCameraDevice: any = () => null;
let useCameraPermission: any = () => ({ hasPermission: false, requestPermission: async () => false });
let useMicrophonePermission: any = () => ({ hasPermission: false, requestPermission: async () => false });

if (!isExpoGo) {
  try {
    const RNCamera = require('react-native-vision-camera');
    VisionCamera = RNCamera.Camera;
    useCameraDevice = RNCamera.useCameraDevice;
    useCameraPermission = RNCamera.useCameraPermission;
    useMicrophonePermission = RNCamera.useMicrophonePermission;
  } catch (e) {}
}

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Platform } from 'react-native';
import { VideoGradingService, GradingEvaluationResult, FramePoseSample } from '../../services/grading/videoGradingService';
import { SkeletonOverlay, normalizeAspectFillKeypoints } from './SkeletonOverlay';
import { useClimbingPoseTracker } from '../../hooks/useClimbingPoseTracker';
import { triggerHaptic } from '../../utils/haptics';

// Check if the native ML pose plugin was loaded (only in dev builds with the VisionCamera plugin)
let nativePoseAvailable = false;
if (!isExpoGo) {
  try {
    const vc = require('react-native-vision-camera');
    if (vc?.VisionCameraProxy?.initFrameProcessorPlugin) {
      const plugin = vc.VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});
      nativePoseAvailable = plugin != null;
    }
  } catch {}
}

export interface BetaCameraRecorderProps {
  visible: boolean;
  onClose: () => void;
  onBetaRecorded?: (videoUri: string, evaluation: GradingEvaluationResult) => void;
  setId?: string | null;
  onAttach?: (mediaUri: string, mediaType: 'video' | 'photo', gradeRaw?: string, notes?: string) => void;
  initialMode?: 'photo' | 'video';
  gradeLabel?: string;
  setIndex?: number;
  autoSimulatorBypass?: boolean;
  testReview?: boolean;
  testSetGrader?: boolean;
  testHoldAnnotator?: boolean;
  testAngle?: number;
  testPickerOpen?: boolean;
  testValidationFailure?: any;
  testValidationPassed?: boolean;
  testSimulateClimber?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function BetaCameraRecorder({
  visible,
  onClose,
  onBetaRecorded,
  setId,
}: BetaCameraRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingEvaluationResult | null>(null);
  const samplesRef = useRef<FramePoseSample[]>([]);

  const [expoCameraPerm, requestExpoCameraPerm] = useExpoCameraPermissions();
  const [expoMicroPerm, requestExpoMicroPerm] = useExpoMicrophonePermissions();
  const visionCamPerm = useCameraPermission();
  const visionMicPerm = useMicrophonePermission();

  const hasCameraPermission = !!expoCameraPerm?.granted || !!visionCamPerm?.hasPermission;
  const hasMicrophonePermission = !!expoMicroPerm?.granted || !!visionMicPerm?.hasPermission;
  
  const device = useCameraDevice('back');
  


  const { poseState, frameProcessor } = useClimbingPoseTracker({});

  useEffect(() => {
    if (visible && !hasCameraPermission) {
      requestExpoCameraPerm();
      requestExpoMicroPerm();
    }
  }, [visible, hasCameraPermission]);

  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      if (poseState.landmarks && Object.keys(poseState.landmarks).length > 0) {
        const keypoints = Object.entries(poseState.landmarks).map(([name, pt]) => ({
          name,
          x: pt.x,
          y: pt.y,
          score: pt.confidence,
        }));
        samplesRef.current.push({
          timestampMs: Date.now(),
          keypoints,
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording, poseState.landmarks]);

  const startRecording = () => {
    samplesRef.current = [];
    recordingStartTimeRef.current = Date.now();
    setIsRecording(true);
    triggerHaptic('success');
  };

  const handleStopRecording = () => {
    const elapsedDurationMs = Date.now() - recordingStartTimeRef.current;
    setIsRecording(false);
    triggerHaptic('selection');
    
    setTimeout(() => {
      const result = VideoGradingService.evaluateClimbValidity(samplesRef.current, elapsedDurationMs);
      setGradingResult(result);
      
      if (result.isValidClimb && onBetaRecorded && setId) {
        triggerHaptic('success');
        onBetaRecorded('file://mock-video.mp4', result);
      } else if (!result.isValidClimb) {
        triggerHaptic('error');
      }
    }, 100);
  };

  if (!visible) return null;

  const allPoints = Object.entries(poseState.landmarks || {});
  const validPoints = allPoints.filter(([name, pt]) => pt.confidence >= 0.40);
  const hasShoulder = validPoints.some(([name]) => name.includes('Shoulder') || name.includes('shoulder'));
  const hasHip = validPoints.some(([name]) => name.includes('Hip') || name.includes('hip'));
  const isClimberLocked = validPoints.length >= 5 && (hasShoulder || hasHip);
  const avgConfidence = validPoints.length > 0
    ? validPoints.reduce((acc, [, pt]) => acc + pt.confidence, 0) / validPoints.length
    : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>

        {/* ── Hardware Top Strip ─────────────────────────────────── */}
        <View style={styles.topStrip}>
          {/* Left: dismiss */}
          <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>

          {/* Center: status text (monospaced, no pill background) */}
          <View style={styles.statusGroup}>
            {isRecording ? (
              <Text style={styles.statusRec}>● REC</Text>
            ) : isClimberLocked ? (
              <Text style={styles.statusLocked}>◉ LOCKED</Text>
            ) : (
              <Text style={styles.statusIdle}>◎ STANDBY</Text>
            )}
            <Text style={styles.statusSub}>
              {nativePoseAvailable ? 'ML KIT' : 'SIM'}
              {'  '}
              {(avgConfidence * 100).toFixed(0)}% CONF
            </Text>
          </View>

          {/* Right: spacer to balance layout */}
          <View style={{ width: 44 }} />
        </View>

        {/* ── Camera Preview ─────────────────────────────────────── */}
        <View style={styles.cameraPreview}>
          {hasCameraPermission ? (
            !isExpoGo && device && VisionCamera ? (
              <VisionCamera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={visible}
                video={true}
                audio={hasMicrophonePermission}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
              />
            ) : (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                mode="video"
              />
            )
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.permissionView]}>
              <Text style={styles.permTitle}>Camera & Microphone Required</Text>
              <Text style={styles.permSub}>
                Enable permissions to record beta and track climbing sequences.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await requestExpoCameraPerm();
                  await requestExpoMicroPerm();
                }}
                style={styles.permBtn}
              >
                <Text style={styles.permBtnText}>ENABLE PERMISSIONS</Text>
              </TouchableOpacity>
            </View>
          )}

          <SkeletonOverlay
            keypoints={
              nativePoseAvailable
                ? normalizeAspectFillKeypoints(
                    Object.entries(poseState.landmarks || {}).map(([name, pt]) => ({
                      name, x: pt.x, y: pt.y, score: pt.confidence
                    })),
                    720, 1280,
                    screenWidth, screenHeight
                  )
                : Object.entries(poseState.landmarks || {}).map(([name, pt]) => ({
                    name, x: pt.x, y: pt.y, score: pt.confidence
                  }))
            }
            containerWidth={screenWidth}
            containerHeight={screenHeight}
          />
        </View>

        {/* ── Shutter ────────────────────────────────────────────── */}
        <View style={styles.shutterContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={isRecording ? handleStopRecording : startRecording}
            style={[styles.outerRing, { borderColor: isRecording ? '#FF453A' : '#FFFFFF' }]}
          >
            <View style={[styles.innerCore, {
              width: isRecording ? 26 : 60,
              height: isRecording ? 26 : 60,
              borderRadius: isRecording ? 6 : 30,
            }]} />
          </TouchableOpacity>
        </View>

        {/* ── Rejection card ─────────────────────────────────────── */}
        {gradingResult && gradingResult.isValidClimb === false && (
          <View style={styles.rejectionOverlay}>
            <View style={styles.rejectionCard}>
              <Text style={styles.rejectionTitle}>INVALID BETA CLIP</Text>
              <Text style={styles.rejectionMessage}>
                {gradingResult.rejectionReason === 'NO_HUMAN_DETECTED'
                  ? 'No climber detected. Frame the sequence clearly.'
                  : gradingResult.rejectionReason === 'NO_VERTICAL_DISPLACEMENT'
                  ? 'No significant climbing motion detected.'
                  : 'Clip too short. Record the full climb.'}
              </Text>
              <TouchableOpacity
                onPress={() => setGradingResult(null)}
                style={styles.rejectionBtn}
              >
                <Text style={styles.rejectionBtnText}>DISMISS & RETRY</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111113',
  },

  // ── Top HUD Strip (full-width, no pills) ──────────────────────────────────
  topStrip: {
    paddingTop: 52,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17, 17, 19, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: '#27272F',
    zIndex: 50,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  dismissBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#19191D',
    borderWidth: 1,
    borderColor: '#27272F',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#9090A0',
    fontSize: 18,
    fontWeight: '600',
  },
  statusGroup: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statusRec: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.6,
  },
  statusLocked: {
    color: '#6EE756',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.2,
  },
  statusIdle: {
    color: '#555562',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.2,
  },
  statusSub: {
    color: '#333340',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.0,
  },

  // ── Camera preview ─────────────────────────────────────────────────────────
  cameraPreview: {
    flex: 1,
  },

  // ── Permission screen ──────────────────────────────────────────────────────
  permissionView: {
    backgroundColor: '#111113',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  permSub: {
    color: '#9090A0',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: '#8E7CFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.8,
  },

  // ── Shutter ────────────────────────────────────────────────────────────────
  shutterContainer: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    zIndex: 50,
  },
  outerRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCore: {
    backgroundColor: '#FF453A',
  },

  // ── Rejection card ─────────────────────────────────────────────────────────
  rejectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  rejectionCard: {
    backgroundColor: '#19191D',
    borderColor: '#27272F',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
  },
  rejectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rejectionMessage: {
    color: '#9090A0',
    fontSize: 13,
    textAlign: 'center',
  },
  rejectionBtn: {
    backgroundColor: '#27272F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  rejectionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
});

