import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ImageBackground,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Pencil,
  Film,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { triggerHaptic } from '../../utils/haptics';
import { ConfettiBurst } from '../ui/ConfettiBurst';
import { THEME_COLORS } from '../../constants/theme';
import type { Session, BoulderGroup, BoulderLog } from '../../types';

interface GroupWithLogs extends BoulderGroup {
  logs: BoulderLog[];
}

interface SessionCompletionModalProps {
  visible: boolean;
  activeSession: Session;
  groups: GroupWithLogs[];
  pausedEndTime: number;
  onSave: (data: {
    title: string;
    gymName: string;
    notes: string;
    rpe: number | null;
    mediaUris: string[];
    endTime: number;
  }) => void;
  onDiscard: () => void;
}

function getSmartSessionTitle(date: Date = new Date()): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[date.getDay()];
  const hours = date.getHours();
  let timeOfDay = 'Evening';
  if (hours < 12) timeOfDay = 'Morning';
  else if (hours < 17) timeOfDay = 'Afternoon';
  else if (hours >= 21 || hours < 4) timeOfDay = 'Night';
  return `${day} ${timeOfDay} Climb`;
}

function formatDurationHHMMSS(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getRpeHeaderLabel(rpe: number | null): string {
  if (!rpe) return '';
  let desc = 'Moderate';
  if (rpe <= 2) desc = 'Very Light';
  else if (rpe <= 4) desc = 'Moderate Pace';
  else if (rpe <= 6) desc = 'Challenging';
  else if (rpe <= 8) desc = 'Hard Effort';
  else desc = 'Limit Burn';
  return `RPE ${rpe} / 10 • ${desc}`;
}

function getRpeDotColor(num: number): string {
  if (num <= 4) return '#22C55E'; // Green (1-4)
  if (num <= 7) return '#F59E0B'; // Amber (5-7)
  return '#EF4444'; // Red/Purple (8-10)
}

const SAMPLE_MEDIA_OPTIONS = [
  { label: 'Crux sequence clip', uri: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&auto=format&fit=crop&q=80' },
  { label: 'Overhang dyno', uri: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=600&auto=format&fit=crop&q=80' },
  { label: 'Top-out celebration', uri: 'https://images.unsplash.com/photo-1578768079052-aa76e520028b?w=600&auto=format&fit=crop&q=80' },
];

export function SessionCompletionModal({
  visible,
  activeSession,
  groups,
  pausedEndTime,
  onSave,
  onDiscard,
}: SessionCompletionModalProps) {
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(getSmartSessionTitle(new Date(activeSession.startTime)));
  const [gymName, setGymName] = useState(activeSession.gymName || 'Boulder World');
  const [notes, setNotes] = useState(activeSession.notes || '');
  const [rpe, setRpe] = useState<number | null>(7);
  const [mediaUris, setMediaUris] = useState<string[]>(activeSession.mediaUris || []);
  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setTitle(getSmartSessionTitle(new Date(activeSession.startTime)));
      setGymName(activeSession.gymName || 'Boulder World');
      setNotes(activeSession.notes || '');
      setMediaUris(activeSession.mediaUris || []);
      setConfettiKey((prev) => prev + 1);
      // Fire celebratory success haptic alongside confetti burst
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [visible, activeSession]);

  // Compute stats
  const allLogs = groups.flatMap((g) => g.logs);
  const totalAttempts = allLogs.reduce((sum, l) => sum + (l.attempts || 1), 0);
  const sends = allLogs.filter((l) => l.outcome === 'send' || l.outcome === 'flash');
  const totalSends = sends.length;
  const sortedSends = [...sends].sort((a, b) => b.normalizedDifficulty - a.normalizedDifficulty);
  const hardestSend = sortedSends[0]?.gradeRaw ?? null;

  const durationMs = Math.max(0, pausedEndTime - activeSession.startTime);
  const durationFormatted = formatDurationHHMMSS(durationMs);

  const handlePickMedia = async () => {
    triggerHaptic('light');
    Alert.alert(
      'Attach Beta / Photos',
      'Choose media to attach to this session recap:',
      [
        ...SAMPLE_MEDIA_OPTIONS.map((opt) => ({
          text: opt.label,
          onPress: () => {
            triggerHaptic('selection');
            setMediaUris((prev) => [...prev, opt.uri]);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemoveMedia = (index: number) => {
    triggerHaptic('selection');
    setMediaUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDiscardPress = () => {
    triggerHaptic('medium');
    Alert.alert(
      'Discard Session?',
      'All logged boulders, zones, and timers from this session will be permanently deleted.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard Session',
          style: 'destructive',
          onPress: () => {
            onDiscard();
          },
        },
      ]
    );
  };

  const handleSavePress = () => {
    triggerHaptic('success');
    onSave({
      title: title.trim() || getSmartSessionTitle(),
      gymName: gymName.trim() || 'Boulder World',
      notes: notes.trim(),
      rpe,
      mediaUris,
      endTime: pausedEndTime,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleDiscardPress}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: '#131316' }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            {/* Speckled mat background */}
            <ImageBackground
              source={require('../../assets/speckled_mat_bg.jpg')}
              style={StyleSheet.absoluteFillObject}
              imageStyle={{ opacity: 0.18 }}
              resizeMode="cover"
            />

            {/* ── 1. Header & Dismiss Clean-up ────────────────────────────── */}
            <View
              style={{
                paddingTop: insets.top + 6,
                paddingBottom: 10,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255, 255, 255, 0.06)',
                backgroundColor: 'rgba(19, 19, 22, 0.92)',
              }}
            >
              {/* Top-left: Crisp "✕" close/discard icon (#9A9AA6, 44x44 touch target) */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDiscardPress}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 22,
                }}
              >
                <X size={20} color="#9A9AA6" />
              </TouchableOpacity>

              {/* Center Title: Small uppercase tracked label: "SESSION RECAP" (Tappable celebration trigger) */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('success');
                  setConfettiKey((k) => k + 1);
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: '#8E7CFF',
                    fontWeight: '700',
                    letterSpacing: 1.2,
                  }}
                >
                  SESSION RECAP
                </Text>
              </TouchableOpacity>

              {/* Top-right: Empty balanced spacer (Save button removed) */}
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* ── Main Scrollable Content ─────────────────────────────────── */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 24,
              }}
            >
          {/* ── 2. Workout Headline & Celebration Hero ─────────────────── */}
          <View style={{ alignItems: 'center', marginBottom: 6 }}>
            {/* Large Title: "Thursday Evening Climb" (26pt Bold White, editable with subtle pencil) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingHorizontal: 12,
              }}
            >
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Session Title"
                placeholderTextColor="#8A8A98"
                style={{
                  color: '#FFFFFF',
                  fontSize: 26,
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: -0.3,
                  maxWidth: '85%',
                  padding: 0,
                }}
              />
              <Pencil size={18} color="#8E7CFF" style={{ opacity: 0.8 }} />
            </View>

            {/* Subtitle Row: Centered pill displaying gym name with location pin: "📍 Boulder World • Today" (13pt, #9A9AA6) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                marginTop: 8,
                backgroundColor: 'rgba(30, 30, 36, 0.7)',
                borderColor: '#2C2C35',
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <MapPin size={13} color="#8E7CFF" />
              <TextInput
                value={gymName}
                onChangeText={setGymName}
                placeholder="Gym Name"
                placeholderTextColor="#8A8A98"
                style={{
                  color: '#9A9AA6',
                  fontSize: 13,
                  fontWeight: '500',
                  padding: 0,
                }}
              />
              <Text style={{ color: '#9A9AA6', fontSize: 13, fontWeight: '500' }}>• Today</Text>
            </View>
          </View>

          {/* ── 3. Elevated 3-Stat KPI Card ───────────────────────────── */}
          <View
            style={{
              backgroundColor: THEME_COLORS.cardSurfaceHero,
              borderColor: THEME_COLORS.cardBorder,
              borderTopColor: 'rgba(255, 255, 255, 0.16)',
              borderWidth: 1,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 14,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Column 1: TIME */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={{
                  color: '#8A8A98',
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                TIME
              </Text>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 20,
                  fontWeight: '800',
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                }}
              >
                {durationFormatted}
              </Text>
            </View>

            {/* Subtle vertical divider line */}
            <View
              style={{
                width: 1,
                height: '70%',
                backgroundColor: '#25252E',
                alignSelf: 'center',
              }}
            />

            {/* Column 2: SENDS */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={{
                  color: '#8A8A98',
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                SENDS
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800' }}>
                {totalSends}{' '}
                <Text style={{ color: '#9A9AA6', fontSize: 15, fontWeight: '600' }}>
                  / {totalAttempts || 0}
                </Text>
              </Text>
            </View>

            {/* Subtle vertical divider line */}
            <View
              style={{
                width: 1,
                height: '70%',
                backgroundColor: '#25252E',
                alignSelf: 'center',
              }}
            />

            {/* Column 3: HARDEST */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={{
                  color: '#8A8A98',
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                HARDEST
              </Text>
              {hardestSend ? (
                <View
                  style={{
                    backgroundColor: '#6EE756',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 3.5,
                    shadowColor: '#6EE756',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.35,
                    shadowRadius: 5,
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{
                      color: '#111115',
                      fontSize: 14,
                      fontWeight: '700',
                      letterSpacing: 0.3,
                    }}
                  >
                    {hardestSend}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: '#8A8A98', fontSize: 20, fontWeight: '700' }}>
                  —
                </Text>
              )}
            </View>
          </View>

          {/* ── 4. Media Upload Section ───────────────────────────────── */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                marginBottom: 10,
              }}
            >
              PHOTOS & VIDEOS
            </Text>

            {/* Horizontal banner card with dashed border */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickMedia}
              style={{
                backgroundColor: THEME_COLORS.cardSurface,
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
              }}
            >
              <Film size={20} color="#8E7CFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                Add Photos or Beta Clips
              </Text>
            </TouchableOpacity>

            {/* Attached media previews: 80x80pt rounded thumbnails with floating ✕ delete pill */}
            {mediaUris.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingTop: 12 }}
              >
                {mediaUris.map((uri, index) => (
                  <View
                    key={`${uri}-${index}`}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 14,
                      overflow: 'hidden',
                      backgroundColor: THEME_COLORS.cardSurface,
                      borderWidth: 1,
                      borderColor: THEME_COLORS.cardBorder,
                      position: 'relative',
                    }}
                  >
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRemoveMedia(index)}
                      style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── 5. Dynamic Effort Slider (RPE) ───────────────────────── */}
          <View style={{ marginBottom: 18 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: '#8A8A98',
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                }}
              >
                HOW DID IT FEEL?
              </Text>
              {rpe && (
                <Text style={{ color: '#8E7CFF', fontSize: 12, fontWeight: '700' }}>
                  {getRpeHeaderLabel(rpe)}
                </Text>
              )}
            </View>

            {/* 10 Number Pills with comfortable spacing & color indicator beneath */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = rpe === num;
                const dotColor = getRpeDotColor(num);
                return (
                  <View key={num} style={{ flex: 1, alignItems: 'center' }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        triggerHaptic('selection');
                        setRpe(num);
                      }}
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: isSelected ? '#8E7CFF' : '#1C1C22',
                        borderColor: isSelected ? '#8E7CFF' : '#2A2A33',
                        borderWidth: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: isSelected ? '#8E7CFF' : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.5 : 0,
                        shadowRadius: 6,
                        elevation: isSelected ? 4 : 0,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#FFFFFF' : '#6A6A76',
                          fontSize: 14,
                          fontWeight: isSelected ? '800' : '600',
                        }}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>

                    {/* Subtle color indicator beneath: Green (1-4), Amber (5-7), Red/Purple (8-10) */}
                    <View
                      style={{
                        width: 14,
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: isSelected ? dotColor : `${dotColor}45`,
                        marginTop: 5,
                      }}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── 6. Notes Input ────────────────────────────────────────── */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              SESSION NOTES
            </Text>

            <View
              style={{
                backgroundColor: THEME_COLORS.cardSurface,
                borderColor: THEME_COLORS.cardBorder,
                borderTopColor: 'rgba(255, 255, 255, 0.14)',
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="How was your skin, finger recovery, or beta notes..."
                placeholderTextColor="#5A5A66"
                textAlignVertical="top"
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  lineHeight: 20,
                  minHeight: 80,
                  padding: 0,
                }}
              />
            </View>
          </View>
        </ScrollView>

        {/* ── 7. Pinned Bottom CTA ──────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(19, 19, 22, 0.96)',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSavePress}
            style={{
              backgroundColor: '#8E7CFF',
              height: 54,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#8E7CFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              SAVE & COMPLETE WORKOUT
            </Text>
          </TouchableOpacity>
        </View>

          {/* Celebratory Animated Confetti Burst Overlay (Non-blocking worklet animation) */}
          {visible && confettiKey > 0 && (
            <ConfettiBurst
              key={confettiKey}
              count={42}
              duration={2500}
              style={{ top: insets.top }}
            />
          )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
