import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  type CameraType,
  type FlashMode,
} from 'expo-camera';
import { VideoPlayerView } from '../ui/VideoPlayerView';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import {
  X,
  Zap,
  ZapOff,
  RotateCcw,
  Check,
  Camera,
  Video as VideoIcon,
  RefreshCw,
  Sparkles,
  Compass,
  Target,
  AlertTriangle,
} from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import { useWallAngle } from '../../hooks/useWallAngle';
import { GradeEstimationSheet } from './GradeEstimationSheet';
import { HoldAnnotatorCanvas } from './HoldAnnotatorCanvas';
import { RouteAnnotationPayload } from '../../services/gradeEstimator';
import {
  extractClimbingKeyframes,
  validateClimbingSequence,
  ValidationResult,
  ValidationFailureReason,
} from '../../services/videoAnalyzer';
import { useClimbingPoseTracker } from '../../hooks/useClimbingPoseTracker';
import { PoseSkeletonOverlay } from './PoseSkeletonOverlay';

interface BetaCamModalProps {
  visible: boolean;
  onClose: () => void;
  onAttach: (
    mediaUri: string,
    mediaType: 'video' | 'photo',
    gradeRaw?: string,
    notes?: string
  ) => void;
  initialMode?: 'video' | 'photo';
  gradeLabel?: string;
  setIndex?: number;
  autoSimulatorBypass?: boolean;
  testReview?: boolean;
  testSetGrader?: boolean;
  testHoldAnnotator?: boolean;
  testAngle?: number;
  testPickerOpen?: boolean;
  testValidationFailure?: ValidationFailureReason;
  testValidationPassed?: boolean;
}

const MAX_RECORDING_SECONDS = 45;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const RETICLE_WIDTH = Math.round(screenWidth * 0.82);
const RETICLE_HEIGHT = Math.round(screenHeight * 0.44);

export function BetaCamModal({
  visible,
  onClose,
  onAttach,
  initialMode = 'video',
  gradeLabel,
  setIndex,
  autoSimulatorBypass = false,
  testReview = false,
  testSetGrader = false,
  testHoldAnnotator = false,
  testAngle,
  testPickerOpen = false,
  testValidationFailure,
  testValidationPassed = false,
}: BetaCamModalProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const [mode, setMode] = useState<'video' | 'photo'>(initialMode);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{
    uri: string;
    type: 'video' | 'photo';
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [simulatorBypass, setSimulatorBypass] = useState(autoSimulatorBypass);

  // ── Sensor & Set Grader Integration ─────────────────────────────────────────
  const wallAngle = useWallAngle(visible);
  const [capturedAngle, setCapturedAngle] = useState<number | null>(null);
  const [showEstimationSheet, setShowEstimationSheet] = useState(false);
  const [annotationPayload, setAnnotationPayload] = useState<RouteAnnotationPayload | null>(null);
  const [showHoldAnnotator, setShowHoldAnnotator] = useState(testHoldAnnotator || false);

  // ── Smart Climbing Validation State ─────────────────────────────────────────
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [manualGradeOverride, setManualGradeOverride] = useState(false);

  // ── On-Device Real-Time Pose & Hold Contact Tracker ─────────────────────────
  const { poseState, resetTracker } = useClimbingPoseTracker({
    enabled: visible && !capturedMedia,
    enableSimulatorSimulation: true,
    onHandContactChange: (isContacting) => {
      if (isContacting) {
        triggerHaptic('light');
      }
    },
  });

  // Angle stability detection (switches leveling dot green when held steady)
  const [isStable, setIsStable] = useState(true);
  const lastAngleRef = useRef(wallAngle.angleDegrees);
  const stabilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (wallAngle.angleDegrees !== lastAngleRef.current) {
      lastAngleRef.current = wallAngle.angleDegrees;
      setIsStable(false);
      if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current);
      stabilityTimerRef.current = setTimeout(() => {
        setIsStable(true);
      }, 400);
    }
  }, [wallAngle.angleDegrees]);

  // AI Scanning Reticle Laser Animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !capturedMedia) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [visible, capturedMedia, laserAnim]);

  const cameraRef = useRef<CameraView>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync mode when reopened or when test params change
  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      if (testAngle !== undefined) {
        wallAngle.setAngle(testAngle);
      }
      if (testValidationFailure) {
        const mockThumb = require('../../assets/holds-images/v6-ripple-effect-square.jpg');
        setCapturedMedia({
          uri: 'mock_beta_fail.mp4',
          type: 'video',
        });
        setCapturedAngle(testAngle ?? 35);
        setValidationResult({
          isValid: false,
          confidence: 0.35,
          detectedHoldsCount: testValidationFailure === 'NO_HOLDS' ? 1 : 6,
          climberDetected: testValidationFailure !== 'NO_CLIMBER',
          failureReason: testValidationFailure,
          keyframes: [mockThumb, mockThumb, mockThumb],
          metrics: {
            holdContrastRatio: testValidationFailure === 'NO_HOLDS' ? 0.25 : 0.82,
            climberPoseConfidence: testValidationFailure === 'NO_CLIMBER' ? 0.12 : 0.91,
            handHoldContact: testValidationFailure !== 'NO_CLIMBER',
            chromaticVariance: testValidationFailure === 'POOR_LIGHTING' ? 0.15 : 0.74,
            averageBrightness: testValidationFailure === 'POOR_LIGHTING' ? 0.18 : 0.62,
          },
          extractedTimestampsMs: [2000, 5000, 8000],
        });
        setManualGradeOverride(false);
        setShowEstimationSheet(false);
        setShowHoldAnnotator(false);
      } else if (testValidationPassed) {
        const mockThumb = require('../../assets/holds-images/v6-ripple-effect-square.jpg');
        setCapturedMedia({
          uri: 'mock_beta_valid.mp4',
          type: 'video',
        });
        setCapturedAngle(testAngle ?? 35);
        setValidationResult({
          isValid: true,
          confidence: 0.94,
          detectedHoldsCount: 6,
          climberDetected: true,
          keyframes: [mockThumb, mockThumb, mockThumb],
          metrics: {
            holdContrastRatio: 0.88,
            climberPoseConfidence: 0.94,
            handHoldContact: true,
            chromaticVariance: 0.78,
            averageBrightness: 0.65,
          },
          extractedTimestampsMs: [2000, 5000, 8000],
        });
        setManualGradeOverride(false);
        setShowEstimationSheet(true);
        setShowHoldAnnotator(false);
      } else if (testHoldAnnotator) {
        setCapturedMedia({
          uri: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80',
          type: 'photo',
        });
        setCapturedAngle(testAngle ?? 35);
        setShowHoldAnnotator(true);
        setShowEstimationSheet(false);
        setValidationResult(null);
        setManualGradeOverride(false);
      } else if (testSetGrader) {
        setCapturedMedia({
          uri: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80',
          type: 'photo',
        });
        setCapturedAngle(testAngle ?? 35);
        setShowEstimationSheet(true);
        setShowHoldAnnotator(false);
        setValidationResult(null);
        setManualGradeOverride(false);
      } else if (testReview) {
        setCapturedMedia({
          uri: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80',
          type: 'photo',
        });
        setShowEstimationSheet(false);
        setShowHoldAnnotator(false);
        setValidationResult(null);
        setManualGradeOverride(false);
      } else {
        setCapturedMedia(null);
        setShowEstimationSheet(false);
        setShowHoldAnnotator(false);
        setCapturedAngle(null);
        setAnnotationPayload(null);
        setValidationResult(null);
        setManualGradeOverride(false);
      }
      setIsRecording(false);
      setRecordingSeconds(0);
      setIsProcessing(false);
      setIsValidating(false);
      if (autoSimulatorBypass) {
        setSimulatorBypass(true);
      }
    }
  }, [
    visible,
    initialMode,
    autoSimulatorBypass,
    testReview,
    testSetGrader,
    testHoldAnnotator,
    testAngle,
    testValidationFailure,
    testValidationPassed,
  ]);

  // Clean up timer on unmount or close
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
        stabilityTimerRef.current = null;
      }
    };
  }, []);

  // Format seconds as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Smart Climbing Validation Logic ────────────────────────────────────────

  const getRejectionMessage = (reason?: ValidationFailureReason): string => {
    switch (reason) {
      case 'NO_WALL':
      case 'NO_HOLDS':
        return 'Could not detect climbing wall or resin holds. Ensure the camera frames the wall clearly.';
      case 'NO_CLIMBER':
        return 'No climber or hand contact detected on holds. Make sure the burn sequence is visible.';
      case 'POOR_LIGHTING':
        return 'Insufficient lighting or high glare. Improve gym lighting or adjust angle.';
      default:
        return 'Could not verify a valid climbing sequence in this video. Please frame the wall and climber clearly.';
    }
  };

  const processVideoValidation = async (videoUri: string, durationSec: number = 10) => {
    setIsProcessing(true);
    setIsValidating(true);
    setManualGradeOverride(false);
    try {
      const { keyframes } = await extractClimbingKeyframes(videoUri, {
        durationSeconds: durationSec,
      });
      const result = await validateClimbingSequence(keyframes, {
        durationSeconds: durationSec,
        testFailureReason: testValidationFailure,
      });
      setValidationResult(result);
      if (result.isValid) {
        triggerHaptic('success');
        setShowEstimationSheet(true);
      } else {
        triggerHaptic('error');
        setShowEstimationSheet(false);
      }
    } catch (err) {
      console.warn('Video validation error, applying fallback rejection:', err);
      const fallbackThumb = require('../../assets/holds-images/v6-ripple-effect-square.jpg');
      setValidationResult({
        isValid: false,
        confidence: 0.35,
        detectedHoldsCount: 1,
        climberDetected: false,
        failureReason: 'NO_CLIMBER',
        keyframes: [fallbackThumb, fallbackThumb, fallbackThumb],
        metrics: {
          holdContrastRatio: 0.2,
          climberPoseConfidence: 0.15,
          handHoldContact: false,
          chromaticVariance: 0.2,
          averageBrightness: 0.5,
        },
        extractedTimestampsMs: [2000, 5000, 8000],
      });
      triggerHaptic('error');
      setShowEstimationSheet(false);
    } finally {
      setIsValidating(false);
      setIsProcessing(false);
    }
  };

  // ── Shutter Action (Photo / Video) ──────────────────────────────────────────

  const handleStartRecording = async () => {
    if (isRecording) return;
    try {
      triggerHaptic('medium');
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            handleStopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

      if (cameraRef.current && cameraPermission?.granted) {
        const video = await cameraRef.current.recordAsync({
          maxDuration: MAX_RECORDING_SECONDS,
        });

        if (video?.uri) {
          setCapturedAngle(wallAngle.angleDegrees);
          setCapturedMedia({ uri: video.uri, type: 'video' });
          await processVideoValidation(video.uri, recordingSeconds || 10);
        }
      }
    } catch (err) {
      console.warn('Camera recordAsync error (simulator fallback available):', err);
      handleMockCapture('video');
    }
  };

  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    try {
      triggerHaptic('light');
      setCapturedAngle(wallAngle.angleDegrees);
      if (cameraRef.current && cameraPermission?.granted) {
        cameraRef.current.stopRecording();
      } else {
        handleMockCapture('video');
      }
    } catch (err) {
      console.warn('Camera stopRecording error:', err);
      handleMockCapture('video');
    }
    setIsRecording(false);
  };

  const handleTakePhoto = async () => {
    if (isProcessing) return;
    try {
      triggerHaptic('medium');
      setIsProcessing(true);
      setCapturedAngle(wallAngle.angleDegrees);
      if (cameraRef.current && cameraPermission?.granted) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: true,
        });
        if (photo?.uri) {
          setCapturedMedia({ uri: photo.uri, type: 'photo' });
          setShowHoldAnnotator(true);
          setShowEstimationSheet(false);
        }
      } else {
        await handleMockCapture('photo');
      }
    } catch (err) {
      console.warn('Camera takePictureAsync error (simulator fallback available):', err);
      await handleMockCapture('photo');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock capture for Simulator or Hardware-limited environments
  const handleMockCapture = async (fallbackType: 'video' | 'photo') => {
    try {
      setIsProcessing(true);
      setCapturedAngle(wallAngle.angleDegrees);
      const betaDir = `${FileSystem.documentDirectory}beta/`;
      const dirInfo = await FileSystem.getInfoAsync(betaDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(betaDir, { intermediates: true });
      }

      // Use bundled hold asset as mock preview
      const asset = Asset.fromModule(
        require('../../assets/holds-images/v6-ripple-effect-square.jpg')
      );
      await asset.downloadAsync();
      const mockUri = asset.localUri || asset.uri;

      setCapturedMedia({
        uri: mockUri,
        type: fallbackType,
      });
      if (fallbackType === 'photo') {
        setShowHoldAnnotator(true);
        setShowEstimationSheet(false);
      } else {
        await processVideoValidation(mockUri, 10);
      }
    } catch (e) {
      console.error('Failed to create mock capture:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Attach Beta Handlers ───────────────────────────────────────────────────

  const handleAcceptGrading = async (selectedGrade: string, notes: string) => {
    if (!capturedMedia) return;
    setIsProcessing(true);
    try {
      const betaDir = `${FileSystem.documentDirectory}beta/`;
      const dirInfo = await FileSystem.getInfoAsync(betaDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(betaDir, { intermediates: true });
      }

      const ext = capturedMedia.type === 'video' ? 'mp4' : 'jpg';
      const destUri = `${betaDir}beta_${Date.now()}.${ext}`;

      if (capturedMedia.uri.startsWith('file://')) {
        await FileSystem.copyAsync({
          from: capturedMedia.uri,
          to: destUri,
        });
        onAttach(destUri, capturedMedia.type, selectedGrade, notes);
      } else {
        onAttach(capturedMedia.uri, capturedMedia.type, selectedGrade, notes);
      }

      triggerHaptic('success');
      setShowEstimationSheet(false);
      setShowHoldAnnotator(false);
      setValidationResult(null);
      setManualGradeOverride(false);
      onClose();
    } catch (err) {
      console.error('Failed to attach graded beta media:', err);
      onAttach(capturedMedia.uri, capturedMedia.type, selectedGrade, notes);
      setShowEstimationSheet(false);
      setShowHoldAnnotator(false);
      setValidationResult(null);
      setManualGradeOverride(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAttach = async () => {
    if (!capturedMedia) return;
    setIsProcessing(true);
    try {
      const betaDir = `${FileSystem.documentDirectory}beta/`;
      const dirInfo = await FileSystem.getInfoAsync(betaDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(betaDir, { intermediates: true });
      }

      const ext = capturedMedia.type === 'video' ? 'mp4' : 'jpg';
      const destUri = `${betaDir}beta_${Date.now()}.${ext}`;

      if (capturedMedia.uri.startsWith('file://')) {
        await FileSystem.copyAsync({
          from: capturedMedia.uri,
          to: destUri,
        });
        onAttach(destUri, capturedMedia.type);
      } else {
        onAttach(capturedMedia.uri, capturedMedia.type);
      }

      triggerHaptic('success');
      setValidationResult(null);
      setManualGradeOverride(false);
      onClose();
    } catch (err) {
      console.error('Failed to attach beta media:', err);
      onAttach(capturedMedia.uri, capturedMedia.type);
      setValidationResult(null);
      setManualGradeOverride(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    triggerHaptic('light');
    setCapturedMedia(null);
    setShowEstimationSheet(false);
    setShowHoldAnnotator(false);
    setAnnotationPayload(null);
    setCapturedAngle(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    setValidationResult(null);
    setManualGradeOverride(false);
    setIsValidating(false);
    resetTracker();
  };

  const toggleFacing = () => {
    triggerHaptic('light');
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    triggerHaptic('light');
    setFlash((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  // ── Permission Card ───────────────────────────────────────────────────────

  if (!cameraPermission?.granted && !capturedMedia && !simulatorBypass) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.permHeader}>
            <TouchableOpacity onPress={onClose} style={styles.glassCircleBtn} activeOpacity={0.7}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.permCard}>
            <View style={styles.permIconContainer}>
              <Camera size={36} color="#8E7CFF" />
            </View>
            <Text style={styles.permTitle}>Beta Cam & AI Grader</Text>
            <Text style={styles.permDesc}>
              CruxLog needs camera and microphone permission so you can record beta sequences,
              analyze wall angles with device sensors, and auto-estimate route grades.
            </Text>

            <TouchableOpacity
              onPress={async () => {
                triggerHaptic('medium');
                await requestCameraPermission();
                await requestMicrophonePermission();
              }}
              style={styles.primaryBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Enable Camera & Mic</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSimulatorBypass(true)}
              style={styles.mockBtn}
              activeOpacity={0.8}
            >
              <Sparkles size={16} color="#8E7CFF" style={{ marginRight: 6 }} />
              <Text style={styles.mockBtnText}>Simulator Viewfinder (Live HUD)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMockCapture(mode)}
              style={[styles.mockBtn, { marginTop: 10, borderColor: 'rgba(255, 255, 255, 0.08)' }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.mockBtnText, { color: '#9A9AA6' }]}>Direct Mock Capture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Main Fullscreen Camera / Review View ──────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* ── State 1: Review Captured Media / Route Isolator ─────────────────────────────── */}
        {capturedMedia && capturedMedia.type === 'photo' && showHoldAnnotator ? (
          <HoldAnnotatorCanvas
            imageUri={capturedMedia.uri}
            wallAngleDegrees={capturedAngle ?? wallAngle.angleDegrees}
            onAnalyze={(payload) => {
              setAnnotationPayload(payload);
              setShowHoldAnnotator(false);
              setShowEstimationSheet(true);
            }}
            onClose={() => setShowHoldAnnotator(false)}
          />
        ) : capturedMedia ? (
          <View style={styles.reviewContainer}>
            {/* Viewport */}
            <View style={styles.mediaViewport}>
              {capturedMedia.type === 'video' ? (
                <VideoPlayerView
                  uri={capturedMedia.uri}
                  style={StyleSheet.absoluteFill}
                  nativeControls={false}
                  loop
                  autoPlay
                />
              ) : (
                <Image
                  source={{ uri: capturedMedia.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                />
              )}

              {/* Review Header Overlay */}
              <View style={styles.reviewHeader}>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>
                    {setIndex !== undefined ? `SET #${setIndex}` : 'BETA'}
                    {gradeLabel ? ` • ${gradeLabel}` : ''}
                  </Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {capturedMedia.type === 'video' ? 'VIDEO BETA' : 'PHOTO BETA'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.reviewFooter}>
              <TouchableOpacity
                onPress={handleRetake}
                style={styles.retakeBtn}
                activeOpacity={0.75}
                disabled={isProcessing}
              >
                <RotateCcw size={16} color="#9A9AA6" style={{ marginRight: 6 }} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>

              {capturedMedia.type === 'photo' && (
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setShowHoldAnnotator(true);
                  }}
                  style={styles.annotateBtn}
                  activeOpacity={0.8}
                >
                  <Target size={16} color="#8E7CFF" style={{ marginRight: 6 }} />
                  <Text style={styles.annotateBtnText}>
                    {annotationPayload && annotationPayload.holdCount > 0
                      ? `${annotationPayload.holdCount} Holds`
                      : 'Tag Holds'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  if (
                    capturedMedia.type === 'video' &&
                    validationResult &&
                    !validationResult.isValid &&
                    !manualGradeOverride
                  ) {
                    return;
                  }
                  setShowEstimationSheet(true);
                }}
                style={styles.analyzeBtn}
                activeOpacity={0.8}
              >
                <Sparkles size={16} color="#8E7CFF" style={{ marginRight: 6 }} />
                <Text style={styles.analyzeBtnText}>AI Grade</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAttach}
                style={styles.attachBtn}
                activeOpacity={0.85}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" strokeWidth={3} style={{ marginRight: 6 }} />
                    <Text style={styles.attachBtnText}>Attach</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Validation Rejection Overlay ───────────────────────────── */}
            {capturedMedia.type === 'video' &&
              validationResult &&
              !validationResult.isValid &&
              !manualGradeOverride && (
                <View style={styles.rejectionOverlay}>
                  <View style={styles.rejectionCard}>
                    {/* Icon */}
                    <View style={styles.rejectionIconCircle}>
                      <AlertTriangle size={32} color="#FF5C5C" />
                    </View>

                    {/* Header & Dynamic Message */}
                    <Text style={styles.rejectionTitle}>Invalid Climbing Sequence</Text>
                    <Text style={styles.rejectionMessage}>
                      {getRejectionMessage(validationResult.failureReason)}
                    </Text>

                    {/* Extracted Keyframes Strip */}
                    {validationResult.keyframes && validationResult.keyframes.length > 0 && (
                      <View style={styles.keyframesPreviewSection}>
                        <Text style={styles.keyframesSectionTitle}>EXTRACTED KEYFRAMES</Text>
                        <View style={styles.keyframesRow}>
                          {validationResult.keyframes.slice(0, 3).map((frameUri, idx) => {
                            const label = idx === 0 ? '20%' : idx === 1 ? '50%' : '80%';
                            return (
                              <View key={`keyframe-${idx}`} style={styles.keyframeItem}>
                                <Image
                                  source={
                                    typeof frameUri === 'number'
                                      ? frameUri
                                      : { uri: frameUri }
                                  }
                                  style={styles.keyframeThumb}
                                  resizeMode="cover"
                                />
                                <View style={styles.keyframeBadge}>
                                  <Text style={styles.keyframeBadgeText}>{label}</Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.rejectionActionsRow}>
                      <TouchableOpacity
                        onPress={handleRetake}
                        style={styles.rejectionRetakeBtn}
                        activeOpacity={0.8}
                      >
                        <RotateCcw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.rejectionRetakeText}>Retake Video</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          triggerHaptic('selection');
                          setManualGradeOverride(true);
                          setShowEstimationSheet(true);
                        }}
                        style={styles.rejectionManualBtn}
                        activeOpacity={0.8}
                      >
                        <Sparkles size={16} color="#8E7CFF" style={{ marginRight: 6 }} />
                        <Text style={styles.rejectionManualText}>Manual Grade</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

            {/* Grade Estimation Sheet Modal */}
            <GradeEstimationSheet
              visible={showEstimationSheet}
              angleDegrees={capturedAngle ?? wallAngle.angleDegrees}
              userMedianGrade={gradeLabel || 'V4'}
              initialPickerOpen={testPickerOpen || manualGradeOverride}
              annotationPayload={annotationPayload || undefined}
              isVerifiedSequence={validationResult?.isValid ?? false}
              onAccept={handleAcceptGrading}
              onRetake={handleRetake}
              onClose={() => setShowEstimationSheet(false)}
            />
          </View>
        ) : (
          /* ── State 2: Active Camera Viewport ───────────────────────────── */
          <View style={styles.cameraWrapper}>
            {cameraPermission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                mode={mode === 'video' ? 'video' : 'picture'}
                flash={flash}
                onCameraReady={() => setCameraReady(true)}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A0E', alignItems: 'center', justifyContent: 'center' }]}>
                <Image
                  source={require('../../assets/holds-images/v6-ripple-effect-square.jpg')}
                  style={[StyleSheet.absoluteFill, { opacity: 0.28 }]}
                  resizeMode="cover"
                />
                <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(142, 124, 255, 0.3)' }}>
                  <Text style={{ color: '#8E7CFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>SIMULATOR VIEWFINDER</Text>
                </View>
              </View>
            )}

            {/* ── Real-Time Pose Skeleton & Hold Contact Overlay ───────────── */}
            <PoseSkeletonOverlay poseState={poseState} />

            {/* ── Reticle ("Scanning Route") ─────────────────────────────────── */}
            <View style={styles.reticleContainer} pointerEvents="none">
              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {/* AI Pulsing Laser Bar */}
              <Animated.View
                style={[
                  styles.laserBar,
                  {
                    transform: [
                      {
                        translateY: laserAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, RETICLE_HEIGHT - 6],
                        }),
                      },
                    ],
                    opacity: laserAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.35, 0.95, 0.35],
                    }),
                  },
                ]}
              />

              {/* Center Label Badge */}
              <View style={styles.reticleBadge}>
                <Text style={styles.reticleBadgeText}>FRAME START & TOP HOLDS</Text>
              </View>
            </View>

            {/* ── Top HUD ─────────────────────────────────────────────────── */}
            <View style={styles.topHud}>
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => {
                  if (isRecording) {
                    handleStopRecording();
                  }
                  onClose();
                }}
                style={styles.glassCircleBtn}
                activeOpacity={0.7}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Mode Toggle: [ Video ] | [ Photo ] */}
              <View style={styles.modeSegment}>
                <TouchableOpacity
                  onPress={() => {
                    if (isRecording) return;
                    triggerHaptic('selection');
                    setMode('video');
                  }}
                  style={[styles.modeTab, mode === 'video' && styles.modeTabActive]}
                  activeOpacity={0.8}
                >
                  <VideoIcon
                    size={14}
                    color={mode === 'video' ? '#FFFFFF' : '#8A8A98'}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[styles.modeTabText, mode === 'video' && styles.modeTabTextActive]}
                  >
                    Video
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (isRecording) return;
                    triggerHaptic('selection');
                    setMode('photo');
                  }}
                  style={[styles.modeTab, mode === 'photo' && styles.modeTabActive]}
                  activeOpacity={0.8}
                >
                  <Camera
                    size={14}
                    color={mode === 'photo' ? '#FFFFFF' : '#8A8A98'}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[styles.modeTabText, mode === 'photo' && styles.modeTabTextActive]}
                  >
                    Photo
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Flash Mode Toggle */}
              <TouchableOpacity
                onPress={toggleFlash}
                style={styles.glassCircleBtn}
                activeOpacity={0.7}
              >
                {flash === 'off' ? (
                  <ZapOff size={18} color="#8A8A98" />
                ) : (
                  <Zap size={18} color={flash === 'on' ? '#F59E0B' : '#6EE756'} />
                )}
              </TouchableOpacity>
            </View>

            {/* ── Inclinometer HUD Overlay ─────────────────────────────────── */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                wallAngle.cycleSimulatedAngle();
              }}
              activeOpacity={0.8}
              style={styles.inclinometerPill}
            >
              <Compass size={14} color="#8E7CFF" style={{ marginRight: 6 }} />
              <Text style={styles.inclinometerText}>
                Angle: {wallAngle.angleDegrees}° ({wallAngle.wallInfo.category})
              </Text>
              <View
                style={[
                  styles.levelingDot,
                  { backgroundColor: isStable ? '#6EE756' : '#8E7CFF' },
                ]}
              />
            </TouchableOpacity>

            {/* ── Live Recording HUD (when recording) ──────────────────────── */}
            {isRecording && (
              <View style={styles.recordingTimerContainer}>
                <View style={styles.recordingPill}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.recordingTimerText}>
                    {formatTime(recordingSeconds)} / 00:45 max
                  </Text>
                </View>
              </View>
            )}

            {/* ── Bottom HUD ──────────────────────────────────────────────── */}
            <View style={styles.bottomHud}>
              {/* Flip camera */}
              <TouchableOpacity
                onPress={toggleFacing}
                style={styles.glassCircleBtnLarge}
                activeOpacity={0.7}
                disabled={isRecording}
              >
                <RefreshCw size={22} color={isRecording ? '#555562' : '#FFFFFF'} />
              </TouchableOpacity>

              {/* Shutter Button */}
              <View style={styles.shutterOuterRing}>
                {mode === 'video' ? (
                  isRecording ? (
                    // Stop button: red rounded square
                    <TouchableOpacity
                      onPress={handleStopRecording}
                      activeOpacity={0.8}
                      style={styles.videoStopShutter}
                    >
                      <View style={styles.stopSquare} />
                    </TouchableOpacity>
                  ) : (
                    // Start video button: red circle
                    <TouchableOpacity
                      onPress={handleStartRecording}
                      activeOpacity={0.85}
                      style={styles.videoStartShutter}
                    />
                  )
                ) : (
                  // Photo button: lavender ring + white center
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    activeOpacity={0.85}
                    style={styles.photoShutter}
                    disabled={isProcessing}
                  />
                )}
              </View>

              {/* Mock Capture / Simulator Helper */}
              <TouchableOpacity
                onPress={() => handleMockCapture(mode)}
                style={styles.glassCircleBtnLarge}
                activeOpacity={0.7}
              >
                <Sparkles size={20} color="#8E7CFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Scanning / Validating Overlay ───────────────────────────── */}
        {isValidating && (
          <View style={styles.validatingOverlay}>
            <View style={styles.validatingCard}>
              <ActivityIndicator size="large" color="#8E7CFF" style={{ marginBottom: 16 }} />
              <Text style={styles.validatingTitle}>Analyzing Climbing Sequence...</Text>
              <Text style={styles.validatingSubtitle}>
                Extracting keyframes (20%, 50%, 80%) & checking hold contacts
              </Text>
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
    backgroundColor: '#0D0D11',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  topHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    zIndex: 10,
  },
  glassCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 20, 26, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircleBtnLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(20, 20, 26, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 26, 0.7)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeTabActive: {
    backgroundColor: '#8E7CFF',
  },
  modeTabText: {
    color: '#8A8A98',
    fontSize: 13,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  inclinometerPill: {
    position: 'absolute',
    top: 110,
    left: 20,
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  inclinometerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E0E0E8',
    marginRight: 6,
  },
  levelingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  recordingTimerContainer: {
    position: 'absolute',
    top: 154,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingTimerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  reticleContainer: {
    position: 'absolute',
    top: (screenHeight - RETICLE_HEIGHT) / 2 - 20,
    left: (screenWidth - RETICLE_WIDTH) / 2,
    width: RETICLE_WIDTH,
    height: RETICLE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#8E7CFF',
    opacity: 0.6,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 8,
  },
  laserBar: {
    position: 'absolute',
    top: 4,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: '#8E7CFF',
    shadowColor: '#8E7CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  reticleBadge: {
    backgroundColor: 'rgba(20, 20, 26, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  reticleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bottomHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 28,
    paddingBottom: 48,
    zIndex: 10,
  },
  shutterOuterRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoStartShutter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#EF4444',
  },
  videoStopShutter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  photoShutter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: '#0D0D11',
    justifyContent: 'space-between',
  },
  mediaViewport: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#121216',
  },
  reviewHeader: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradeBadge: {
    backgroundColor: 'rgba(20, 20, 26, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gradeBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  typeBadge: {
    backgroundColor: 'rgba(142, 124, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8E7CFF',
  },
  typeBadgeText: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
    backgroundColor: '#16161C',
    borderTopWidth: 1,
    borderColor: '#2C2C35',
    gap: 10,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#2C2C35',
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: {
    color: '#9A9AA6',
    fontSize: 14,
    fontWeight: '700',
  },
  annotateBtn: {
    flex: 1.1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#8E7CFF',
    backgroundColor: 'rgba(142, 124, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  annotateBtnText: {
    color: '#8E7CFF',
    fontSize: 14,
    fontWeight: '800',
  },
  analyzeBtn: {
    flex: 1.1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#8E7CFF',
    backgroundColor: 'rgba(142, 124, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnText: {
    color: '#8E7CFF',
    fontSize: 14,
    fontWeight: '800',
  },
  attachBtn: {
    flex: 1.2,
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8E7CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  permHeader: {
    paddingHorizontal: 20,
    paddingTop: 56,
  },
  permCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(142, 124, 255, 0.12)',
    borderWidth: 1,
    borderColor: '#8E7CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  permDesc: {
    color: '#9A9AA6',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8E7CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  mockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  mockBtnText: {
    color: '#8E7CFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // ── Smart Climbing Validation HUD Styles ─────────────────────────────────
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
    borderColor: '#FF5C5C',
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  rejectionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  rejectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  rejectionMessage: {
    color: '#9A9AA6',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  keyframesPreviewSection: {
    width: '100%',
    marginBottom: 20,
  },
  keyframesSectionTitle: {
    color: '#8A8A98',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  keyframesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keyframeItem: {
    flex: 1,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  keyframeThumb: {
    width: '100%',
    height: '100%',
  },
  keyframeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  keyframeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  rejectionActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  rejectionRetakeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2C2C35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rejectionRetakeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectionManualBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 124, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8E7CFF',
  },
  rejectionManualText: {
    color: '#8E7CFF',
    fontSize: 13,
    fontWeight: '700',
  },
  validatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 110,
    paddingHorizontal: 28,
  },
  validatingCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.3)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  validatingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  validatingSubtitle: {
    color: '#9A9AA6',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
