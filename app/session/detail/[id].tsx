import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  RotateCcw,
  Edit3,
  Trash2,
  X,
  Check,
} from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  getSessionDetail,
  updateSessionNotes,
  updateSessionGym,
  reopenSession,
  deleteSession,
  type SessionDetailData,
} from '../../../db/queries';
import { ReadOnlyBoulderGroup } from '../../../components/session/ReadOnlyBoulderGroup';
import { SessionPyramidChart } from '../../../components/session/SessionPyramidChart';
import { FLOATING_CARD_STYLE } from '../../../constants/theme';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { triggerHaptic } from '../../../utils/haptics';
import { ShareWorkoutCard } from '../../../components/session/ShareWorkoutCard';

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatSessionDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today • ${timeStr}`;
  if (isYesterday) return `Yesterday • ${timeStr}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${timeStr}`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<SessionDetailData | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editGymName, setEditGymName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<View>(null);

  const loadData = useCallback(() => {
    if (!id) return;
    const detail = getSessionDetail(id);
    setData(detail);
    if (detail) {
      setEditGymName(detail.session.gymName);
      setEditNotes(detail.session.notes);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShare = useCallback(async () => {
    if (!data || isSharing) return;
    setIsSharing(true);
    triggerHaptic('medium');

    try {
      if (shareCardRef.current) {
        const uri = await captureRef(shareCardRef, {
          format: 'png',
          quality: 0.95,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share CruxLog Workout',
            UTI: 'public.png',
          });
          setIsSharing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('ViewShot export failed, falling back to text share:', err);
    }

    // Fallback to text share
    try {
      const dateStr = formatSessionDate(data.session.startTime);
      const durStr = formatDuration(data.kpis.durationMs);
      let text = `🧗 CruxLog Workout Summary\n`;
      text += `📍 ${data.session.gymName || 'Bouldering Session'} • ${dateStr}\n\n`;
      text += `⏱️ Duration: ${durStr}\n`;
      text += `🎯 Sends: ${data.kpis.totalSends} / ${data.kpis.totalClimbs}\n`;
      text += `⚡ Flashes: ${data.kpis.totalFlashes} (${data.kpis.flashRate}%)\n`;
      text += `🔥 Hardest Send: ${data.kpis.hardestSend ?? 'None'}\n`;
      if (data.session.notes) {
        text += `\n📝 Notes: ${data.session.notes}\n`;
      }
      if (data.pyramid.length > 0) {
        text += `\n📊 Grade Breakdown:\n`;
        for (const r of data.pyramid) {
          text += `${r.gradeRaw.padEnd(4)}: ${r.flashes}⚡ ${r.sends}✓ ${r.attempts}✗\n`;
        }
      }

      await Share.share({ message: text });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  }, [data, isSharing]);

  const handleResume = useCallback(() => {
    setMenuVisible(false);
    Alert.alert(
      'Resume Workout?',
      'This will re-open this session in the active logger so you can continue adding sets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: () => {
            if (!id) return;
            reopenSession(id);
            router.replace(`/session/${id}`);
          },
        },
      ]
    );
  }, [id, router]);

  const handleDelete = useCallback(() => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Session?',
      'This workout and all its logged sets will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!id) return;
            deleteSession(id);
            router.replace('/');
          },
        },
      ]
    );
  }, [id, router]);

  const handleSaveEdit = useCallback(() => {
    if (!id) return;
    updateSessionGym(id, editGymName.trim());
    updateSessionNotes(id, editNotes.trim());
    setEditModalVisible(false);
    loadData();
  }, [id, editGymName, editNotes, loadData]);

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-secondary">Session not found</Text>
      </View>
    );
  }

  const { session, groups, pyramid, kpis } = data;

  // Highest grade attempted / sent across all logs
  const allLogs = groups.flatMap((g) => g.logs);
  const sortedAll = [...allLogs].sort(
    (a, b) => (b.normalizedDifficulty ?? 0) - (a.normalizedDifficulty ?? 0)
  );
  const maxAttempt = sortedAll[0]?.gradeRaw ?? kpis.hardestSend ?? '—';

  return (
    <ScreenContainer>
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <View
        style={{
          borderBottomColor: '#2C2C35',
          borderBottomWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Back arrow in 36x36pt tactile circle */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#1E1E24',
            borderWidth: 1,
            borderColor: '#2C2C35',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Center: Title + Subtitle */}
        <View className="flex-1 mx-3 items-center">
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 17,
              fontWeight: '700',
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {session.title || session.gymName || 'Climbing Session'}
          </Text>
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 12,
              marginTop: 2,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {session.title && session.gymName ? `${session.gymName} • ` : ''}
            {formatSessionDate(session.startTime)}
          </Text>
        </View>

        {/* Right: 36x36pt tactile action buttons */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#1E1E24',
              borderWidth: 1,
              borderColor: '#2C2C35',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#8E7CFF" />
            ) : (
              <Share2 size={18} color="#8A8A98" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#1E1E24',
              borderWidth: 1,
              borderColor: '#2C2C35',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreVertical size={18} color="#8A8A98" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 160 }}
      >
        {/* ── Hero Summary Bento Capsule ─────────────────────────── */}
        <View
          style={[
            FLOATING_CARD_STYLE,
            {
              backgroundColor: '#1E1E24',
              borderColor: '#2C2C35',
              borderWidth: 1,
              borderRadius: 20,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          ]}
        >
          {/* 1. SENDS */}
          <View className="flex-1 items-center">
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: -0.3,
              }}
            >
              {kpis.totalSends}/{kpis.totalClimbs}
            </Text>
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.8,
                marginTop: 4,
              }}
              className="uppercase"
            >
              SENDS
            </Text>
          </View>

          {/* Subtle divider */}
          <View style={{ width: 1, height: 32, backgroundColor: '#2C2C35' }} />

          {/* 2. MAX ATTEMPT */}
          <View className="flex-1 items-center">
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: -0.3,
              }}
            >
              {maxAttempt}
            </Text>
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.8,
                marginTop: 4,
              }}
              className="uppercase"
            >
              MAX ATTEMPT
            </Text>
          </View>

          {/* Subtle divider */}
          <View style={{ width: 1, height: 32, backgroundColor: '#2C2C35' }} />

          {/* 3. DURATION */}
          <View className="flex-1 items-center">
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: -0.3,
              }}
            >
              {formatDuration(kpis.durationMs)}
            </Text>
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.8,
                marginTop: 4,
              }}
              className="uppercase"
            >
              DURATION
            </Text>
          </View>
        </View>

        {/* ── Session Notes Card ─────────────────────────────────── */}
        <View
          style={[
            FLOATING_CARD_STYLE,
            {
              backgroundColor: '#1E1E24',
              borderColor: '#2C2C35',
              borderWidth: 1,
              borderRadius: 20,
              padding: 16,
              marginBottom: 16,
            },
          ]}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text
              style={{
                color: '#8A8A98',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.8,
              }}
              className="uppercase"
            >
              SESSION NOTES
            </Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: '#8E7CFF', fontSize: 13, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Notes text */}
          {session.notes ? (
            <Text style={{ color: '#9A9AA6', fontSize: 14, lineHeight: 20 }}>
              {session.notes}
            </Text>
          ) : (
            <Text style={{ color: '#8A8A98', fontSize: 13, fontStyle: 'italic' }}>
              No notes logged. Tap Edit to add reflections or crux details.
            </Text>
          )}

          {/* Media Attachments */}
          {session.mediaUris && session.mediaUris.length > 0 ? (
            <View className="mt-3 pt-3 border-t border-[#2C2C35]">
              <Text
                style={{
                  color: '#8A8A98',
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
                className="uppercase"
              >
                Attached Media ({session.mediaUris.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                {session.mediaUris.map((uri, idx) => (
                  <View
                    key={`${uri}-${idx}`}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: '#2C2C35',
                      marginRight: 8,
                    }}
                  >
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* ── Session Grade Pyramid ──────────────────────────────── */}
        <SessionPyramidChart pyramid={pyramid} />

        {/* ── Boulder Groups & Sets List ─────────────────────────── */}
        <View className="mb-2">
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.8,
            }}
            className="uppercase"
          >
            WALL ZONES & CLIMBS
          </Text>
          <Text style={{ color: '#8A8A98', fontSize: 12, marginTop: 2 }}>
            {groups.length} zone{groups.length !== 1 ? 's' : ''} • {kpis.totalClimbs} total sets
          </Text>
        </View>

        {groups.map((group) => (
          <ReadOnlyBoulderGroup
            key={group.id}
            zoneName={group.zoneName}
            logs={group.logs}
          />
        ))}

        {/* ── Bottom Action Button ───────────────────────────────── */}
        <View className="mt-2 mb-6">
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#8E7CFF',
              height: 52,
              borderRadius: 26,
              shadowColor: '#8E7CFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 5,
            }}
            className="flex-row items-center justify-center gap-2"
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Share2 size={18} color="#FFFFFF" />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                  }}
                >
                  SHARE WORKOUT SUMMARY
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Overflow Menu Modal ─────────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-end"
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{ paddingBottom: insets.bottom + 16 }}
            className="bg-surface rounded-t-3xl p-6 border-t border-border"
          >
            <View className="w-10 h-1 bg-border rounded-full self-center mb-6" />

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                setEditModalVisible(true);
              }}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3.5 border-b border-border/50"
            >
              <Edit3 size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-base">Edit Gym & Notes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResume}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3.5 border-b border-border/50"
            >
              <RotateCcw size={18} color="#60A5FA" />
              <Text className="text-[#60A5FA] font-bold text-base">Resume Workout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3.5 border-b border-[#2C2C35]"
            >
              <Share2 size={18} color="#8E7CFF" />
              <Text className="text-[#8E7CFF] font-bold text-base">Share Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3.5 mt-2"
            >
              <Trash2 size={18} color="#EF4444" />
              <Text className="text-red-400 font-bold text-base">Delete Session</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Gym & Notes Modal ───────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/70 justify-end"
        >
          <View
            style={{ paddingBottom: insets.bottom + 20 }}
            className="bg-surface rounded-t-3xl p-6 border-t border-border"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-bold text-lg">Edit Session Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-1">
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text className="text-secondary text-xs font-semibold uppercase mb-1">Gym Name</Text>
            <TextInput
              value={editGymName}
              onChangeText={setEditGymName}
              placeholder="e.g. Movement Climbing"
              placeholderTextColor="#4B5563"
              className="bg-card text-white px-4 py-3 rounded-xl border border-border mb-4 text-base"
              style={{ color: '#FFFFFF' }}
            />

            <Text className="text-secondary text-xs font-semibold uppercase mb-1">Notes</Text>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="How did the session feel? Crux moves, skin condition..."
              placeholderTextColor="#4B5563"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-card text-white px-4 py-3 rounded-xl border border-border mb-6 text-base h-28"
              style={{ color: '#FFFFFF' }}
            />

            <TouchableOpacity
              onPress={handleSaveEdit}
              activeOpacity={0.85}
              className="bg-accent py-4 rounded-xl items-center flex-row justify-center gap-2"
            >
              <Check size={18} color="#FFFFFF" strokeWidth={3} />
              <Text className="text-white font-bold text-base">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Off-screen 9:16 Instagram Story Card Canvas ───────── */}
      <View
        style={{
          position: 'absolute',
          top: -9999,
          left: 0,
          zIndex: -1,
        }}
        pointerEvents="none"
        collapsable={false}
      >
        <ShareWorkoutCard ref={shareCardRef} data={data} />
      </View>
    </ScreenContainer>
  );
}
