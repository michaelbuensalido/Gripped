import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MapPin, ChevronRight, Plus, X } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { Card } from '../components/ui/Card';
import { useRecentGyms } from '../db/hooks';
import * as Q from '../db/queries';
import { triggerHaptic } from '../utils/haptics';

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
    triggerHaptic('medium');
    Q.insertGym(trimmed);
    setNewGymName('');
    setIsAddModalOpen(false);
    router.push(`/gym/${encodeURIComponent(trimmed)}` as any);
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
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setIsAddModalOpen(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accent,
              paddingHorizontal: space.md,
              paddingVertical: 8,
              borderRadius: radius.pill,
            }}
          >
            <Plus size={16} color={colors.textOnAccent} style={{ marginRight: 4 }} />
            <Text style={[type.label, { color: colors.textOnAccent, fontWeight: '700' }]}>Add Gym</Text>
          </TouchableOpacity>
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
          <View style={{ alignItems: 'center', paddingVertical: space['2xl'] }}>
            <MapPin size={32} color={colors.border} style={{ marginBottom: space.md }} />
            <Text style={[type.body, { color: colors.textMuted, marginBottom: space.md, textAlign: 'center' }]}>
              {search.trim() ? `No gyms matching "${search}".` : 'No gyms saved yet.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                if (search.trim()) {
                  setNewGymName(search.trim());
                }
                setIsAddModalOpen(true);
              }}
              style={{
                backgroundColor: colors.cardMuted,
                paddingVertical: space.sm,
                paddingHorizontal: space.lg,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[type.heading, { color: colors.accent, fontSize: 14 }]}>
                {search.trim() ? `+ Add "${search.trim()}"` : '+ Add your first gym'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: space.sm }}>
            {filteredGyms.map(gym => (
              <Card
                key={gym}
                onPress={() => {
                  triggerHaptic('light');
                  router.push(`/gym/${encodeURIComponent(gym)}` as any);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: space.md }}>
                  <MapPin size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.heading, { color: colors.text, marginBottom: 2 }]}>{gym}</Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>View projects & sessions</Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Gym Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View style={{ backgroundColor: colors.materialBase, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, paddingBottom: Math.max(insets.bottom, space.xl) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
              <Text style={[type.heading, { color: colors.text, fontSize: 18 }]}>Add New Gym</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)} style={{ padding: space.xs }}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
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

            <TouchableOpacity
              disabled={!newGymName.trim()}
              onPress={handleAddGym}
              style={{
                backgroundColor: newGymName.trim() ? colors.accent : colors.cardMuted,
                paddingVertical: 14,
                borderRadius: radius.pill,
                alignItems: 'center',
                opacity: newGymName.trim() ? 1 : 0.5,
              }}
            >
              <Text style={[type.heading, { color: newGymName.trim() ? colors.textOnAccent : colors.textMuted, fontSize: 16 }]}>
                Save & Open Gym
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
