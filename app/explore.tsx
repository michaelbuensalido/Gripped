import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, StyleSheet, Linking, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MapPin, ChevronRight, Plus, X, Link2, Trash2, ExternalLink, Paperclip } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/ui/Card';
import { ScalePressable } from '../components/ui/ScalePressable';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { EmptyState } from '../components/ui/EmptyState';
import { useRecentGyms, useVideoInbox, useProjects } from '../db/hooks';
import * as Q from '../db/queries';
import * as B from '../db/betaQueries';
import { detectVideoPlatform, formatVideoPlatformLabel } from '../utils/betaLogic';
import { triggerHaptic } from '../utils/haptics';
import type { VideoInboxItem } from '../types/beta';

export default function ExploreScreen() {
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tab, sharedAt } = useLocalSearchParams<{ tab?: string; sharedAt?: string }>();
  const gyms = useRecentGyms();
  const inboxItems = useVideoInbox();
  const projects = useProjects();

  const [activeTab, setActiveTab] = useState<'gyms' | 'inbox'>(
    tab === 'inbox' ? 'inbox' : 'gyms',
  );

  useEffect(() => {
    if (tab === 'inbox') {
      setActiveTab('inbox');
    } else if (tab === 'gyms') {
      setActiveTab('gyms');
    }
  }, [tab, sharedAt]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGymName, setNewGymName] = useState('');

  // Video Inbox Modals & Inputs
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteCaption, setPasteCaption] = useState('');
  const [attachingItem, setAttachingItem] = useState<VideoInboxItem | null>(null);

  const filteredGyms = gyms.filter(g => g.toLowerCase().includes(search.toLowerCase()));
  const filteredInbox = inboxItems.filter(item => 
    (item.caption && item.caption.toLowerCase().includes(search.toLowerCase())) ||
    item.videoUrl.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddGym = () => {
    const trimmed = newGymName.trim();
    if (!trimmed) return;
    Q.insertGym(trimmed);
    setNewGymName('');
    setIsAddModalOpen(false);
    router.push(`/gym/${encodeURIComponent(trimmed)}?from=explore` as any);
  };

  const handleSaveInboxLink = () => {
    const trimmed = pasteUrl.trim();
    if (!trimmed) {
      Alert.alert('Invalid URL', 'Please enter a valid video URL.');
      return;
    }
    const platform = detectVideoPlatform(trimmed);
    B.insertVideoInboxItem({
      videoUrl: trimmed,
      sourceType: platform,
      caption: pasteCaption.trim() || null,
    });
    setPasteUrl('');
    setPasteCaption('');
    setIsPasteModalOpen(false);
    triggerHaptic('success');
  };

  const handleAttachToProject = (projectId: string) => {
    if (!attachingItem) return;
    triggerHaptic('medium');
    B.attachVideoInboxItemToProject(attachingItem.id, projectId);
    setAttachingItem(null);
    triggerHaptic('success');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 8,
          paddingBottom: 130,
          paddingHorizontal: space.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
          <Text style={[type.display, { color: colors.text, fontSize: 34 }]}>Explore</Text>
          <ScalePressable
            haptic="light"
            activeScale={0.94}
            onPress={() => {
              if (activeTab === 'gyms') {
                setIsAddModalOpen(true);
              } else {
                setIsPasteModalOpen(true);
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accent,
              paddingHorizontal: space.md,
              paddingVertical: 10,
              borderRadius: radius.pill,
              minHeight: 44,
            }}
          >
            <Plus size={16} color={colors.textOnAccent} style={{ marginRight: 6 }} />
            <Text style={[type.label, { color: colors.textOnAccent, fontWeight: '700' }]}>
              {activeTab === 'gyms' ? 'Add Gym' : 'Paste Link'}
            </Text>
          </ScalePressable>
        </View>

        {/* Tab Switcher: Gyms vs Video Inbox */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.card,
            borderRadius: radius.pill,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: space.lg,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('gyms');
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: activeTab === 'gyms' ? colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="tab"
            accessibilityLabel="Gyms tab"
          >
            <Text
              style={[
                type.label,
                { color: activeTab === 'gyms' ? colors.textOnAccent : colors.textMuted, fontWeight: '700' },
              ]}
            >
              Gyms
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('inbox');
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: activeTab === 'inbox' ? colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="tab"
            accessibilityLabel="Video Inbox tab"
          >
            <Text
              style={[
                type.label,
                { color: activeTab === 'inbox' ? colors.textOnAccent : colors.textMuted, fontWeight: '700' },
              ]}
            >
              Video Inbox {inboxItems.length > 0 ? `(${inboxItems.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: space.md, borderWidth: 1, borderColor: colors.border, marginBottom: space.xl }}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[type.body, { flex: 1, paddingVertical: space.md, paddingHorizontal: space.sm, color: colors.text }]}
            placeholder={activeTab === 'gyms' ? "Search gyms..." : "Search saved videos..."}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {activeTab === 'gyms' ? (
          <>
            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.md }]}>YOUR GYMS</Text>

            {filteredGyms.length === 0 ? (
              <EmptyState
                asCard
                illustration={require('../assets/illustrations/empty-projects.jpg')}
                icon={<MapPin size={26} color={colors.accent} />}
                title={search.trim() ? "No gyms matching search" : "No gyms saved yet"}
                body={search.trim() ? `We couldn't find "${search.trim()}". You can add it now.` : "Add your home gym or explore places you climb."}
                cta={
                  <SecondaryButton
                    label={search.trim() ? `+ Add "${search.trim()}"` : '+ Add your first gym'}
                    onPress={() => {
                      if (search.trim()) setNewGymName(search.trim());
                      setIsAddModalOpen(true);
                    }}
                  />
                }
              />
            ) : (
              <View style={{ gap: space.sm }}>
                {filteredGyms.map(gym => (
                  <Card
                    key={gym}
                    onPress={() => {
                      router.push(`/gym/${encodeURIComponent(gym)}?from=explore` as any);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: 64,
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: space.md }}>
                      <MapPin size={20} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.heading, { color: colors.text, marginBottom: 2, fontWeight: '600' }]}>{gym}</Text>
                      <Text style={[type.caption, { color: colors.textMuted }]}>View projects & sessions</Text>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </Card>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.md }]}>
              UNSORTED BETA LINKS ({filteredInbox.length})
            </Text>

            {filteredInbox.length === 0 ? (
              <EmptyState
                asCard
                illustration={require('../assets/illustrations/empty-inbox.jpg')}
                icon={<Link2 size={26} color={colors.accent} />}
                title={search.trim() ? "No videos matching search" : "Video inbox is empty"}
                body="Save social media beta clips from Instagram Reels, TikTok, or YouTube here to attach them to your project beta later."
                cta={
                  <SecondaryButton
                    label="+ Paste Video Link"
                    onPress={() => setIsPasteModalOpen(true)}
                  />
                }
              />
            ) : (
              <View style={{ gap: space.sm }}>
                {filteredInbox.map(item => {
                  const platformLabel = formatVideoPlatformLabel(item.sourceType, 'Web');
                  return (
                    <Animated.View
                      key={item.id}
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(150)}
                      layout={LinearTransition.duration(200)}
                    >
                    <Card
                      style={{
                        padding: space.md,
                        gap: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                          <Link2 size={18} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[type.heading, { color: colors.text, fontSize: 15, fontWeight: '600' }]} numberOfLines={1}>
                            {item.caption || `${platformLabel} Beta Clip`}
                          </Text>
                          <Text style={[type.caption, { color: colors.textMuted, fontSize: 11 }]} numberOfLines={1}>
                            {platformLabel} • {item.videoUrl}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic('medium');
                            B.deleteVideoInboxItem(item.id);
                          }}
                          style={{ padding: 6 }}
                          accessibilityRole="button"
                          accessibilityLabel="Delete inbox link"
                        >
                          <Trash2 size={16} color={colors.dangerText} />
                        </TouchableOpacity>
                      </View>

                      {/* Action buttons */}
                      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic('selection');
                            setAttachingItem(item);
                          }}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor: colors.accentSoft,
                            paddingVertical: 8,
                            borderRadius: radius.pill,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Attach video to a project"
                        >
                          <Paperclip size={14} color={colors.accentText} />
                          <Text style={[type.caption, { color: colors.accentText, fontWeight: '700' }]}>Attach to Project</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic('light');
                            Linking.openURL(item.videoUrl).catch(e => {
                              Alert.alert('Cannot Open', 'Unable to open video link.');
                            });
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor: colors.cardMuted,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: radius.pill,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Open external video link"
                        >
                          <ExternalLink size={14} color={colors.text} />
                          <Text style={[type.caption, { color: colors.text, fontWeight: '600' }]}>Open Link</Text>
                        </TouchableOpacity>
                      </View>
                    </Card>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Gym Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent onRequestClose={() => setIsAddModalOpen(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View style={{ backgroundColor: colors.materialBase, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, paddingBottom: Math.max(insets.bottom, space.xl) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
              <Text style={[type.title, { color: colors.text, fontSize: 18, fontWeight: '700' }]}>Add New Gym</Text>
              <ScalePressable
                onPress={() => setIsAddModalOpen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                minTouchTarget
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={colors.textMuted} />
              </ScalePressable>
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>GYM NAME</Text>
            <TextInput
              autoFocus
              value={newGymName}
              onChangeText={setNewGymName}
              placeholder="e.g. Movement Gowanus"
              placeholderTextColor={colors.textMuted}
              style={[
                type.body,
                {
                  backgroundColor: colors.cardMuted,
                  color: colors.text,
                  paddingHorizontal: space.md,
                  paddingVertical: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: space.xl,
                }
              ]}
            />

            <PrimaryButton
              disabled={!newGymName.trim()}
              label="Save & Open Gym"
              onPress={handleAddGym}
              style={{ marginBottom: space.sm }}
            />
            <SecondaryButton
              label="Cancel"
              variant="muted"
              onPress={() => setIsAddModalOpen(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Paste Video Link Modal */}
      <Modal visible={isPasteModalOpen} animationType="slide" transparent onRequestClose={() => setIsPasteModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View style={{ backgroundColor: colors.materialBase, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, paddingBottom: Math.max(insets.bottom, space.xl) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
              <Text style={[type.title, { color: colors.text, fontSize: 18, fontWeight: '700' }]}>Save Beta Link</Text>
              <ScalePressable
                onPress={() => setIsPasteModalOpen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                minTouchTarget
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={colors.textMuted} />
              </ScalePressable>
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>VIDEO URL</Text>
            <TextInput
              autoFocus
              value={pasteUrl}
              onChangeText={setPasteUrl}
              placeholder="https://www.instagram.com/reel/..., tiktok.com, or youtube.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[
                type.body,
                {
                  backgroundColor: colors.cardMuted,
                  color: colors.text,
                  paddingHorizontal: space.md,
                  paddingVertical: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: space.md,
                }
              ]}
            />

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>CAPTION / NOTES (OPTIONAL)</Text>
            <TextInput
              value={pasteCaption}
              onChangeText={setPasteCaption}
              placeholder="e.g. Crux toe hook beta from @setter"
              placeholderTextColor={colors.textMuted}
              style={[
                type.body,
                {
                  backgroundColor: colors.cardMuted,
                  color: colors.text,
                  paddingHorizontal: space.md,
                  paddingVertical: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: space.xl,
                }
              ]}
            />

            <PrimaryButton
              disabled={!pasteUrl.trim()}
              label="Save to Inbox"
              onPress={handleSaveInboxLink}
              style={{ marginBottom: space.sm }}
            />
            <SecondaryButton
              label="Cancel"
              variant="muted"
              onPress={() => setIsPasteModalOpen(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Attach to Project Picker Modal */}
      <Modal visible={Boolean(attachingItem)} animationType="slide" transparent onRequestClose={() => setAttachingItem(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.materialBase, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, maxHeight: '80%', paddingBottom: Math.max(insets.bottom, space.xl) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
              <Text style={[type.title, { color: colors.text, fontSize: 18, fontWeight: '700' }]}>Attach to Project</Text>
              <ScalePressable
                onPress={() => setAttachingItem(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                minTouchTarget
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={colors.textMuted} />
              </ScalePressable>
            </View>

            <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.md }]}>
              Select which project to attach this video clip to:
            </Text>

            {projects.length === 0 ? (
              <View style={{ paddingVertical: space.lg, alignItems: 'center' }}>
                <Text style={[type.body, { color: colors.textMuted, marginBottom: space.md }]}>No projects found.</Text>
                <SecondaryButton label="Close" onPress={() => setAttachingItem(null)} />
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: space.sm }}>
                  {projects.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => handleAttachToProject(p.id)}
                      style={{
                        backgroundColor: colors.card,
                        padding: space.md,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Attach to ${p.title}`}
                    >
                      <View>
                        <Text style={[type.heading, { color: colors.text, fontWeight: '600' }]}>{p.title}</Text>
                        <Text style={[type.caption, { color: colors.textMuted }]}>{p.gradeRaw} • {p.gymName || 'Outdoor'}</Text>
                      </View>
                      <ChevronRight size={18} color={colors.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            <View style={{ marginTop: space.lg }}>
              <SecondaryButton label="Cancel" variant="muted" onPress={() => setAttachingItem(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
