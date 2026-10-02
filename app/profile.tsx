import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SectionList, ActionSheetIOS, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings as SettingsIcon, Search, X } from 'lucide-react-native';
import { Screen } from '../components/ui/Screen';
import { FilterChip } from '../components/ui/FilterChip';
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
  
  // Gyms for filter
  const allSessionsRaw = useAllSessions();
  const uniqueGyms = useMemo(() => {
    const gyms = new Set<string>();
    allSessionsRaw.forEach(s => {
      if (s.gymName) gyms.add(s.gymName);
    });
    return Array.from(gyms);
  }, [allSessionsRaw]);

  // Handlers
  const handlePeriod = (p: LogbookFilters['period']) => {
    triggerHaptic('light');
    setFilters(f => ({ ...f, period: p }));
  };
  
  const handleSort = () => {
    const opts: LogbookFilters['sort'][] = ['newest', 'climbs', 'hardest'];
    const next = opts[(opts.indexOf(filters.sort) + 1) % opts.length];
    triggerHaptic('light');
    setFilters(f => ({ ...f, sort: next }));
  };

  const handleMinGrade = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Any Grade', 'V3+', 'V5+', 'V7+', 'V9+'],
          cancelButtonIndex: 0,
        },
        (btnIndex) => {
          if (btnIndex === 0) return;
          const map: Record<number, number | null> = { 1: null, 2: 3, 3: 5, 4: 7, 5: 9 };
          setFilters(f => ({ ...f, minGradeIndex: map[btnIndex] }));
        }
      );
    } else {
      const map: Record<string, number | null> = { 'Any': null, 'V3+': 3, 'V5+': 5, 'V7+': 7, 'V9+': 9 };
      const keys = Object.keys(map);
      const currentIdx = keys.findIndex(k => map[k] === filters.minGradeIndex);
      const nextIdx = (currentIdx + 1) % keys.length;
      setFilters(f => ({ ...f, minGradeIndex: map[keys[nextIdx]] }));
    }
  };

  const handleDelete = (id: string, climbsCount: number) => {
    triggerHaptic('light');
    softDeleteSession(id);
    setDeletedSessionId(id);
  };

  const handleUndo = () => {
    if (deletedSessionId) {
      triggerHaptic('light');
      undoDeleteSession(deletedSessionId);
      setDeletedSessionId(null);
    }
  };

  // Render formatters
  const formatDuration = (ms: number) => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const renderStat = (label: string, value: string | number) => (
    <View style={{ flex: 1, backgroundColor: colors.card, padding: space.sm, borderRadius: radius.md, alignItems: 'center' }}>
      <Text style={[type.stat, { fontSize: 24, color: colors.text }]}>{value}</Text>
      <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );

  const prevText = summary.prevSessions > 0 
    ? `${summary.sessions >= summary.prevSessions ? '+' : ''}${summary.sessions - summary.prevSessions} sessions vs previous`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen 
        title="Logbook" 
        headerRight={
          <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 8, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
            <SettingsIcon size={20} color={colors.text} />
          </TouchableOpacity>
        }
      >
        <SectionList
          sections={historyGroups}
          keyExtractor={(item: any) => item.id}
          stickySectionHeadersEnabled={true}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={
            <View style={{ marginBottom: space.lg }}>
              {/* Period selection */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg, marginBottom: space.md }}>
                <View style={{ flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg }}>
                  {['week', 'month', '3months', 'year', 'all'].map(p => (
                    <FilterChip key={p} label={p === 'week' ? 'This week' : p === 'month' ? 'This month' : p === '3months' ? '3 months' : p === 'year' ? 'Year' : 'All'} active={filters.period === p} onPress={() => handlePeriod(p as any)} />
                  ))}
                </View>
              </ScrollView>

              {/* Summary Stats */}
              <View style={{ flexDirection: 'row', gap: space.xs, marginBottom: space.sm }}>
                {renderStat('Sessions', summary.sessions)}
                {renderStat('Climbs', summary.climbs)}
                {renderStat('Sends', summary.sends)}
                {renderStat('Time', formatDuration(summary.durationMs))}
              </View>
              {prevText && (
                <Text style={[type.caption, { color: colors.textMuted, textAlign: 'right', marginBottom: space.lg }]}>
                  {prevText}
                </Text>
              )}

              {/* Controls: Search, View Mode, Filters */}
              <View style={{ gap: space.md, marginBottom: space.lg }}>
                {/* Search */}
                <View style={{ flexDirection: 'row', backgroundColor: colors.cardMuted, borderRadius: radius.md, padding: space.sm, alignItems: 'center' }}>
                  <Search size={16} color={colors.textMuted} />
                  <TextInput 
                    style={[type.body, { flex: 1, marginLeft: space.sm, color: colors.text }]}
                    placeholder="Search notes or gym..."
                    placeholderTextColor={colors.textMuted}
                    value={searchInput}
                    onChangeText={setSearchInput}
                    onEndEditing={() => setFilters(f => ({ ...f, searchQuery: searchInput || null }))}
                  />
                  {searchInput.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchInput(''); setFilters(f => ({ ...f, searchQuery: null })); }}>
                      <X size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Second row of filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }}>
                  <View style={{ flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg }}>
                    <FilterChip label={filters.viewMode === 'list' ? 'List View' : 'Calendar'} active onPress={() => setFilters(f => ({ ...f, viewMode: f.viewMode === 'list' ? 'calendar' : 'list' }))} />
                    
                    <FilterChip 
                      label={filters.sort === 'newest' ? 'Sort: Newest' : filters.sort === 'climbs' ? 'Sort: Most climbs' : 'Sort: Hardest'} 
                      active={filters.sort !== 'newest'} 
                      onPress={handleSort} 
                    />
                    
                    <FilterChip 
                      label={filters.minGradeIndex === null ? 'Grade: Any' : `Grade: V${filters.minGradeIndex}+`} 
                      active={filters.minGradeIndex !== null} 
                      onPress={handleMinGrade} 
                    />

                    <FilterChip label="Show empty" active={filters.showEmpty} onPress={() => setFilters(f => ({ ...f, showEmpty: !f.showEmpty }))} />
                  </View>
                </ScrollView>
                
                {/* Gym Filter */}
                {uniqueGyms.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }}>
                    <View style={{ flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg }}>
                      <FilterChip label="All Gyms" active={filters.gym === null} onPress={() => setFilters(f => ({ ...f, gym: null }))} />
                      {uniqueGyms.map(g => (
                        <FilterChip key={g} label={g} active={filters.gym === g} onPress={() => setFilters(f => ({ ...f, gym: g }))} />
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>

              {/* Calendar View */}
              {filters.viewMode === 'calendar' && (
                <LogbookCalendar 
                  sessions={historyGroups} 
                  selectedDate={filters.selectedDate} 
                  onSelectDate={(date) => setFilters(f => ({ ...f, selectedDate: date }))} 
                />
              )}
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={{ backgroundColor: colors.bg, paddingVertical: space.sm }}>
              <Text style={[type.label, { color: colors.textMuted }]}>
                {section.monthLabel.toUpperCase()} · {section.data.length} SESSIONS · {section.totalClimbs} CLIMBS · {section.totalSends} SENDS
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
                  : <PrimaryButton label="Clear filters" onPress={() => setFilters({ viewMode: 'list', period: 'all', gym: null, minGradeIndex: null, searchQuery: null, sort: 'newest', showEmpty: false, selectedDate: null })} />
              } 
            />
          }
        />
      </Screen>

      <UndoToast 
        visible={!!deletedSessionId} 
        message="Session deleted"
        onUndo={handleUndo} 
        onDismiss={() => setDeletedSessionId(null)} 
      />
    </View>
  );
}
