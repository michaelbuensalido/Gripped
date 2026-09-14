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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BetaVideoPlayerModalProps {
  visible: boolean;
  videoUri: string | null;
  gradeRaw?: string;
  zoneName?: string;
  outcome?: 'flash' | 'send' | 'attempt' | string;
  durationSeconds?: number;
  onClose: () => void;
}

const SPEED_OPTIONS: number[] = [0.25, 0.5, 1.0];
const FRAME_DURATION = 1 / 30; // ~0.0333s per frame

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

        {/* ── Top Header Controls ────────────────────────────────────────── */}
        <View
          style={[
            styles.topHeader,
            { paddingTop: Math.max(insets.top + 8, Platform.OS === 'ios' ? 52 : 28) },
            !showControls && styles.hiddenOverlay,
          ]}
          pointerEvents={showControls ? 'auto' : 'none'}
        >
          {/* Grade Pill & Zone Info */}
          <View style={styles.headerLeft}>
            <View style={styles.gradePill}>
              <Text style={styles.gradePillText}>{gradeRaw}</Text>
            </View>

            <View style={styles.headerMeta}>
              <Text style={styles.zoneText} numberOfLines={1}>
                {zoneName}
              </Text>
              <View style={styles.outcomeBadge}>
                <Text style={styles.outcomeBadgeText}>
                  {isFlash ? '⚡ FLASH' : isSent ? '✓ SENT' : 'ATTEMPT'}
                </Text>
              </View>
            </View>
          </View>

          {/* Header Right: Mute & Close */}
          <View style={styles.headerRight}>
            {!isImage && (
              <TouchableOpacity
                onPress={handleToggleMute}
                style={styles.iconCircleBtn}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isMuted ? <VolumeX size={18} color="#FFFFFF" /> : <Volume2 size={18} color="#6EE756" />}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              style={styles.closeBtn}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Bottom Scrubbing & Playback Controller Bar ─────────────────── */}
        <View
          style={[
            styles.bottomControlsContainer,
            { paddingBottom: Math.max(insets.bottom + 12, 28) },
            !showControls && styles.hiddenOverlay,
          ]}
          pointerEvents={showControls ? 'auto' : 'none'}
        >
          {/* 1. Timeline Scrubber Bar */}
          <Pressable style={styles.scrubberTouchArea} onPress={handleScrub}>
            <View style={styles.scrubberTrack}>
              <View style={[styles.scrubberFill, { width: `${progressRatio * 100}%` }]} />
              <View style={[styles.scrubberThumb, { left: `${progressRatio * 100}%` }]} />
            </View>
          </Pressable>

          {/* Time Readout Row */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>

          {/* 2. Controls Row: Speed Chips & Frame Step Buttons */}
          <View style={styles.controllerRow}>
            {/* Speed Selector Chips */}
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>SPEED</Text>
              {SPEED_OPTIONS.map((opt) => {
                const isActive = speed === opt;
                return (
                  <TouchableOpacity
                    key={`speed_${opt}`}
                    onPress={() => handleSetSpeed(opt)}
                    style={[styles.speedChip, isActive && styles.speedChipActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.speedChipText, isActive && styles.speedChipTextActive]}>
                      {opt}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Frame Step Controls (-1 Frame / Play / +1 Frame) */}
            <View style={styles.frameStepRow}>
              <TouchableOpacity
                onPress={handleStepPrevFrame}
                style={styles.frameStepBtn}
                activeOpacity={0.75}
              >
                <ChevronLeft size={16} color="#FFFFFF" />
                <Text style={styles.frameStepText}>-1 FR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTogglePlay}
                style={styles.playPauseMiniBtn}
                activeOpacity={0.8}
              >
                {isPlaying ? (
                  <Pause size={18} color="#121216" fill="#121216" />
                ) : (
                  <Play size={18} color="#121216" fill="#121216" style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStepNextFrame}
                style={styles.frameStepBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.frameStepText}>+1 FR</Text>
                <ChevronRight size={16} color="#FFFFFF" />
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
    paddingBottom: 16,
    backgroundColor: 'rgba(10, 10, 12, 0.80)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  gradePill: {
    backgroundColor: '#6EE756', // Lime Green #6EE756
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6EE756',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  gradePillText: {
    color: '#0A0A0C',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerMeta: {
    flex: 1,
  },
  zoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  outcomeBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  outcomeBadgeText: {
    color: '#A0A0B0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 12, 0.88)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 30,
  },
  scrubberTouchArea: {
    height: 24,
    justifyContent: 'center',
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    position: 'relative',
  },
  scrubberFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8E7CFF',
  },
  scrubberThumb: {
    position: 'absolute',
    top: -5,
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
    marginTop: 2,
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
    gap: 12,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedLabel: {
    color: '#707080',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 2,
  },
  speedChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  speedChipActive: {
    backgroundColor: '#8E7CFF', // Active pill in #8E7CFF
    borderColor: '#8E7CFF',
  },
  speedChipText: {
    color: '#A0A0B0',
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
    gap: 8,
  },
  frameStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  frameStepText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  playPauseMiniBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6EE756',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6EE756',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});
