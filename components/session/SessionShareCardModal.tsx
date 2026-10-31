import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Clock, FileText, Share2, Trophy, X, Zap } from 'lucide-react-native';
import { ScalePressable } from '../ui/ScalePressable';
import { GradePill } from '../ui/GradePill';
import { StatStrip } from '../ui/StatStrip';
import { SegmentedBar, BarLegend } from '../ui/SegmentedBar';
import { ClimbingHoldGraphic, holdTypeForGrade } from '../ui/ClimbingHoldGraphic';
import { useTheme } from '../../theme/useTheme';
import { usePreferences } from '../../utils/preferences';
import { triggerHaptic } from '../../utils/haptics';

export interface SessionShareCardModalProps {
  visible: boolean;
  gymName: string;
  subtitleText: string;
  climbsCount: number;
  sendsCount: number;
  flashesCount: number;
  hardestGradeRaw: string;
  /** Normalised grade index of the hardest send; drives band colour + hold artwork. */
  hardestGradeIndex?: number;
  /** Session length in minutes (omitted for sessions still in progress). */
  durationMinutes?: number;
  topClimbs?: Array<{ gradeRaw: string; gradeIndex?: number; result: string }>;
  onClose: () => void;
}

const MAX_HIGHLIGHTS = 6;

function formatDurationMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function SessionShareCardModal({
  visible,
  gymName,
  subtitleText,
  climbsCount,
  sendsCount,
  flashesCount,
  hardestGradeRaw,
  hardestGradeIndex,
  durationMinutes,
  topClimbs = [],
  onClose,
}: SessionShareCardModalProps) {
  const { colors, radius, space, type, gradeBand, withAlpha } = useTheme();
  const { formatGradeLabel } = usePreferences();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!visible) return null;

  const sendRate = climbsCount > 0 ? Math.round((sendsCount / climbsCount) * 100) : 0;
  const formattedHardest =
    hardestGradeRaw && hardestGradeRaw !== '–' ? formatGradeLabel(hardestGradeRaw) : '–';
  const hasPeak = formattedHardest !== '–';

  const topsCount = Math.max(0, sendsCount - flashesCount);
  const attemptsCount = Math.max(0, climbsCount - sendsCount);

  const peakBand = hardestGradeIndex !== undefined ? gradeBand(hardestGradeIndex) : null;
  const peakColor = peakBand ? peakBand.text : colors.flashText;
  const peakSolid = peakBand ? peakBand.solid : colors.flash;
  const peakIsFlash = topClimbs.length > 0 && topClimbs[0].result === 'flash';

  const highlights = topClimbs.slice(0, MAX_HIGHLIGHTS);
  const overflow = Math.max(0, topClimbs.length - MAX_HIGHLIGHTS);

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    try {
      triggerHaptic('medium');
      setIsExporting(true);
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      setIsExporting(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `Share ${gymName} Session`,
          mimeType: 'image/png',
          UTI: 'public.png',
        });
        triggerHaptic('success');
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    } catch (e) {
      setIsExporting(false);
      Alert.alert('Export Failed', 'Unable to generate session share card.');
    }
  };

  const handleShareText = async () => {
    try {
      triggerHaptic('medium');
      const msg = [
        `Gripped Session • ${gymName}`,
        subtitleText,
        `• Climbs: ${climbsCount}`,
        `• Sends: ${sendsCount} (${sendRate}% send rate)`,
        `• Flashes: ${flashesCount}`,
        `• Hardest Send: ${formattedHardest}`,
        ...(durationMinutes ? [`• Time: ${formatDurationMinutes(durationMinutes)}`] : []),
      ].join('\n');
      await Share.share({
        message: msg,
        title: `Gripped Session: ${gymName}`,
      });
      triggerHaptic('success');
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgTexture,
              borderTopWidth: 1,
              borderColor: colors.glassBorder,
              paddingTop: Math.max(insets.top, space.lg),
              paddingBottom: Math.max(insets.bottom, space.lg),
            },
          ]}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <ScalePressable
              onPress={onClose}
              haptic="light"
              activeScale={0.92}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close share modal"
            >
              <X size={20} color={colors.text} />
            </ScalePressable>
            <Text style={[type.sectionTitle, { color: colors.text }]}>Share Session Card</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: space.md }}
          >
            {/* ── Share card (captured as PNG) ─────────────────────── */}
            <View
              ref={cardRef}
              collapsable={false}
              style={[
                styles.shareCard,
                {
                  backgroundColor: colors.bgTexture,
                  borderColor: colors.glassBorder,
                  borderRadius: radius.xl,
                },
              ]}
            >
              {/* Chalk wall canvas + grade-tinted wash */}
              <Image
                source={require('../../assets/chalk_bg.jpg')}
                style={[StyleSheet.absoluteFill, { opacity: colors.backdropImageOpacity }]}
                resizeMode="cover"
              />
              <LinearGradient
                pointerEvents="none"
                colors={[colors.backdropScrimTop, colors.backdropScrimBottom]}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                pointerEvents="none"
                colors={[withAlpha(peakSolid, 0.28), 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}
              />

              {/* Brand row */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.brandBadge,
                    {
                      backgroundColor: colors.surfaceInset,
                      borderColor: colors.glassBorder,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.brandLogo}
                    resizeMode="cover"
                  />
                  <Text style={[type.micro, { color: colors.text }]}>Gripped</Text>
                </View>
                {durationMinutes ? (
                  <View
                    style={[
                      styles.brandBadge,
                      {
                        backgroundColor: colors.surfaceInset,
                        borderColor: colors.glassBorder,
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <Clock size={space.md} color={colors.accentText} />
                    <Text style={[type.captionSemibold, { color: colors.text }]}>
                      {formatDurationMinutes(durationMinutes)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Gym & date */}
              <View style={{ gap: space.xs }}>
                <Text style={[type.label, { color: colors.textWhiteMuted }]}>Session recap</Text>
                <Text
                  style={[type.titleBold, styles.gymTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {gymName || 'Bouldering Session'}
                </Text>
                <Text style={[type.captionMedium, { color: colors.textMuted }]} numberOfLines={1}>
                  {subtitleText}
                </Text>
              </View>

              {/* Hero: peak send + hold artwork */}
              <View
                style={[
                  styles.hero,
                  {
                    backgroundColor: colors.surfaceInset,
                    borderColor: withAlpha(peakSolid, 0.45),
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: space.xs }}>
                  <View style={styles.row}>
                    <Trophy size={space.md} color={peakColor} />
                    <Text style={[type.micro, { color: colors.textWhiteSecondary }]}>
                      Peak send
                    </Text>
                  </View>
                  <Text
                    style={[type.heroStat, { color: hasPeak ? peakColor : colors.textMuted }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formattedHardest}
                  </Text>
                  {hasPeak && (
                    <View
                      style={[
                        styles.resultTag,
                        {
                          backgroundColor: peakIsFlash ? colors.flashSoft : colors.topSoft,
                          borderRadius: radius.pill,
                        },
                      ]}
                    >
                      {peakIsFlash ? (
                        <Zap size={space.md} color={colors.flash} />
                      ) : null}
                      <Text
                        style={[
                          type.captionSemibold,
                          { color: peakIsFlash ? colors.flashText : colors.topText },
                        ]}
                      >
                        {peakIsFlash ? 'Flashed' : 'Sent'}
                      </Text>
                    </View>
                  )}
                </View>
                <ClimbingHoldGraphic
                  type={holdTypeForGrade(hardestGradeIndex ?? null)}
                  size={space.xxl * 3}
                  borderRadius={radius.lg}
                  style={{
                    borderWidth: 1,
                    borderColor: peakSolid,
                    shadowColor: peakSolid,
                    shadowOpacity: 0.5,
                    shadowRadius: space.lg,
                    shadowOffset: { width: 0, height: space.xs },
                  }}
                />
              </View>

              {/* Outcome split */}
              <View style={{ gap: space.md }}>
                <SegmentedBar
                  segments={[
                    { value: flashesCount, color: colors.flash },
                    { value: topsCount, color: colors.top },
                    { value: attemptsCount, color: colors.attempt },
                  ]}
                />
                <BarLegend
                  items={[
                    { label: 'Flashed', value: flashesCount, color: colors.flash },
                    { label: 'Topped', value: topsCount, color: colors.top },
                    { label: 'Tries', value: attemptsCount, color: colors.attempt },
                  ]}
                />
              </View>

              <StatStrip
                cells={[
                  { label: 'Climbs', value: climbsCount },
                  { label: 'Sends', value: sendsCount },
                  {
                    label: 'Send rate',
                    value: `${sendRate}%`,
                    valueColor: sendRate >= 50 ? colors.flashText : colors.text,
                  },
                ]}
              />

              {/* Highlight logs */}
              {highlights.length > 0 && (
                <View style={{ gap: space.sm }}>
                  <Text style={[type.label, { color: colors.textWhiteMuted }]}>
                    Highlight sends
                  </Text>
                  <View style={styles.chipWrap}>
                    {highlights.map((c, i) => {
                      const isFlash = c.result === 'flash';
                      return (
                        <View key={i} style={styles.row}>
                          {c.gradeIndex !== undefined ? (
                            <GradePill gradeIndex={c.gradeIndex} label={formatGradeLabel(c.gradeRaw)} />
                          ) : (
                            <View
                              style={[
                                styles.fallbackPill,
                                {
                                  backgroundColor: colors.cardMuted,
                                  borderColor: colors.border,
                                  borderRadius: radius.sm,
                                },
                              ]}
                            >
                              <Text style={[type.captionSemibold, { color: colors.text }]}>
                                {formatGradeLabel(c.gradeRaw)}
                              </Text>
                            </View>
                          )}
                          {isFlash ? (
                            <Zap size={space.md} color={colors.flash} style={{ marginLeft: -space.xs }} />
                          ) : null}
                        </View>
                      );
                    })}
                    {overflow > 0 && (
                      <Text style={[type.captionSemibold, { color: colors.textMuted }]}>
                        {`+${overflow} more`}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Footer */}
              <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
                <Text style={[type.micro, { color: colors.textWhiteMuted }]}>
                  Tracked with Gripped
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={{ paddingHorizontal: space.lg, marginTop: space.sm }}>
            <ScalePressable
              onPress={handleShareImage}
              haptic="none"
              disabled={isExporting}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.pill,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share session card image"
            >
              {isExporting ? (
                <ActivityIndicator color={colors.textOnAccent} size="small" />
              ) : (
                <>
                  <Share2 size={18} color={colors.textOnAccent} />
                  <Text style={[type.control, { color: colors.textOnAccent, fontWeight: '700' }]}>
                    SHARE SESSION CARD
                  </Text>
                </>
              )}
            </ScalePressable>

            <ScalePressable
              onPress={handleShareText}
              haptic="none"
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.pill,
                  marginTop: space.xs,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share session as text"
            >
              <FileText size={18} color={colors.text} />
              <Text style={[type.control, { color: colors.text, fontWeight: '600' }]}>
                SHARE AS TEXT
              </Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCard: {
    width: 340,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  brandLogo: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  gymTitle: {
    fontSize: 26,
    lineHeight: 32,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  fallbackPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    minWidth: 38,
    alignItems: 'center',
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    minHeight: 48,
  },
});
