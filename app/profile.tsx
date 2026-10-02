import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SectionList, ActionSheetIOS, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { plural } from '../utils/string';
import { Filter, Calendar, List, Settings } from 'lucide-react-native';
import { Modal } from 'react-native';
import { Settings as SettingsIcon, Search, X } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SessionCard } from '../components/ui/SessionCard';
import { LogbookCalendar } from '../components/ui/LogbookCalendar';
import { UndoToast } from '../components/ui/UndoToast';
import { useLogbookHistory, useLogbookSummary, useAllSessions } from '../db/hooks';
import { LogbookFilters } from '../db/queries';
import { softDeleteSession, undoDeleteSession } from '../db/queries';
import { useTheme } from '../theme/useTheme';
import { triggerHaptic } from '../utils/haptics';

export default function LogbookScreen() {
  const router = useRouter();
  const { colors, space, radius, type } = useTheme();

  // Filters State
  const [filters, setFilters] = useState<LogbookFilters>({
    viewMode: 'list',
    period: 'all',
    gym: null,
    minGradeIndex: null,
    searchQuery: null,
    sort: 'newest',
    showEmpty: false,
    selectedDate: null,
  });

  const [searchInput, setSearchInput] = useState('');
  const [deletedSessionId, setDeletedSessionId] = useState<string | null>(null);

  // Queries
  const summary = useLogbookSummary(filters);
  const historyGroups = useLogbookHistory(filters);
  const allSessionsRaw = useAllSessions();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const uniqueGyms = useMemo(() => {
    const gyms = new Set<string>();
    allSessionsRaw.forEach(s => {
      if (s.gymName) gyms.add(s.gymName);
    });
    return Array.from(gyms).sort();
  }, [allSessionsRaw]);

  const handleDelete = (id: string) => {
    softDeleteSession(id);
    setDeletedSessionId(id);
  };

  const handleUndo = () => {
    if (deletedSessionId) {
      undoDeleteSession(deletedSessionId);
      setDeletedSessionId(null);
    }
  };

  const formatDurationCompact = (ms: number) => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const renderStat = (label: string, value: string | number) => (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 76,
        padding: space.sm,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={[
          type.stat,
          { fontSize: 22, color: colors.text, fontVariant: ['tabular-nums'] },
        ]}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={[
          type.label,
          { color: colors.textMuted, fontSize: 10, marginTop: 4 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  const hasActiveFilters = filters.gym !== null || filters.minGradeIndex !== null || filters.sort !== 'newest' || filters.showEmpty;
  
  let activeFilterLabel = '';
  if (hasActiveFilters) {
    const parts = [];
    if (filters.gym) parts.push(filters.gym);
    if (filters.minGradeIndex !== null) parts.push(`V${filters.minGradeIndex}+`);
    if (filters.sort === 'climbs') parts.push('Most climbs');
    if (filters.sort === 'hardest') parts.push('Hardest');
    if (filters.showEmpty) parts.push('Includes empty');
    activeFilterLabel = parts.join(' · ');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'ios' ? 60 : 40 }}>
      <View style={{ paddingHorizontal: space.lg, marginBottom: space.sm }}>
        {/* Compact Top Header */}
        {!isSearchActive ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
            <Text style={[type.display, { color: colors.text, fontSize: 28 }]}>Logbook</Text>
            
            <View style={{ flexDirection: 'row', gap: space.xs, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setIsSearchActive(true)}
                accessibilityRole="button"
                accessibilityLabel="Search"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Search size={20} color={colors.text} />
              </TouchableOpacity>
              
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  height: 44,
                  padding: 3,
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  onPress={() => setFilters(f => ({ ...f, viewMode: 'list' }))}
                  accessibilityRole="button"
                  accessibilityLabel="List view"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: filters.viewMode === 'list' ? colors.accentSoft : 'transparent',
                    borderRadius: radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <List size={18} color={filters.viewMode === 'list' ? colors.accentText : colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilters(f => ({ ...f, viewMode: 'calendar' }))}
                  accessibilityRole="button"
                  accessibilityLabel="Calendar view"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: filters.viewMode === 'calendar' ? colors.accentSoft : 'transparent',
                    borderRadius: radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={18} color={filters.viewMode === 'calendar' ? colors.accentText : colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/settings')}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SettingsIcon size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardMuted, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, height: 48 }}>
            <Search size={18} color={colors.textMuted} />
            <TextInput 
              style={[type.body, { flex: 1, marginLeft: space.sm, color: colors.text }]}
              placeholder="Search notes or gym..."
              placeholderTextColor={colors.textMuted}
              value={searchInput}
              onChangeText={setSearchInput}
              autoFocus
              onEndEditing={() => setFilters(f => ({ ...f, searchQuery: searchInput || null }))}
            />
            <TouchableOpacity
              onPress={() => { setIsSearchActive(false); setSearchInput(''); setFilters(f => ({ ...f, searchQuery: null })); }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Period Segmented Control & Filters */}
        <View style={{ flexDirection: 'row', marginTop: space.md, gap: space.sm, alignItems: 'center' }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              height: 52,
              padding: 4,
            }}
          >
            {['week', 'month', '3months', 'year', 'all'].map(p => {
              const active = filters.period === p;
              const label = p === 'week' ? 'Week' : p === 'month' ? 'Month' : p === '3months' ? '3 mo' : p === 'year' ? 'Year' : 'All';
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setFilters(f => ({ ...f, period: p as any }))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    flex: 1,
                    backgroundColor: active ? colors.accentSoft : 'transparent',
                    borderRadius: radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={[
                      type.caption,
                      {
                        color: active ? colors.accentText : colors.textMuted,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => setIsFilterModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filters"
            style={{
              width: 52,
              height: 52,
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Filter size={20} color={hasActiveFilters ? colors.accentText : colors.text} />
            {hasActiveFilters && (
              <View style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
            )}
          </TouchableOpacity>
        </View>

        {/* Caption Line */}
        {hasActiveFilters && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm, paddingHorizontal: space.xs }}>
            <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
              {activeFilterLabel}
            </Text>
            <TouchableOpacity onPress={() => setFilters(f => ({ ...f, gym: null, minGradeIndex: null, sort: 'newest', showEmpty: false }))}>
              <Text style={[type.caption, { color: colors.accent }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <SectionList
        sections={historyGroups}
        keyExtractor={(item: any) => item.id}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.lg }}>
            <View style={{ flexDirection: 'row', gap: space.xs }}>
              {renderStat('Sessions', summary.sessions)}
              {renderStat('Climbs', summary.climbs)}
              {renderStat('Sends', summary.sends)}
              {renderStat('Time', formatDurationCompact(summary.durationMs))}
            </View>
            
            {filters.viewMode === 'calendar' && (
              <View style={{ marginTop: space.lg }}>
                <LogbookCalendar 
                  sessions={historyGroups} 
                  selectedDate={filters.selectedDate} 
                  onSelectDate={(date) => setFilters(f => ({ ...f, selectedDate: date }))} 
                />
              </View>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: colors.bg, paddingVertical: space.sm }}>
            <Text style={[type.heading, { color: colors.textMuted, fontSize: 13 }]}>
              {section.monthLabel} · {plural(section.data.length, 'session')} · {plural(section.totalClimbs, 'climb')} · {plural(section.totalSends, 'send')}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <SessionCard session={item} onDelete={handleDelete} />
        )}
        ListEmptyComponent={
          <EmptyState 
            icon={<Search size={24} />} 
            title={allSessionsRaw.length === 0 ? "Log your first session" : "No sessions match"} 
            body={allSessionsRaw.length === 0 ? "Head to the gym and start climbing." : "Try clearing your filters."}
            cta={
              allSessionsRaw.length === 0 
                ? <PrimaryButton label="Start a Session" onPress={() => router.push('/')} />
                : <PrimaryButton label="Clear filters" onPress={() => setFilters(f => ({ ...f, gym: null, minGradeIndex: null, searchQuery: null, sort: 'newest', showEmpty: false, selectedDate: null }))} />
            } 
          />
        }
      />

      {/* Filter Bottom Sheet */}
      {/* Filter Bottom Sheet */}
      <Modal visible={isFilterModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: space.xl, paddingBottom: 34 }}>
            {/* Drag Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space.md }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
              <Text style={[type.display, { color: colors.text, fontSize: 24 }]}>Filters</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: colors.cardMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>SORT BY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
              {['newest', 'climbs', 'hardest'].map(s => (
                <Chip key={s} label={s === 'newest' ? 'Newest' : s === 'climbs' ? 'Most climbs' : 'Hardest'} active={filters.sort === s} onPress={() => setFilters(f => ({ ...f, sort: s as any }))} />
              ))}
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>MINIMUM GRADE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
              <Chip label="Any" active={filters.minGradeIndex === null} onPress={() => setFilters(f => ({ ...f, minGradeIndex: null }))} />
              {[3, 5, 7, 9].map(g => (
                <Chip key={g} label={`V${g}+`} active={filters.minGradeIndex === g} onPress={() => setFilters(f => ({ ...f, minGradeIndex: g }))} />
              ))}
            </View>

            {uniqueGyms.length > 0 && (
              <>
                <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>GYM</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
                  <Chip label="All Gyms" active={filters.gym === null} onPress={() => setFilters(f => ({ ...f, gym: null }))} />
                  {uniqueGyms.map(g => (
                    <Chip key={g} label={g} active={filters.gym === g} onPress={() => setFilters(f => ({ ...f, gym: g }))} />
                  ))}
                </View>
              </>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xl }}>
              <Text style={[type.body, { color: colors.text }]}>Show empty sessions</Text>
              <Chip label={filters.showEmpty ? "Yes" : "No"} active={filters.showEmpty} onPress={() => setFilters(f => ({ ...f, showEmpty: !f.showEmpty }))} />
            </View>

            <PrimaryButton label="APPLY FILTERS" onPress={() => setIsFilterModalOpen(false)} />
          </View>
        </View>
      </Modal>

      <UndoToast 
        visible={!!deletedSessionId} 
        message="Session deleted"
        onUndo={handleUndo} 
        onDismiss={() => setDeletedSessionId(null)} 
      />
    </View>
  );
}
