import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SectionList,
  Platform,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Filter,
  Calendar,
  List,
  Settings as SettingsIcon,
  Search,
  X,
  ChevronDown,
  Check,
  Plus,
} from 'lucide-react-native';
import { plural } from '../utils/string';
import { PastSessionModal } from '../components/logbook/PastSessionModal';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ScalePressable } from '../components/ui/ScalePressable';
import { SessionCard } from '../components/ui/SessionCard';
import { LogbookCalendar } from '../components/ui/LogbookCalendar';
import { UndoToast } from '../components/ui/UndoToast';
import { useLogbookHistory, useLogbookSummary, useAllSessions } from '../db/hooks';
import { LogbookFilters, softDeleteSession, undoDeleteSession } from '../db/queries';
import { useTheme } from '../theme/useTheme';
import { triggerHaptic } from '../utils/haptics';

const PERIOD_LABELS: Record<string, string> = {
  all: 'All Time',
  week: 'This Week',
  month: 'This Month',
  '3months': 'Last 3 Months',
  year: 'This Year',
};

const PERIOD_OPTIONS: { key: LogbookFilters['period']; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: '3months', label: 'Last 3 Months' },
  { key: 'year', label: 'This Year' },
];

export default function LogbookScreen() {
  const router = useRouter();
  const { colors, space, radius, type, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPeriodSheetOpen, setIsPeriodSheetOpen] = useState(false);
  const [isPastSessionOpen, setIsPastSessionOpen] = useState(false);

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

  const summary = useLogbookSummary(filters);
  const historyGroups = useLogbookHistory(filters);
  const allSessionsRaw = useAllSessions();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const uniqueGyms = useMemo(() => {
    const gyms = new Set<string>();
    allSessionsRaw.forEach((s) => {
      if (s.gymName) gyms.add(s.gymName);
    });
    return Array.from(gyms).sort();
  }, [allSessionsRaw]);

  // Aggregate flash / top / attempt breakdown across displayed history groups
  const aggregateMix = useMemo(() => {
    let flash = 0;
    let top = 0;
    let attempt = 0;
    historyGroups.forEach((group) => {
      group.data.forEach((s: any) => {
        flash += s.resultMix?.flash ?? 0;
        top += s.resultMix?.top ?? 0;
        attempt += s.resultMix?.attempt ?? 0;
      });
    });
    return { flash, top, attempt, total: flash + top + attempt };
  }, [historyGroups]);

  const sendRate =
    summary.climbs > 0 ? Math.round((summary.sends / summary.climbs) * 100) : 0;

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

  const hasActiveFilters =
    filters.gym !== null ||
    filters.minGradeIndex !== null ||
    filters.sort !== 'newest' ||
    filters.showEmpty ||
    filters.selectedDate !== null;

  let activeFilterLabel = '';
  if (hasActiveFilters) {
    const parts = [];
    if (filters.gym) parts.push(filters.gym);
    if (filters.minGradeIndex !== null) parts.push(`V${filters.minGradeIndex}+`);
    if (filters.sort === 'climbs') parts.push('Most climbs');
    if (filters.sort === 'hardest') parts.push('Hardest');
    if (filters.showEmpty) parts.push('Includes empty');
    if (filters.selectedDate) parts.push(filters.selectedDate);
    activeFilterLabel = parts.join(' · ');
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 54) : 36,
      }}
    >
      {/* Top Header & Unified Control Strip */}
      <View style={{ paddingHorizontal: space.lg, marginBottom: space.md }}>
        {!isSearchActive ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: space.md,
            }}
          >
            <View>
              <Text
                style={[
                  type.label,
                  {
                    color: colors.accentText,
                    fontSize: 10,
                    letterSpacing: 2.2,
                    marginBottom: 2,
                  },
                ]}
              >
                EXPEDITION ARCHIVE
              </Text>
              <Text
                style={[
                  type.display,
                  { color: colors.text, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
                ]}
              >
                Logbook
              </Text>
            </View>

            {/* Right Action Cluster */}
            <View style={{ flexDirection: 'row', gap: space.xs, alignItems: 'center' }}>
              <ScalePressable
                haptic="light"
                activeScale={0.92}
                onPress={() => setIsPastSessionOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Log past session"
                style={{
                  width: 42,
                  height: 42,
                  backgroundColor: colors.accentSoft,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={20} color={colors.accentText} strokeWidth={2.4} />
              </ScalePressable>

              <ScalePressable
                haptic="light"
                activeScale={0.92}
                onPress={() => setIsSearchActive(true)}
                accessibilityRole="button"
                accessibilityLabel="Search"
                style={{
                  width: 42,
                  height: 42,
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Search size={19} color={colors.text} />
              </ScalePressable>

              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  height: 42,
                  padding: 3,
                  alignItems: 'center',
                }}
              >
                <ScalePressable
                  haptic="selection"
                  activeScale={0.92}
                  onPress={() => setFilters((f) => ({ ...f, viewMode: 'list' }))}
                  accessibilityRole="button"
                  accessibilityLabel="List view"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor:
                      filters.viewMode === 'list' ? colors.accentSoft : 'transparent',
                    borderRadius: radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <List
                    size={17}
                    color={filters.viewMode === 'list' ? colors.accentText : colors.textMuted}
                  />
                </ScalePressable>
                <ScalePressable
                  haptic="selection"
                  activeScale={0.92}
                  onPress={() => setFilters((f) => ({ ...f, viewMode: 'calendar' }))}
                  accessibilityRole="button"
                  accessibilityLabel="Calendar view"
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor:
                      filters.viewMode === 'calendar' ? colors.accentSoft : 'transparent',
                    borderRadius: radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar
                    size={17}
                    color={
                      filters.viewMode === 'calendar' ? colors.accentText : colors.textMuted
                    }
                  />
                </ScalePressable>
              </View>

              <ScalePressable
                haptic="light"
                activeScale={0.92}
                onPress={() => router.push('/settings')}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                style={{
                  width: 42,
                  height: 42,
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SettingsIcon size={19} color={colors.text} />
              </ScalePressable>
            </View>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.materialBase,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              paddingHorizontal: space.md,
              height: 48,
              marginBottom: space.md,
            }}
          >
            <Search size={18} color={colors.accentText} />
            <TextInput
              style={[type.body, { flex: 1, marginLeft: space.sm, color: colors.text }]}
              placeholder="Search session notes or gym..."
              placeholderTextColor={colors.textMuted}
              value={searchInput}
              onChangeText={(val) => {
                setSearchInput(val);
                setFilters((f) => ({ ...f, searchQuery: val || null }));
              }}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setIsSearchActive(false);
                setSearchInput('');
                setFilters((f) => ({ ...f, searchQuery: null }));
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Unified Control Bar: Timeframe Pill + Filter Pill + Active Filter Summary */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <ScalePressable
            haptic="light"
            activeScale={0.96}
            onPress={() => setIsPeriodSheetOpen(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              height: 40,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            <Text style={[type.control, { color: colors.accentText, fontWeight: '600' }]}>
              {PERIOD_LABELS[filters.period]}
            </Text>
            <ChevronDown size={15} color={colors.accentText} strokeWidth={2.5} />
          </ScalePressable>

          <ScalePressable
            haptic="light"
            activeScale={0.96}
            onPress={() => setIsFilterModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filters"
            style={{
              flexDirection: 'row',
              height: 40,
              backgroundColor: hasActiveFilters ? colors.accentSoft : colors.card,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: hasActiveFilters ? colors.accent : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 14,
              gap: 6,
            }}
          >
            <Filter size={15} color={hasActiveFilters ? colors.accentText : colors.text} />
            <Text
              style={[
                type.control,
                {
                  color: hasActiveFilters ? colors.accentText : colors.text,
                  fontWeight: hasActiveFilters ? '600' : '500',
                },
              ]}
            >
              Filters
            </Text>
            {hasActiveFilters && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.accent,
                }}
              />
            )}
          </ScalePressable>

          {hasActiveFilters && (
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 4,
              }}
            >
              <Text
                style={[type.caption, { color: colors.textMuted, flex: 1 }]}
                numberOfLines={1}
              >
                {activeFilterLabel}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  setFilters((f) => ({
                    ...f,
                    gym: null,
                    minGradeIndex: null,
                    sort: 'newest',
                    showEmpty: false,
                    selectedDate: null,
                  }));
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[type.caption, { color: colors.accentText, fontWeight: '600' }]}>
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <SectionList
        sections={historyGroups}
        keyExtractor={(item: any) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 130 }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.lg, gap: space.lg }}>
            {/* Asymmetric 2-Column Bento Hero Grid (Distinct from SessionCard rows) */}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {/* Left Hero Tile: Giant Climb Volume + Send Efficiency */}
              <View
                style={{
                  flex: 1.15,
                  backgroundColor: colors.materialBase,
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  padding: space.lg,
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  position: 'relative',
                  minHeight: 168,
                  ...shadow.floating,
                }}
              >
                <LinearGradient
                  colors={[colors.accentSoft, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                <View>
                  <Text
                    style={[
                      type.label,
                      { color: colors.accentText, fontSize: 9, letterSpacing: 1.8 },
                    ]}
                  >
                    {PERIOD_LABELS[filters.period].toUpperCase()} VOLUME
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    <Text
                      style={[
                        type.stat,
                        {
                          color: colors.textWhitePrimary,
                          fontSize: 44,
                          lineHeight: 48,
                          fontWeight: '700',
                          letterSpacing: -1,
                        },
                      ]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      {summary.climbs}
                    </Text>
                    <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>
                      climbs
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 6, marginTop: space.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <View
                      style={{
                        backgroundColor: colors.flashSoft,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: colors.flash,
                      }}
                    >
                      <Text
                        style={[
                          type.caption,
                          { color: colors.flashText, fontSize: 11, fontWeight: '700' },
                        ]}
                      >
                        {summary.sends} Sends ({sendRate}%)
                      </Text>
                    </View>
                  </View>
                  <Text style={[type.caption, { color: colors.textMuted, fontSize: 11 }]}>
                    {aggregateMix.flash} flashed · {aggregateMix.top} topped
                  </Text>
                </View>
              </View>

              {/* Right Column: Two Stacked Compact Bento Tiles (Sessions & Wall Time) */}
              <View style={{ flex: 0.95, gap: space.sm }}>
                {/* Top Right Tile: Sessions Count */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm + 2,
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={[
                      type.label,
                      { color: colors.textMuted, fontSize: 9, letterSpacing: 1.5 },
                    ]}
                  >
                    SESSIONS LOGGED
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={[
                        type.statSm,
                        { color: colors.textWhitePrimary, fontSize: 26, fontWeight: '700' },
                      ]}
                    >
                      {summary.sessions}
                    </Text>
                    {summary.sessions > 0 && (
                      <Text style={[type.caption, { color: colors.accentText, fontSize: 11 }]}>
                        ~{Math.round(summary.climbs / summary.sessions)} climbs/sess
                      </Text>
                    )}
                  </View>
                </View>

                {/* Bottom Right Tile: Total Wall Time */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm + 2,
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={[
                      type.label,
                      { color: colors.textMuted, fontSize: 9, letterSpacing: 1.5 },
                    ]}
                  >
                    TOTAL WALL TIME
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={[
                        type.statSm,
                        { color: colors.textWhitePrimary, fontSize: 24, fontWeight: '700' },
                      ]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      {formatDurationCompact(summary.durationMs)}
                    </Text>
                    {summary.sessions > 0 && (
                      <Text style={[type.caption, { color: colors.textMuted, fontSize: 11 }]}>
                        avg {formatDurationCompact(Math.round(summary.durationMs / summary.sessions))}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {filters.viewMode === 'calendar' && (
              <LogbookCalendar
                sessions={historyGroups}
                selectedDate={filters.selectedDate}
                onSelectDate={(date) => setFilters((f) => ({ ...f, selectedDate: date }))}
              />
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: space.sm,
              marginBottom: space.xs,
            }}
          >
            <Text
              style={[
                type.label,
                {
                  color: colors.textWhitePrimary,
                  fontSize: 11,
                  letterSpacing: 2,
                  fontWeight: '700',
                },
              ]}
            >
              {section.monthLabel.toUpperCase()}
            </Text>
            <View
              style={{
                backgroundColor: colors.cardMuted,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[type.caption, { color: colors.textMuted, fontSize: 11 }]}>
                {plural(section.data.length, 'session')} · {plural(section.totalClimbs, 'climb')} ·{' '}
                {plural(section.totalSends, 'send')}
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => <SessionCard session={item} onDelete={handleDelete} />}
        ListEmptyComponent={
          <EmptyState
            asCard
            illustration={require('../assets/illustrations/empty-sessions.jpg')}
            icon={<Search size={24} color={colors.accent} />}
            title={
              hasActiveFilters || filters.searchQuery
                ? 'No sessions match'
                : 'No sessions logged yet'
            }
            body={
              hasActiveFilters || filters.searchQuery
                ? 'Try clearing your filters or search.'
                : 'Start a live session or log a past session from your workout.'
            }
            cta={
              hasActiveFilters || filters.searchQuery ? (
                <PrimaryButton
                  label="Clear filters"
                  onPress={() =>
                    setFilters((f) => ({
                      ...f,
                      gym: null,
                      minGradeIndex: null,
                      searchQuery: null,
                      sort: 'newest',
                      showEmpty: false,
                      selectedDate: null,
                    }))
                  }
                />
              ) : (
                <PrimaryButton
                  label="+ Log a Session"
                  onPress={() => setIsPastSessionOpen(true)}
                />
              )
            }
          />
        }
      />

      {/* Filter Bottom Sheet */}
      <Modal visible={isFilterModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim }}>
          <View
            style={{
              backgroundColor: colors.materialBase,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              padding: space.xl,
              paddingBottom: Math.max(insets.bottom, 34),
              ...shadow.floating,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: space.md,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: space.xl,
              }}
            >
              <Text style={[type.display, { color: colors.text, fontSize: 24 }]}>Filters</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>
              SORT BY
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: space.sm,
                marginBottom: space.lg,
              }}
            >
              {['newest', 'climbs', 'hardest'].map((s) => (
                <Chip
                  key={s}
                  label={
                    s === 'newest' ? 'Newest' : s === 'climbs' ? 'Most climbs' : 'Hardest'
                  }
                  active={filters.sort === s}
                  onPress={() => setFilters((f) => ({ ...f, sort: s as any }))}
                />
              ))}
            </View>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>
              MINIMUM GRADE
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: space.sm,
                marginBottom: space.lg,
              }}
            >
              <Chip
                label="Any"
                active={filters.minGradeIndex === null}
                onPress={() => setFilters((f) => ({ ...f, minGradeIndex: null }))}
              />
              {[3, 5, 7, 9].map((g) => (
                <Chip
                  key={g}
                  label={`V${g}+`}
                  active={filters.minGradeIndex === g}
                  onPress={() => setFilters((f) => ({ ...f, minGradeIndex: g }))}
                />
              ))}
            </View>

            {uniqueGyms.length > 0 && (
              <>
                <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>
                  GYM
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: space.sm,
                    marginBottom: space.lg,
                  }}
                >
                  <Chip
                    label="All Gyms"
                    active={filters.gym === null}
                    onPress={() => setFilters((f) => ({ ...f, gym: null }))}
                  />
                  {uniqueGyms.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      active={filters.gym === g}
                      onPress={() => setFilters((f) => ({ ...f, gym: g }))}
                    />
                  ))}
                </View>
              </>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: space.xl,
              }}
            >
              <Text style={[type.body, { color: colors.text }]}>Show empty sessions</Text>
              <Chip
                label={filters.showEmpty ? 'Yes' : 'No'}
                active={filters.showEmpty}
                onPress={() => setFilters((f) => ({ ...f, showEmpty: !f.showEmpty }))}
              />
            </View>

            <PrimaryButton label="APPLY FILTERS" onPress={() => setIsFilterModalOpen(false)} />
          </View>
        </View>
      </Modal>

      {/* Spatial Action Sheet for Logbook Period Selection */}
      <Modal visible={isPeriodSheetOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim }}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsPeriodSheetOpen(false)} />
          <View
            style={{
              backgroundColor: colors.materialBase,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              padding: space.xl,
              paddingBottom: Math.max(insets.bottom, space.xl),
              ...shadow.floating,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: space.xl,
              }}
            />

            <Text
              style={[
                type.label,
                {
                  color: colors.textMuted,
                  fontSize: 11,
                  letterSpacing: 1.8,
                  marginBottom: space.md,
                },
              ]}
            >
              SELECT TIMEFRAME
            </Text>

            <View style={{ gap: space.xs }}>
              {PERIOD_OPTIONS.map((opt) => {
                const isActive = filters.period === opt.key;
                return (
                  <ScalePressable
                    key={opt.key}
                    haptic="selection"
                    activeScale={0.97}
                    onPress={() => {
                      setFilters((f) => ({ ...f, period: opt.key }));
                      setIsPeriodSheetOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: space.md,
                      paddingHorizontal: space.md,
                      backgroundColor: isActive ? colors.accentSoft : 'transparent',
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.glassBorder : 'transparent',
                      borderRadius: radius.md,
                      minHeight: 48,
                    }}
                  >
                    <Text
                      style={[
                        type.heading,
                        {
                          color: isActive ? colors.accentText : colors.text,
                          fontSize: 16,
                          fontWeight: isActive ? '700' : '400',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isActive && <Check size={20} color={colors.accentText} strokeWidth={2.5} />}
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <UndoToast
        visible={!!deletedSessionId}
        message="Session deleted"
        onUndo={handleUndo}
        onDismiss={() => setDeletedSessionId(null)}
      />

      <PastSessionModal
        visible={isPastSessionOpen}
        gyms={uniqueGyms}
        onClose={() => setIsPastSessionOpen(false)}
      />
    </View>
  );
}
