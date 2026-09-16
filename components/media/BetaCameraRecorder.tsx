
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
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { VideoGradingService, GradingEvaluationResult, FramePoseSample } from '../../services/grading/videoGradingService';
import { SkeletonOverlay, normalizeAspectFillKeypoints } from './SkeletonOverlay';
import { useClimbingPoseTracker } from '../../hooks/useClimbingPoseTracker';
import { triggerHaptic } from '../../utils/haptics';

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

  const validPoints = Object.entries(poseState.landmarks || {}).filter(([name, pt]) => pt.confidence >= 0.60);
  const hasShoulder = validPoints.some(([name, pt]) => name.includes('shoulder'));
  const hasHip = validPoints.some(([name, pt]) => name.includes('hip'));
  const isClimberLocked = validPoints.length >= 8 && hasShoulder && hasHip;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top HUD Bar */}
        <View style={styles.hudBar}>
          <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>

          {isRecording ? (
            <View style={styles.recordingPill}>
              <View style={styles.dotRed} />
              <Text style={styles.recordingText}>Recording Kinematics...</Text>
            </View>
          ) : isClimberLocked ? (
            <View style={styles.lockedPill}>
              <View style={styles.dotGreen} />
              <Text style={styles.lockedText}>Climber Locked • Tracking Active</Text>
            </View>
          ) : (
            <View style={styles.idlePill}>
              <View style={styles.dotGray} />
              <Text style={styles.idleText}>Looking for Climber...</Text>
            </View>
          )}
        </View>

        {/* Camera Preview */}
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
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A0E', alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
                Camera & Microphone Required
              </Text>
              <Text style={{ color: '#8A8A98', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                Enable permissions to record beta and track climbing sequences.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await requestExpoCameraPerm();
                  await requestExpoMicroPerm();
                }}
                style={{ backgroundColor: '#8E7CFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Enable Permissions</Text>
              </TouchableOpacity>
            </View>
          )}

          <SkeletonOverlay 
            keypoints={
              normalizeAspectFillKeypoints(
                Object.entries(poseState.landmarks || {}).map(([name, pt]) => ({
                  name, x: pt.x, y: pt.y, score: pt.confidence
                })),
                720, 1280,
                screenWidth, screenHeight
              )
            }
            containerWidth={screenWidth}
            containerHeight={screenHeight}
          />
        </View>

        {/* Shutter controls */}
        <View style={styles.shutterContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={isRecording ? handleStopRecording : startRecording}
            style={[styles.outerRing, { borderColor: isRecording ? '#FF453A' : '#FFFFFF' }]}
          >
            <View style={[styles.innerCore, {
              width: isRecording ? 28 : 62,
              height: isRecording ? 28 : 62,
              borderRadius: isRecording ? 6 : 31,
            }]} />
          </TouchableOpacity>
        </View>

        {/* Error Card */}
        {gradingResult && gradingResult.isValidClimb === false && (
          <View style={styles.rejectionOverlay}>
            <View style={styles.rejectionCard}>
              <Text style={styles.rejectionTitle}>Invalid Beta Clip</Text>
              <Text style={styles.rejectionMessage}>
                {gradingResult.rejectionReason === 'NO_HUMAN_DETECTED' ? 'No climber detected. Frame the sequence clearly.' :
                 gradingResult.rejectionReason === 'NO_VERTICAL_DISPLACEMENT' ? 'No significant climbing motion detected.' :
                 'Clip too short. Record the full climb.'}
              </Text>
              <TouchableOpacity 
                onPress={() => setGradingResult(null)} 
                style={styles.rejectionBtn}
              >
                <Text style={styles.rejectionBtnText}>Dismiss & Try Again</Text>
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
    backgroundColor: '#131316',
  },
  hudBar: {
    paddingTop: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  dismissBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(30, 30, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  recordingPill: {
    backgroundColor: 'rgba(23, 23, 28, 0.9)',
    borderWidth: 1,
    borderColor: '#FF453A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lockedPill: {
    backgroundColor: 'rgba(23, 23, 28, 0.9)',
    borderWidth: 1,
    borderColor: '#6EE756',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedText: {
    color: '#6EE756',
    fontSize: 12,
    fontWeight: '700',
  },
  idlePill: {
    backgroundColor: 'rgba(23, 23, 28, 0.85)',
    borderWidth: 1,
    borderColor: '#2C2C35',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idleText: {
    color: '#8A8A98',
    fontSize: 12,
    fontWeight: '500',
  },
  dotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF453A' },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6EE756' },
  dotGray: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8A8A98' },
  cameraPreview: {
    flex: 1,
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    zIndex: 50,
  },
  outerRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCore: {
    backgroundColor: '#FF453A',
  },
  rejectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  rejectionCard: {
    backgroundColor: '#1E1E24',
    borderColor: '#2C2C35',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  rejectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  rejectionMessage: {
    color: '#9A9AA6',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  rejectionBtn: {
    backgroundColor: '#2C2C35',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  rejectionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
