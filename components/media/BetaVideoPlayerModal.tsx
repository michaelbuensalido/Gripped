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
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
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
  MessageSquare,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import type { FailureReason } from '../../types';
import { useVideoNotes } from '../../db/hooks';
import * as B from '../../db/betaQueries';
import { checkClipFileExists } from '../../services/betaFiles';
import { formatTimestamp } from '../../utils/betaLogic';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BetaVideoPlayerModalProps {
  visible: boolean;
  videoUri: string | null;
  videoId?: string | null;
  gradeRaw?: string;
  zoneName?: string;
  outcome?: 'flash' | 'send' | 'attempt' | string;
  failureReason?: FailureReason | string | null;
  durationSeconds?: number;
  onClose: () => void;
  onDeleteClip?: (videoId: string) => void;
}

const SPEED_OPTIONS: number[] = [0.25, 0.5, 1.0, 2.0];
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
  videoId,
  gradeRaw = 'V5',
  zoneName = 'Main Wall',
  outcome = 'send',
  failureReason = null,
  durationSeconds = 15,
  onClose,
  onDeleteClip,
}: BetaVideoPlayerModalProps) {
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(durationSeconds);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [fileMissing, setFileMissing] = useState<boolean>(false);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notes = useVideoNotes(videoId || '');

  const isImage = Boolean(
    videoUri &&
      (videoUri.endsWith('.jpg') ||
        videoUri.endsWith('.jpeg') ||
        videoUri.endsWith('.png') ||
        videoUri.endsWith('.webp'))
  );

  // Check file presence
  useEffect(() => {
    if (!visible || !videoUri) {
      setFileMissing(false);
      return;
    }
    if (!videoUri.startsWith('http') && !videoUri.startsWith('file://mock')) {
      const exists = checkClipFileExists(videoUri);
      setFileMissing(!exists);
    } else {
      setFileMissing(false);
    }
  }, [visible, videoUri]);

  // Initialize expo-video player
  const player = useVideoPlayer(videoUri || '', (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 1.0;
    p.play();
  });

  // Keep state synced with player
  useEffect(() => {
    if (!visible || !player || isImage || fileMissing) return;

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
  }, [visible, player, isMuted, speed, isImage, fileMissing]);

  // Auto-hide controls after 5 seconds of inactivity (only if notes panel is closed)
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (!showNotes) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
  }, [showNotes]);

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

  // Seek directly to a timestamped note
  const handleSeekToNote = (timestampSec: number) => {
    triggerHaptic('selection');
    resetControlsTimer();
    if (player) {
      player.pause();
      setIsPlaying(false);
      player.currentTime = timestampSec;
      setCurrentTime(timestampSec);
    }
  };

  // Add new note at current time
  const handleAddNote = () => {
    if (!videoId || !noteDraft.trim()) return;
    triggerHaptic('success');
    B.addVideoNote(videoId, currentTime, noteDraft.trim());
    setNoteDraft('');
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    triggerHaptic('medium');
    B.deleteVideoNote(noteId);
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
        {/* Missing / corrupt file fallback view */}
        {fileMissing ? (
          <View style={styles.missingFileContainer}>
            <View style={styles.missingCard}>
              <AlertTriangle size={36} color="#FF9500" />
              <Text style={styles.missingTitle}>VIDEO FILE MISSING</Text>
              <Text style={styles.missingBody}>
                This video clip could not be loaded from local storage ({videoUri}). The file may have been moved or cleared.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' }}>
                {onDeleteClip && videoId ? (
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('heavy');
                      onDeleteClip(videoId);
                      onClose();
                    }}
                    style={[styles.missingBtn, { backgroundColor: '#FF453A' }]}
                    accessibilityRole="button"
                    accessibilityLabel="Delete broken clip record"
                  >
                    <Text style={styles.missingBtnText}>DELETE RECORD</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.missingBtn, { backgroundColor: '#27272F' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Close video viewer"
                >
                  <Text style={styles.missingBtnText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <>
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
          </>
        )}

        {/* ── Top HUD Bar ── */}
        <View
          style={[
            styles.topHeader,
            { paddingTop: Math.max(insets.top + 8, Platform.OS === 'ios' ? 48 : 24) },
            !showControls && styles.hiddenOverlay,
          ]}
          pointerEvents={showControls ? 'auto' : 'none'}
        >
          {/* Left: Grade pill */}
          <View style={styles.gradePill}>
            <Text style={styles.gradePillText}>{gradeRaw} {outcomeText}</Text>
          </View>

          {/* Center Action Group: Failure tag & Mute toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {failureLabel && (
              <View style={styles.failureChip}>
                <Text style={styles.failureChipText}>{failureLabel}</Text>
              </View>
            )}

            {/* Prominent Mute Button */}
            {!isImage && (
              <TouchableOpacity
                onPress={handleToggleMute}
                style={styles.hudIconBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isMuted ? (
                  <VolumeX size={18} color="#FF453A" />
                ) : (
                  <Volume2 size={18} color="#6EE756" />
                )}
              </TouchableOpacity>
            )}

            {/* Notes drawer toggle button */}
            {videoId && (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  setShowNotes(!showNotes);
                }}
                style={[styles.hudIconBtn, showNotes && { backgroundColor: '#8E7CFF' }]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Toggle timestamped notes"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MessageSquare size={16} color={showNotes ? '#0A0A0C' : '#FFFFFF'} />
                {notes.length > 0 && (
                  <View style={styles.notesCountBadge}>
                    <Text style={styles.notesCountText}>{notes.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Right: Close button */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              onClose();
            }}
            style={styles.closeBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Close player"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Timestamped Notes Panel Drawer ── */}
        {showNotes && videoId && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.notesDrawerContainer, { bottom: Math.max(insets.bottom + 120, 140) }]}
          >
            <View style={styles.notesDrawerHeader}>
              <Text style={styles.notesDrawerTitle}>TIMESTAMPED NOTES ({notes.length})</Text>
              <Text style={styles.notesDrawerSub}>Tap a note to jump to that moment</Text>
            </View>

            <ScrollView style={styles.notesListScroll} contentContainerStyle={{ gap: 8 }}>
              {notes.length === 0 ? (
                <Text style={styles.emptyNotesText}>
                  No notes yet. Pause the video at any timestamp to log beta details.
                </Text>
              ) : (
                notes.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => handleSeekToNote(n.timestampSec)}
                    style={styles.noteItemRow}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Jump to ${formatTimestamp(n.timestampSec)}: ${n.text}`}
                  >
                    <View style={styles.timestampPill}>
                      <Text style={styles.timestampText}>{formatTimestamp(n.timestampSec)}</Text>
                    </View>
                    <Text style={styles.noteItemText} numberOfLines={2}>
                      {n.text}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteNote(n.id)}
                      style={{ padding: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel="Delete note"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={14} color="#FF453A" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Add note input row */}
            <View style={styles.addNoteRow}>
              <View style={styles.addNoteTimestampBadge}>
                <Text style={styles.addNoteTimestampText}>{formatTime(currentTime)}</Text>
              </View>
              <TextInput
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="Add note at current time..."
                placeholderTextColor="#707080"
                style={styles.addNoteInput}
                onSubmitEditing={handleAddNote}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleAddNote}
                disabled={!noteDraft.trim()}
                style={[styles.addNoteBtn, !noteDraft.trim() && { opacity: 0.5 }]}
                accessibilityRole="button"
                accessibilityLabel="Save timestamped note"
              >
                <Plus size={16} color="#0A0A0C" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ── Tactile Floating Scrubbing Controls ── */}
        {!fileMissing && (
          <View
            style={[
              styles.bottomControlsContainer,
              { marginBottom: Math.max(insets.bottom + 8, 32) },
              !showControls && styles.hiddenOverlay,
            ]}
            pointerEvents={showControls ? 'auto' : 'none'}
          >
            {/* Scrubber Slider */}
            <Pressable style={styles.scrubberTouchArea} onPress={handleScrub}>
              <View style={styles.scrubberTrack}>
                <View style={[styles.scrubberFill, { width: `${progressRatio * 100}%` }]} />
                <View style={[styles.scrubberThumb, { left: `${progressRatio * 100}%` }]} />
              </View>
            </Pressable>

            {/* Time Readout */}
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
            </View>

            {/* Controls Row: Speed Selector Chips + Frame Stepper Buttons */}
            <View style={styles.controllerRow}>
              {/* Speed Selector Row: chips [ 0.25x ] [ 0.5x ] [ 1.0x ] [ 2.0x ] */}
              <View style={styles.speedRow}>
                {SPEED_OPTIONS.map((opt) => {
                  const isActive = speed === opt;
                  return (
                    <TouchableOpacity
                      key={`speed_${opt}`}
                      onPress={() => handleSetSpeed(opt)}
                      style={[styles.speedChip, isActive && styles.speedChipActive]}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`${opt}x playback speed`}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={[styles.speedChipText, isActive && styles.speedChipTextActive]}>
                        {opt}x
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Frame Stepper Buttons */}
              <View style={styles.frameStepRow}>
                <TouchableOpacity
                  onPress={handleStepPrevFrame}
                  style={styles.frameStepBtn}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Step back 1 frame"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ChevronLeft size={14} color="#9090A0" />
                  <Text style={styles.frameStepText}>-1 Frame</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTogglePlay}
                  style={styles.playPauseMiniBtn}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
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
                  accessibilityRole="button"
                  accessibilityLabel="Step forward 1 frame"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.frameStepText}>+1 Frame</Text>
                  <ChevronRight size={14} color="#9090A0" />
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#19191D',
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
    backgroundColor: '#19191D',
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
    backgroundColor: '#19191D',
    borderWidth: 1,
    borderColor: '#27272F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#19191D',
    borderWidth: 1,
    borderColor: '#27272F',
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
    backgroundColor: '#141417',
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
    color: '#9090A0',
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
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#22222A',
  },
  speedChipActive: {
    backgroundColor: '#8E7CFF',
    borderColor: '#8E7CFF',
  },
  speedChipText: {
    color: '#9090A0',
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
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#22222A',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  frameStepText: {
    color: '#9090A0',
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
  hudIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#19191D',
    borderWidth: 1,
    borderColor: '#27272F',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notesCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#6EE756',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notesCountText: {
    color: '#0A0A0C',
    fontSize: 9,
    fontWeight: '800',
  },
  notesDrawerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxHeight: 260,
    backgroundColor: 'rgba(25, 25, 29, 0.95)',
    borderWidth: 1,
    borderColor: '#27272F',
    borderRadius: 20,
    padding: 16,
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  notesDrawerHeader: {
    marginBottom: 10,
  },
  notesDrawerTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notesDrawerSub: {
    color: '#9090A0',
    fontSize: 11,
    marginTop: 2,
  },
  notesListScroll: {
    maxHeight: 120,
    marginBottom: 12,
  },
  emptyNotesText: {
    color: '#707080',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  noteItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141417',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22222A',
  },
  timestampPill: {
    backgroundColor: '#8E7CFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timestampText: {
    color: '#0A0A0C',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  noteItemText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
  addNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272F',
    paddingTop: 10,
  },
  addNoteTimestampBadge: {
    backgroundColor: '#27272F',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addNoteTimestampText: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  addNoteInput: {
    flex: 1,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#27272F',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 12,
  },
  addNoteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6EE756',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingFileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  missingCard: {
    backgroundColor: '#19191D',
    borderWidth: 1,
    borderColor: '#27272F',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
    gap: 12,
  },
  missingTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  missingBody: {
    color: '#9090A0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  missingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  missingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
