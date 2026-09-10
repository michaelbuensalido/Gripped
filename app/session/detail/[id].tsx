import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Clock,
  TrendingUp,
  Target,
  Zap,
  RotateCcw,
  Edit3,
  Trash2,
  X,
  Check,
} from 'lucide-react-native';
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

function getRpeDescription(rpe: number): string {
  if (rpe <= 3) return 'Light';
  if (rpe <= 6) return 'Moderate';
  if (rpe <= 8) return 'Hard';
  return 'Max Effort';
}

function rpeColor(rpe: number): string {
  if (rpe <= 4) return '#22C55E';
  if (rpe <= 7) return '#EAB308';
  return '#EF4444';
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
    if (!data) return;
    const dateStr = formatSessionDate(data.session.startTime);
    const durStr = formatDuration(data.kpis.durationMs);
    let text = `🧗 CruxLog Workout Summary\n`;
    text += `📍 ${data.session.gymName || 'Bouldering Session'} • ${dateStr}\n\n`;
    text += `⏱️ Duration: ${durStr}\n`;
    text += `🎯 Sends: ${data.kpis.totalSends} / ${data.kpis.totalClimbs}\n`;
    text += `⚡ Flashes: ${data.kpis.totalFlashes} (${data.kpis.flashRate}%)\n`;
    text += `🔥 Hardest Send: ${data.kpis.hardestSend ?? 'None'}\n`;
    if (data.kpis.avgRpe != null) {
      text += `💪 Avg RPE: ${data.kpis.avgRpe}/10 (${getRpeDescription(data.kpis.avgRpe)})\n`;
    }
    if (data.session.notes) {
      text += `\n📝 Notes: ${data.session.notes}\n`;
    }
    if (data.pyramid.length > 0) {
      text += `\n📊 Grade Breakdown:\n`;
      for (const r of data.pyramid) {
        text += `${r.gradeRaw.padEnd(4)}: ${r.flashes}⚡ ${r.sends}✓ ${r.attempts}✗\n`;
      }
    }

    try {
      await Share.share({ message: text });
    } catch (e) {
      console.error(e);
    }
  }, [data]);

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

  return (
    <ScreenContainer>
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/40">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="p-1 -ml-1"
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View className="flex-1 mx-3 items-center">
          <Text className="text-white font-bold text-base" numberOfLines={1}>
            {session.gymName || 'Session Details'}
          </Text>
          <Text className="text-muted text-xs">
            {formatSessionDate(session.startTime)}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <TouchableOpacity onPress={handleShare} activeOpacity={0.7} className="p-2">
            <Share2 size={19} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
            className="p-2"
          >
            <MoreVertical size={19} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 40 }}
      >
        {/* ── KPI Grid (4 Cards) ─────────────────────────────────── */}
        <View className="flex-row gap-3 px-4 mb-3">
          {/* Card 1: Duration */}
          <View style={FLOATING_CARD_STYLE} className="rounded-2xl p-4 flex-1">
            <View className="mb-2">
              <Clock size={18} color="#60A5FA" />
            </View>
            <Text className="text-white text-xl font-black">{formatDuration(kpis.durationMs)}</Text>
            <Text className="text-muted text-xs mt-0.5">Total Duration</Text>
          </View>

          {/* Card 2: Total Sends */}
          <View style={FLOATING_CARD_STYLE} className="rounded-2xl p-4 flex-1">
            <View className="mb-2">
              <TrendingUp size={18} color="#22C55E" />
            </View>
            <Text className="text-send text-xl font-black">
              {kpis.totalSends}
              <Text className="text-muted text-sm font-semibold">/{kpis.totalClimbs}</Text>
            </Text>
            <Text className="text-muted text-xs mt-0.5">Total Sends</Text>
          </View>
        </View>

        <View className="flex-row gap-3 px-4 mb-4">
          {/* Card 3: Top Grade */}
          <View style={FLOATING_CARD_STYLE} className="rounded-2xl p-4 flex-1">
            <View className="mb-2">
              <Target size={18} color="#A78BFA" />
            </View>
            <Text className="text-[#A78BFA] text-xl font-black">
              {kpis.hardestSend ?? '—'}
            </Text>
            <Text className="text-muted text-xs mt-0.5">Hardest Send</Text>
          </View>

          {/* Card 4: Flash Rate */}
          <View style={FLOATING_CARD_STYLE} className="rounded-2xl p-4 flex-1">
            <View className="mb-2">
              <Zap size={18} color="#22C55E" />
            </View>
            <Text className="text-accentLight text-xl font-black">
              {kpis.flashRate}%
            </Text>
            <Text className="text-muted text-xs mt-0.5">
              Flash Rate ({kpis.totalFlashes})
            </Text>
          </View>
        </View>

        {/* ── Perceived Effort & Notes Card ──────────────────────── */}
        <View style={FLOATING_CARD_STYLE} className="mx-4 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-bold text-sm">Session Notes & Effort</Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(true)}
              className="flex-row items-center gap-1"
            >
              <Edit3 size={13} color="#7C3AED" />
              <Text className="text-accentLight text-xs font-semibold">Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Effort Pill */}
          {kpis.avgRpe != null ? (
            <View className="flex-row items-center gap-2 mb-2">
              <View
                style={{ backgroundColor: `${rpeColor(kpis.avgRpe)}20` }}
                className="px-2.5 py-1 rounded-full border border-border"
              >
                <Text
                  style={{ color: rpeColor(kpis.avgRpe) }}
                  className="text-xs font-black"
                >
                  RPE {kpis.avgRpe} / 10 • {getRpeDescription(kpis.avgRpe)}
                </Text>
              </View>
              <Text className="text-muted text-xs">Average exertion</Text>
            </View>
          ) : (
            <Text className="text-muted text-xs mb-2">No RPE recorded for this workout</Text>
          )}

          {/* Notes text */}
          {session.notes ? (
            <Text className="text-secondary text-sm leading-5 mt-1">
              {session.notes}
            </Text>
          ) : (
            <Text className="text-muted text-xs italic mt-1">
              No notes logged. Tap Edit to add reflections or crux details.
            </Text>
          )}
        </View>

        {/* ── Session Grade Pyramid ──────────────────────────────── */}
        <SessionPyramidChart pyramid={pyramid} />

        {/* ── Boulder Groups & Sets List ─────────────────────────── */}
        <View className="px-4 mb-2">
          <Text className="text-white font-bold text-base">Wall Zones & Climbs</Text>
          <Text className="text-muted text-xs">
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
        <View className="px-4 mt-2 mb-6">
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.85}
            className="bg-accent flex-row items-center justify-center gap-2 py-4 rounded-2xl"
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text className="text-white text-base font-black">Share Workout Summary</Text>
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
              className="flex-row items-center gap-3 py-3.5 border-b border-border/50"
            >
              <Share2 size={18} color="#7C3AED" />
              <Text className="text-accent font-bold text-base">Share Summary</Text>
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
    </ScreenContainer>
  );
}
