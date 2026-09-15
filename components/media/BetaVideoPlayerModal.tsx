import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import type { FailureReason } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BetaVideoPlayerModalProps {
  visible: boolean;
  videoUri: string | null;
  gradeRaw?: string;
  zoneName?: string;
  outcome?: 'flash' | 'send' | 'attempt' | string;
  failureReason?: FailureReason | string | null;
  durationSeconds?: number;
  onClose: () => void;
}

const SPEED_OPTIONS: number[] = [0.25, 0.5, 1.0];
const FRAME_DURATION = 1 / 30; // ~0.0333s per frame

const FAILURE_LABELS: Record<string, string> = {
  foot_slip: 'Foot Slip',
  pumped: 'Pumped',
  beta_error: 'Beta Error',
  reach_span: 'Reach / Span',
  grip_strength: 'Grip Strength',
};

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function BetaVideoPlayerModal({
  visible,
  videoUri,
  gradeRaw = 'V5',
  zoneName = 'Main Wall',
  outcome = 'send',
  failureReason = null,
  durationSeconds = 15,
  onClose,
}: BetaVideoPlayerModalProps) {
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(durationSeconds);
  const [showControls, setShowControls] = useState<boolean>(true);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isImage = Boolean(
    videoUri &&
      (videoUri.endsWith('.jpg') ||
        videoUri.endsWith('.jpeg') ||
        videoUri.endsWith('.png') ||
        videoUri.endsWith('.webp'))
  );

  // Initialize expo-video player
  const player = useVideoPlayer(videoUri || '', (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 1.0;
    p.play();
  });

  // Keep state synced with player
  useEffect(() => {
    if (!visible || !player || isImage) return;

    // Apply initial mute and loop settings
    player.loop = true;
    player.muted = isMuted;
    player.playbackRate = speed;
    player.play();
    setIsPlaying(true);

    const interval = setInterval(() => {
      try {
        if (player.duration > 0) {
          setTotalDuration(player.duration);
        }
        setCurrentTime(player.currentTime);
        setIsPlaying(player.playing);
      } catch {
        // Player might be unmounting
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [visible, player, isMuted, speed, isImage]);

  // Auto-hide controls after 4 seconds of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  useEffect(() => {
    if (visible) {
      resetControlsTimer();
    }
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [visible, resetControlsTimer]);

  if (!visible || !videoUri) return null;

  // Toggle play/pause
  const handleTogglePlay = () => {
    triggerHaptic('light');
    resetControlsTimer();
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    triggerHaptic('selection');
    resetControlsTimer();
    if (!player) return;
    const nextMuted = !isMuted;
    player.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Set playback speed
  const handleSetSpeed = (newSpeed: number) => {
    triggerHaptic('selection');
    resetControlsTimer();
    setSpeed(newSpeed);
    if (player) {
      player.playbackRate = newSpeed;
    }
  };

  // Step -1 Frame
  const handleStepPrevFrame = () => {
    triggerHaptic('light');
    resetControlsTimer();
    if (player) {
      player.pause();
      setIsPlaying(false);
      const target = Math.max(0, player.currentTime - FRAME_DURATION);
      player.currentTime = target;
      setCurrentTime(target);
    }
  };

  // Step +1 Frame
  const handleStepNextFrame = () => {
    triggerHaptic('light');
    resetControlsTimer();
    if (player) {
      player.pause();
      setIsPlaying(false);
      const target = Math.min(totalDuration, player.currentTime + FRAME_DURATION);
      player.currentTime = target;
      setCurrentTime(target);
    }
  };

  // Scrub timeline on tap
  const handleScrub = (event: any) => {
    resetControlsTimer();
    const { locationX } = event.nativeEvent;
    const barWidth = SCREEN_WIDTH - 32;
    if (barWidth <= 0 || totalDuration <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / barWidth));
    const target = ratio * totalDuration;
    if (player) {
      player.currentTime = target;
      setCurrentTime(target);
      triggerHaptic('selection');
    }
  };

  const isFlash = outcome === 'flash';
  const isSent = outcome === 'send' || isFlash;
  const outcomeText = isFlash ? 'FLASH' : isSent ? 'TOP' : 'ATTEMPT';
  const failureLabel = failureReason ? (FAILURE_LABELS[failureReason] || failureReason) : null;
  const progressRatio = totalDuration > 0 ? Math.min(1, Math.max(0, currentTime / totalDuration)) : 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* ── Viewport: Fullscreen Video / Photo Preview ─────────────────── */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleTogglePlay}>
          {isImage ? (
            <Image source={{ uri: videoUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          ) : (
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              nativeControls={false}
            />
          )}

          {/* Big Center Play/Pause indicator when paused */}
          {!isPlaying && !isImage && (
            <View style={styles.centerPlayBadge}>
              <Play size={36} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          )}
        </Pressable>

        {/* ── Top HUD Bar (pt-12 px-4 flex-row justify-between items-center) ── */}
        <View
          style={[
            styles.topHeader,
            { paddingTop: Math.max(insets.top + 8, Platform.OS === 'ios' ? 48 : 24) },
            !showControls && styles.hiddenOverlay,
          ]}
          pointerEvents={showControls ? 'auto' : 'none'}
        >
          {/* Left: Grade pill (Surface #1E1E24, border 1px #6EE756, px-3 py-1, rounded-full, text 13pt Bold #6EE756) */}
          <View style={styles.gradePill}>
            <Text style={styles.gradePillText}>{gradeRaw} {outcomeText}</Text>
          </View>

          {/* Center: If present, failure tag chip in #8E7CFF (e.g. "Foot Slip") */}
          {failureLabel ? (
            <View style={styles.failureChip}>
              <Text style={styles.failureChipText}>{failureLabel}</Text>
            </View>
          ) : (
            <View style={{ width: 1 }} />
          )}

          {/* Right: Close button (36x36pt circle #1E1E24, border 1px #2C2C35, items-center justify-center, icon X in #FFFFFF) */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              onClose();
            }}
            style={styles.closeBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Tactile Floating Scrubbing Controls (Bottom: Surface #1E1E24, border 1px #2C2C35, rounded-3xl, p-4, mx-4, mb-8) ── */}
        <View
          style={[
            styles.bottomControlsContainer,
            { marginBottom: Math.max(insets.bottom + 8, 32) },
            !showControls && styles.hiddenOverlay,
          ]}
          pointerEvents={showControls ? 'auto' : 'none'}
        >
          {/* Scrubber Slider: track #17171C, thumb Lavender #8E7CFF */}
          <Pressable style={styles.scrubberTouchArea} onPress={handleScrub}>
            <View style={styles.scrubberTrack}>
              <View style={[styles.scrubberFill, { width: `${progressRatio * 100}%` }]} />
              <View style={[styles.scrubberThumb, { left: `${progressRatio * 100}%` }]} />
            </View>
          </Pressable>

          {/* Time Readout: 11pt mono #8A8A98 */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>

          {/* Controls Row: Speed Selector Chips + Frame Stepper Buttons */}
          <View style={styles.controllerRow}>
            {/* Speed Selector Row: chips [ 0.25x ] [ 0.5x ] [ 1.0x ] */}
            <View style={styles.speedRow}>
              {SPEED_OPTIONS.map((opt) => {
                const isActive = speed === opt;
                return (
                  <TouchableOpacity
                    key={`speed_${opt}`}
                    onPress={() => handleSetSpeed(opt)}
                    style={[styles.speedChip, isActive && styles.speedChipActive]}
                    activeOpacity={0.75}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Text style={[styles.speedChipText, isActive && styles.speedChipTextActive]}>
                      {opt}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Frame Stepper Buttons: [-1 Frame] and [+1 Frame] */}
            <View style={styles.frameStepRow}>
              <TouchableOpacity
                onPress={handleStepPrevFrame}
                style={styles.frameStepBtn}
                activeOpacity={0.75}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={14} color="#8A8A98" />
                <Text style={styles.frameStepText}>-1 Frame</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTogglePlay}
                style={styles.playPauseMiniBtn}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isPlaying ? (
                  <Pause size={15} color="#0A0A0C" fill="#0A0A0C" />
                ) : (
                  <Play size={15} color="#0A0A0C" fill="#0A0A0C" style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStepNextFrame}
                style={styles.frameStepBtn}
                activeOpacity={0.75}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.frameStepText}>+1 Frame</Text>
                <ChevronRight size={14} color="#8A8A98" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C', // Deep canvas surface
    justifyContent: 'space-between',
  },
  hiddenOverlay: {
    opacity: 0,
  },
  centerPlayBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -32,
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(14, 14, 20, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 30,
  },
  gradePill: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#6EE756',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gradePillText: {
    color: '#6EE756',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  failureChip: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#8E7CFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  failureChipText: {
    color: '#8E7CFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    zIndex: 30,
  },
  scrubberTouchArea: {
    height: 24,
    justifyContent: 'center',
  },
  scrubberTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: '#22222A',
    position: 'relative',
    overflow: 'visible',
  },
  scrubberFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#8E7CFF',
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8E7CFF',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  timeText: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  controllerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: '#22222A',
  },
  speedChipActive: {
    backgroundColor: '#8E7CFF',
    borderColor: '#8E7CFF',
  },
  speedChipText: {
    color: '#8A8A98',
    fontSize: 12,
    fontWeight: '700',
  },
  speedChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  frameStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  frameStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: '#22222A',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  frameStepText: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '600',
  },
  playPauseMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8E7CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
