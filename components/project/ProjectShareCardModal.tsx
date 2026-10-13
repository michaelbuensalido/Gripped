import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Share,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ScalePressable } from '../ui/ScalePressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { X, Share2, Flame, Trophy, Sparkles, Check, AlertCircle, FileText } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import { formatBetaSummaryText } from '../../utils/betaLogic';
import type { Beta, BetaMove } from '../../types/beta';
import type { Project } from '../../types';

export interface ProjectShareCardModalProps {
  visible: boolean;
  project: Project & { attempts?: number };
  beta?: Beta | null;
  moves?: BetaMove[];
  onClose: () => void;
}

export function ProjectShareCardModal({
  visible,
  project,
  beta,
  moves = [],
  onClose,
}: ProjectShareCardModalProps) {
  const { colors, radius, space, type } = useTheme();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);

  // Beta is strictly excluded by default per spec: "beta is excluded unless the sender opts in"
  const [includeBeta, setIncludeBeta] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!visible) return null;

  const handleShare = async () => {
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
          dialogTitle: `Share ${project.title}`,
          mimeType: 'image/png',
          UTI: 'public.png',
        });
        triggerHaptic('success');
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    } catch (e) {
      setIsExporting(false);
      console.error('Share export failed:', e);
      Alert.alert('Export Failed', 'Unable to generate share card.');
    }
  };

  const handleShareText = async () => {
    try {
      triggerHaptic('medium');
      const summary = formatBetaSummaryText(
        project,
        includeBeta ? beta : null,
        includeBeta ? moves : [],
        [],
      );
      await Share.share({
        message: summary,
        title: `Gripped Beta: ${project.title}`,
      });
      triggerHaptic('success');
    } catch (e) {
      console.error('Share text failed:', e);
    }
  };

  const hasBetaContent = Boolean(beta && (beta.keyTip || moves.length > 0));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContainer,
            {
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
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close share card"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.text} />
            </ScalePressable>
            <Text style={[type.heading, { color: colors.text, fontSize: 16 }]}>
              Export Share Card
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Toggle Option: Include Beta (Default: OFF) */}
          {hasBetaContent && (
            <View
              style={[
                styles.optionRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  marginHorizontal: space.lg,
                  marginBottom: space.md,
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[type.label, { color: colors.text }]}>Include Beta Sequence</Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  {includeBeta ? 'Beta tips & moves will be shared' : 'Spoiler-free card (beta hidden)'}
                </Text>
              </View>
              <Switch
                value={includeBeta}
                onValueChange={(val) => {
                  triggerHaptic('selection');
                  setIncludeBeta(val);
                }}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.textOnAccent}
                accessibilityRole="switch"
                accessibilityLabel="Include beta in share card"
              />
            </View>
          )}

          {/* Scrollable Preview Area */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: space.md }}
          >
            {/* The Visual Share Card Component to Capture */}
            <View
              ref={cardRef}
              collapsable={false}
              style={[
                styles.shareCard,
                {
                  backgroundColor: '#0F0F14',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: 24,
                },
              ]}
            >
              {/* Card Header: CruxLog Branding */}
              <View style={styles.cardHeader}>
                <View style={styles.brandBadge}>
                  <Flame size={14} color="#8E7CFF" />
                  <Text style={styles.brandTitle}>CRUXLOG</Text>
                </View>
                <View style={styles.projectStatusPill}>
                  <Text style={styles.projectStatusText}>
                    {project.status === 'sent' ? 'SENT' : 'ACTIVE PROJECT'}
                  </Text>
                </View>
              </View>

              {/* Title & Grade Banner */}
              <View style={styles.cardTitleSection}>
                <Text style={styles.cardProjectTitle} numberOfLines={2}>
                  {project.title}
                </Text>
                <View style={styles.cardGradePill}>
                  <Text style={styles.cardGradeText}>{project.gradeRaw || 'V6'}</Text>
                </View>
              </View>

              {/* Meta details: Gym, Angle, Hold */}
              <View style={styles.cardMetaRow}>
                {project.gymName && (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{project.gymName}</Text>
                  </View>
                )}
                {project.wallAngle && (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>
                      {project.wallAngle.charAt(0).toUpperCase() + project.wallAngle.slice(1)}
                    </Text>
                  </View>
                )}
                {project.holdType && (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>
                      {project.holdType.charAt(0).toUpperCase() + project.holdType.slice(1)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Stats Bento Strip */}
              <View style={styles.cardStatsRow}>
                <View style={styles.cardStatBox}>
                  <Text style={styles.cardStatLabel}>TOTAL BURNS</Text>
                  <Text style={styles.cardStatValue}>{project.attempts || 0}</Text>
                </View>
                <View style={styles.cardStatBox}>
                  <Text style={styles.cardStatLabel}>HIGH WATER MARK</Text>
                  <Text style={styles.cardStatValue}>
                    {project.highWaterMarkMoves ? `${project.highWaterMarkMoves} moves` : '0 moves'}
                  </Text>
                </View>
              </View>

              {/* Optional Beta Details (Included strictly only when sender opted in) */}
              {includeBeta && hasBetaContent && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  style={styles.cardBetaSection}
                >
                  <View style={styles.cardBetaHeader}>
                    <Sparkles size={13} color="#8E7CFF" />
                    <Text style={styles.cardBetaTitle}>
                      BETA {beta?.label ? `• ${beta.label}` : ''}
                    </Text>
                  </View>

                  {/* Key Tip */}
                  {beta?.keyTip && (
                    <View style={styles.cardKeyTipBox}>
                      <Text style={styles.cardKeyTipLabel}>KEY TIP</Text>
                      <Text style={styles.cardKeyTipText}>{beta.keyTip}</Text>
                    </View>
                  )}

                  {/* Moves List with Crux indicator */}
                  {moves.length > 0 && (
                    <View style={styles.cardMovesList}>
                      {moves.slice(0, 8).map((m, idx) => {
                        const isCrux = m.id === beta?.cruxMoveId;
                        return (
                          <View
                            key={m.id}
                            style={[
                              styles.cardMoveRow,
                              isCrux && styles.cardMoveRowCrux,
                            ]}
                          >
                            <View style={styles.moveIndexBadge}>
                              <Text style={styles.moveIndexText}>{idx + 1}</Text>
                            </View>
                            {m.limb && (
                              <View style={styles.moveLimbBadge}>
                                <Text style={styles.moveLimbText}>{m.limb}</Text>
                              </View>
                            )}
                            <Text style={styles.moveDescText} numberOfLines={1}>
                              {m.text}
                            </Text>
                            {isCrux && (
                              <View style={styles.cruxBadge}>
                                <Text style={styles.cruxBadgeText}>CRUX</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </Animated.View>
              )}

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterDate}>
                  CruxLog • Track every burn offline
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Button: Share Card via system share sheet */}
          <View style={{ paddingHorizontal: space.lg, marginTop: space.sm }}>
            <ScalePressable
              onPress={handleShare}
              haptic="none"
              disabled={isExporting}
              style={[
                styles.shareActionBtn,
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.pill,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share project card"
            >
              {isExporting ? (
                <ActivityIndicator color={colors.textOnAccent} size="small" />
              ) : (
                <>
                  <Share2 size={18} color={colors.textOnAccent} />
                  <Text style={[type.control, { color: colors.textOnAccent, fontWeight: '700' }]}>
                    SHARE CARD
                  </Text>
                </>
              )}
            </ScalePressable>

            <ScalePressable
              onPress={handleShareText}
              haptic="none"
              style={[
                styles.shareActionBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.pill,
                  marginTop: space.xs,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share beta as text summary"
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#111116',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
  },
  shareCard: {
    width: 340,
    padding: 22,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
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
    backgroundColor: 'rgba(142, 124, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.3)',
  },
  brandTitle: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  projectStatusPill: {
    backgroundColor: 'rgba(110, 231, 86, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 86, 0.3)',
  },
  projectStatusText: {
    color: '#6EE756',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  cardProjectTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.4,
  },
  cardGradePill: {
    backgroundColor: '#19191D',
    borderWidth: 1.5,
    borderColor: '#6EE756',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cardGradeText: {
    color: '#6EE756',
    fontSize: 15,
    fontWeight: '800',
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  metaChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaChipText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  cardStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  cardStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardStatLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  cardStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  cardBetaSection: {
    backgroundColor: 'rgba(142, 124, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.25)',
    marginBottom: 16,
    gap: 10,
  },
  cardBetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardBetaTitle: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardKeyTipBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardKeyTipLabel: {
    color: '#8E7CFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardKeyTipText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },
  cardMovesList: {
    gap: 6,
  },
  cardMoveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 6,
    borderRadius: 8,
  },
  cardMoveRowCrux: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  moveIndexBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveIndexText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  moveLimbBadge: {
    backgroundColor: '#8E7CFF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  moveLimbText: {
    color: '#0A0A0C',
    fontSize: 9,
    fontWeight: '800',
  },
  moveDescText: {
    color: '#FFFFFF',
    fontSize: 11,
    flex: 1,
  },
  cruxBadge: {
    backgroundColor: '#FF453A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cruxBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardFooterDate: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    minHeight: 48,
  },
});
