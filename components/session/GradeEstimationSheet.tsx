import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import {
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Compass,
} from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import { GRADES, GRADE_BY_LABEL } from '../../constants/grades';
import {
  estimateRouteGrade,
  getWallAngleCategory,
} from '../../services/gradeEstimator';

interface GradeEstimationSheetProps {
  visible: boolean;
  angleDegrees: number;
  userMedianGrade?: string;
  initialPickerOpen?: boolean;
  onAccept: (grade: string, notes: string) => void;
  onRetake: () => void;
  onClose: () => void;
}

export function GradeEstimationSheet({
  visible,
  angleDegrees,
  userMedianGrade = 'V4',
  initialPickerOpen = false,
  onAccept,
  onRetake,
  onClose,
}: GradeEstimationSheetProps) {
  const estimation = useMemo(
    () => estimateRouteGrade({ angleDegrees, userMedianGrade }),
    [angleDegrees, userMedianGrade]
  );

  const [selectedGrade, setSelectedGrade] = useState<string>(estimation.estimatedGrade);
  const [pickerOpen, setPickerOpen] = useState(initialPickerOpen);

  useEffect(() => {
    if (initialPickerOpen !== undefined) {
      setPickerOpen(initialPickerOpen);
    }
  }, [initialPickerOpen]);

  // Sync selected grade with estimation when opened or angle changes
  useEffect(() => {
    setSelectedGrade(estimation.estimatedGrade);
  }, [estimation.estimatedGrade]);

  const wallInfo = getWallAngleCategory(angleDegrees);

  const handleGradeSelect = (gradeLabel: string) => {
    triggerHaptic('selection');
    setSelectedGrade(gradeLabel);
  };

  const handleConfirm = () => {
    triggerHaptic('success');
    const noteText = `Wall: ${wallInfo.angleDegrees}° ${wallInfo.category} • Estimated: ${estimation.estimatedGrade}`;
    onAccept(selectedGrade, noteText);
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          {/* Top Grabber */}
          <View style={styles.grabber} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Sparkles size={14} color="#8E7CFF" style={{ marginRight: 6 }} />
              <Text style={styles.headerTitle}>ROUTE ANALYSIS</Text>
            </View>

            <View style={styles.angleBadge}>
              <Compass size={12} color="#8E7CFF" style={{ marginRight: 4 }} />
              <Text style={styles.angleBadgeText}>{wallInfo.shortBadge}</Text>
            </View>
          </View>

          {/* Grade Prediction Card */}
          <View style={styles.predictionCard}>
            <View style={styles.badgeWrapper}>
              <View style={styles.gradeHeroBadge}>
                <Text style={styles.gradeHeroText}>{selectedGrade}</Text>
              </View>
            </View>

            <Text style={styles.confidenceText}>
              {estimation.confidenceDescription}
            </Text>

            {/* Hold Profile Tags */}
            <View style={styles.tagsRow}>
              {estimation.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Manual Override Accordion */}
          <View style={styles.overrideSection}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setPickerOpen((prev) => !prev);
              }}
              style={styles.adjustToggle}
              activeOpacity={0.7}
            >
              <Text style={styles.adjustToggleText}>
                {pickerOpen ? 'Hide Grade Picker' : 'Adjust Grade'}
              </Text>
              {pickerOpen ? (
                <ChevronUp size={16} color="#8E7CFF" />
              ) : (
                <ChevronDown size={16} color="#8E7CFF" />
              )}
            </TouchableOpacity>

            {pickerOpen && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gradeScrollList}
              >
                {GRADES.map((g) => {
                  const isSelected = g.label === selectedGrade;
                  return (
                    <TouchableOpacity
                      key={g.label}
                      onPress={() => handleGradeSelect(g.label)}
                      style={[
                        styles.gradePill,
                        isSelected && styles.gradePillSelected,
                        { borderColor: isSelected ? '#8E7CFF' : '#2C2C35' },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.gradePillText,
                          isSelected && styles.gradePillTextSelected,
                        ]}
                      >
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Bottom Action Stack */}
          <View style={styles.actionStack}>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.primaryAcceptBtn}
              activeOpacity={0.85}
            >
              <Check size={18} color="#FFFFFF" strokeWidth={3} style={{ marginRight: 8 }} />
              <Text style={styles.primaryAcceptText}>
                Accept {selectedGrade} & Log Burn
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onRetake();
              }}
              style={styles.retakeBtn}
              activeOpacity={0.75}
            >
              <RotateCcw size={15} color="#9A9AA6" style={{ marginRight: 6 }} />
              <Text style={styles.retakeText}>Retake Media</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#2C2C35',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#383842',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#8A8A98',
  },
  angleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 124, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.28)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  angleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E7CFF',
  },
  predictionCard: {
    backgroundColor: '#16161B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C35',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeWrapper: {
    marginBottom: 8,
  },
  gradeHeroBadge: {
    backgroundColor: '#6EE756',
    borderRadius: 20,
    paddingHorizontal: 26,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6EE756',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradeHeroText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111115',
    letterSpacing: -0.5,
  },
  confidenceText: {
    fontSize: 12,
    color: '#9A9AA6',
    textAlign: 'center',
    marginBottom: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  tagChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E0E0E8',
  },
  overrideSection: {
    marginBottom: 14,
  },
  adjustToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  adjustToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E7CFF',
  },
  gradeScrollList: {
    paddingVertical: 8,
    gap: 8,
    paddingHorizontal: 4,
  },
  gradePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 46,
    alignItems: 'center',
  },
  gradePillSelected: {
    backgroundColor: '#8E7CFF',
  },
  gradePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8A8A98',
  },
  gradePillTextSelected: {
    color: '#FFFFFF',
  },
  actionStack: {
    gap: 10,
  },
  primaryAcceptBtn: {
    height: 50,
    backgroundColor: '#8E7CFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8E7CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  primaryAcceptText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  retakeBtn: {
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9A9AA6',
  },
});
