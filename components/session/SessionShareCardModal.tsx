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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { FileText, Share2, Trophy, X, Zap } from 'lucide-react-native';
import { ScalePressable } from '../ui/ScalePressable';
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
  topClimbs?: Array<{ gradeRaw: string; result: string }>;
  onClose: () => void;
}

export function SessionShareCardModal({
  visible,
  gymName,
  subtitleText,
  climbsCount,
  sendsCount,
  flashesCount,
  hardestGradeRaw,
  topClimbs = [],
  onClose,
}: SessionShareCardModalProps) {
  const { colors, radius, space, type } = useTheme();
  const { formatGradeLabel } = usePreferences();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!visible) return null;

  const sendRate = climbsCount > 0 ? Math.round((sendsCount / climbsCount) * 100) : 0;
  const formattedHardest =
    hardestGradeRaw && hardestGradeRaw !== '–' ? formatGradeLabel(hardestGradeRaw) : '–';

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    try {
      triggerHaptic('medium');
      setIsExporting(true);
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 0.95,
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
              backgroundColor: colors.bg,
              borderTopWidth: 1,
              borderColor: colors.border,
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
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close share modal"
            >
              <X size={20} color={colors.text} />
            </ScalePressable>
            <Text style={[type.heading, { color: colors.text, fontSize: 16 }]}>
              Share Session Card
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: space.md }}
          >
            {/* Share Card View to Capture */}
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
              {/* Brand Row */}
              <View style={styles.cardHeader}>
                <View style={styles.brandBadge}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={{ width: 16, height: 16, borderRadius: 4 }}
                    resizeMode="cover"
                  />
                  <Text style={styles.brandTitle}>GRIPPED</Text>
                </View>
                <View style={styles.sendRatePill}>
                  <Text style={styles.sendRateText}>{sendRate}% SEND RATE</Text>
                </View>
              </View>

              {/* Gym & Subtitle */}
              <View style={{ marginBottom: 18 }}>
                <Text style={styles.gymTitle} numberOfLines={2}>
                  {gymName || 'Bouldering Session'}
                </Text>
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {subtitleText}
                </Text>
              </View>

              {/* Hero Peak Grade & Volume Row */}
              <View style={styles.heroRow}>
                <View style={styles.heroMetricBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Trophy size={14} color={colors.flash} />
                    <Text style={styles.statLabel}>PEAK SEND</Text>
                  </View>
                  <Text style={[styles.heroGradeValue, { color: colors.flash }]}>
                    {formattedHardest}
                  </Text>
                </View>

                <View style={styles.heroMetricBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Zap size={14} color={colors.attempt} />
                    <Text style={styles.statLabel}>FLASHES</Text>
                  </View>
                  <Text style={[styles.heroGradeValue, { color: colors.textWhitePrimary }]}>
                    {flashesCount}
                  </Text>
                </View>
              </View>

              {/* 3-Tile Stats Strip */}
              <View style={styles.statsStrip}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>CLIMBS</Text>
                  <Text style={styles.statValue}>{climbsCount}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>SENDS</Text>
                  <Text style={styles.statValue}>{sendsCount}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>ATTEMPTS</Text>
                  <Text style={styles.statValue}>{Math.max(0, climbsCount - sendsCount)}</Text>
                </View>
              </View>

              {/* Top Climbs Strip */}
              {topClimbs.length > 0 && (
                <View style={styles.topClimbsBox}>
                  <Text style={styles.statLabel}>HIGHLIGHT LOGS</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {topClimbs.slice(0, 6).map((c, i) => {
                      const isFlash = c.result === 'flash';
                      return (
                        <View
                          key={i}
                          style={[
                            styles.climbBadge,
                            {
                              borderColor: isFlash
                                ? 'rgba(16, 185, 129, 0.45)'
                                : 'rgba(139, 92, 246, 0.45)',
                              backgroundColor: isFlash
                                ? 'rgba(16, 185, 129, 0.14)'
                                : 'rgba(139, 92, 246, 0.14)',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: colors.textWhitePrimary,
                              fontSize: 11,
                              fontWeight: '800',
                            }}
                          >
                            {formatGradeLabel(c.gradeRaw)} {isFlash ? '⚡' : '✓'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>Gripped • Track every burn offline</Text>
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
    padding: 22,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  brandTitle: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sendRatePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  sendRateText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gymTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  heroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  heroMetricBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroGradeValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  topClimbsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  climbBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    letterSpacing: 0.5,
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
