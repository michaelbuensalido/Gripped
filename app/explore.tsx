import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MapPin, ChevronRight, Plus, X } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/ui/Card';
import { ScalePressable } from '../components/ui/ScalePressable';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { EmptyState } from '../components/ui/EmptyState';
import { useRecentGyms } from '../db/hooks';
import * as Q from '../db/queries';

export default function ExploreScreen() {
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const gyms = useRecentGyms();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGymName, setNewGymName] = useState('');

  const filteredGyms = gyms.filter(g => g.toLowerCase().includes(search.toLowerCase()));

  const handleAddGym = () => {
    const trimmed = newGymName.trim();
    if (!trimmed) return;
    Q.insertGym(trimmed);
    setNewGymName('');
    setIsAddModalOpen(false);
    router.push(`/gym/${encodeURIComponent(trimmed)}?from=explore` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgTexture }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 8,
          paddingBottom: 130,
          paddingHorizontal: space.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
          <Text style={[type.display, { color: colors.text, fontSize: 34 }]}>Explore</Text>
          <ScalePressable
            haptic="light"
            activeScale={0.94}
            onPress={() => setIsAddModalOpen(true)}
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
            <Text style={[type.label, { color: colors.textOnAccent, fontWeight: '700' }]}>Add Gym</Text>
          </ScalePressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: space.md, borderWidth: 1, borderColor: colors.border, marginBottom: space.xl }}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[type.body, { flex: 1, paddingVertical: space.md, paddingHorizontal: space.sm, color: colors.text }]}
            placeholder="Search gyms..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={[type.label, { color: colors.textMuted, marginBottom: space.md }]}>YOUR GYMS</Text>

        {filteredGyms.length === 0 ? (
          <EmptyState
            asCard
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
    </View>
  );
}
