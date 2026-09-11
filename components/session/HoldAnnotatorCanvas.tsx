import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Polyline, Line, Circle, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  Sparkles,
  RotateCcw,
  Trash2,
  Check,
  X,
  Palette,
  Flag,
  Compass,
  Target,
  Zap,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';
import {
  HoldMarker,
  HoldType,
  RouteAnnotationPayload,
  calculateDistancesBetweenPoints,
  spanToEstimatedCm,
} from '../../services/gradeEstimator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Color Preset Definitions for Gym Routes ──────────────────────────────────
export interface RouteColorOption {
  id: string;
  name: string;
  hex: string;
  badgeBg: string;
}

export const ROUTE_COLORS: RouteColorOption[] = [
  { id: 'purple', name: 'Purple', hex: '#8E7CFF', badgeBg: 'rgba(142, 124, 255, 0.2)' },
  { id: 'lime', name: 'Lime', hex: '#6EE756', badgeBg: 'rgba(110, 231, 86, 0.2)' },
  { id: 'yellow', name: 'Yellow', hex: '#FACC15', badgeBg: 'rgba(250, 204, 21, 0.2)' },
  { id: 'pink', name: 'Pink', hex: '#EC4899', badgeBg: 'rgba(236, 72, 153, 0.2)' },
  { id: 'blue', name: 'Blue', hex: '#38BDF8', badgeBg: 'rgba(56, 189, 248, 0.2)' },
  { id: 'orange', name: 'Orange', hex: '#FB923C', badgeBg: 'rgba(251, 146, 60, 0.2)' },
  { id: 'red', name: 'Red', hex: '#EF4444', badgeBg: 'rgba(239, 68, 68, 0.2)' },
  { id: 'white', name: 'White', hex: '#F8FAFC', badgeBg: 'rgba(248, 250, 252, 0.2)' },
  { id: 'black', name: 'Black', hex: '#27272A', badgeBg: 'rgba(39, 39, 42, 0.4)' },
];

export interface HoldAnnotatorCanvasProps {
  imageUri: string;
  wallAngleDegrees?: number;
  onAnalyze: (payload: RouteAnnotationPayload) => void;
  onClose: () => void;
}

export function HoldAnnotatorCanvas({
  imageUri,
  wallAngleDegrees = 25,
  onAnalyze,
  onClose,
}: HoldAnnotatorCanvasProps) {
  // Canvas State
  const [markers, setMarkers] = useState<HoldMarker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<RouteColorOption | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [canvasLayout, setCanvasLayout] = useState<{ width: number; height: number }>({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
  });

  // Pan & Zoom gesture shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ── Derived Distance Calculations ─────────────────────────────────────────
  const spans = useMemo(() => calculateDistancesBetweenPoints(markers), [markers]);
  const maxSpan = useMemo(() => (spans.length > 0 ? Math.max(...spans) : 0), [spans]);
  const avgSpan = useMemo(
    () => (spans.length > 0 ? spans.reduce((a, b) => a + b, 0) / spans.length : 0),
    [spans]
  );
  const maxSpanCm = useMemo(() => spanToEstimatedCm(maxSpan), [maxSpan]);

  // ── Tap to Place or Select Hold Marker ─────────────────────────────────────
  const handleCanvasTap = useCallback(
    (touchX: number, touchY: number) => {
      const { width, height } = canvasLayout;
      if (width <= 0 || height <= 0) return;

      // Adjust for current scale and translation
      const normalizedX = Math.max(0.02, Math.min(0.98, touchX / width));
      const normalizedY = Math.max(0.02, Math.min(0.98, touchY / height));

      // Check if user tapped near an existing marker (within ~32pt radius)
      const hitRadiusNormalized = 32 / Math.min(width, height);
      const existingIndex = markers.findIndex((m) => {
        const dx = m.x - normalizedX;
        const dy = m.y - normalizedY;
        return Math.sqrt(dx * dx + dy * dy) < hitRadiusNormalized;
      });

      if (existingIndex !== -1) {
        // Tapped an existing marker -> Select it
        triggerHaptic('light');
        setSelectedMarkerId(markers[existingIndex].id);
        return;
      }

      // If user had a marker selected, tapping empty canvas unselects it
      if (selectedMarkerId) {
        setSelectedMarkerId(null);
        return;
      }

      // Auto-assign hold role based on sequence
      triggerHaptic('medium');
      let type: HoldType = 'hand';
      let label: string | undefined;

      if (markers.length === 0) {
        // First marker is automatically the Start Hold
        type = 'start';
        label = 'START';
      } else {
        label = `#${markers.length + 1}`;
      }

      const newMarker: HoldMarker = {
        id: `hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        x: normalizedX,
        y: normalizedY,
        type,
        order: markers.length + 1,
        label,
        color: selectedColor ? selectedColor.hex : undefined,
      };

      setMarkers((prev) => [...prev, newMarker]);
    },
    [canvasLayout, markers, selectedMarkerId, selectedColor]
  );

  // ── Gesture Definitions (Pinch, Pan, Tap) ─────────────────────────────────
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      runOnJS(handleCanvasTap)(e.x, e.y);
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.9, Math.min(3.5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value < 1.0) {
        scale.value = withSpring(1.0);
        savedScale.value = 1.0;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .minDistance(12)
    .onUpdate((e) => {
      if (savedScale.value > 1.05) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Exclusive(pinchGesture, panGesture, tapGesture);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ── Marker Role Controls ──────────────────────────────────────────────────
  const updateMarkerType = (markerId: string, newType: HoldType) => {
    triggerHaptic('selection');
    setMarkers((prev) =>
      prev.map((m) => {
        if (m.id !== markerId) return m;
        let label = `#${m.order}`;
        if (newType === 'start') label = 'START';
        if (newType === 'top') label = 'TOP';
        if (newType === 'crux') label = 'CRUX';
        return { ...m, type: newType, label };
      })
    );
    setSelectedMarkerId(null);
  };

  const removeMarker = (markerId: string) => {
    triggerHaptic('warning');
    setMarkers((prev) => {
      const filtered = prev.filter((m) => m.id !== markerId);
      // Re-index orders
      return filtered.map((m, idx) => ({
        ...m,
        order: idx + 1,
        label:
          m.type === 'start'
            ? 'START'
            : m.type === 'top'
            ? 'TOP'
            : m.type === 'crux'
            ? 'CRUX'
            : `#${idx + 1}`,
      }));
    });
    setSelectedMarkerId(null);
  };

  const handleUndo = () => {
    if (markers.length === 0) return;
    triggerHaptic('light');
    setMarkers((prev) => prev.slice(0, prev.length - 1));
    setSelectedMarkerId(null);
  };

  const handleClear = () => {
    if (markers.length === 0) return;
    triggerHaptic('warning');
    setMarkers([]);
    setSelectedMarkerId(null);
  };

  // ── Color Isolation Simulator ─────────────────────────────────────────────
  const handleSelectRouteColor = (color: RouteColorOption) => {
    triggerHaptic('medium');
    setSelectedColor(color);
    setIsColorPickerOpen(false);

    // If no markers yet, auto-cluster an initial 5-hold progression matching the color!
    if (markers.length === 0) {
      const clusterHolds: HoldMarker[] = [
        {
          id: 'auto_1',
          x: 0.42,
          y: 0.82,
          type: 'start',
          order: 1,
          label: 'START',
          color: color.hex,
        },
        {
          id: 'auto_2',
          x: 0.54,
          y: 0.68,
          type: 'hand',
          order: 2,
          label: '#2',
          color: color.hex,
        },
        {
          id: 'auto_3',
          x: 0.38,
          y: 0.52,
          type: 'crux',
          order: 3,
          label: 'CRUX',
          color: color.hex,
        },
        {
          id: 'auto_4',
          x: 0.58,
          y: 0.36,
          type: 'hand',
          order: 4,
          label: '#4',
          color: color.hex,
        },
        {
          id: 'auto_5',
          x: 0.5,
          y: 0.2,
          type: 'top',
          order: 5,
          label: 'TOP',
          color: color.hex,
        },
      ];
      setMarkers(clusterHolds);
    } else {
      // Update color on existing markers
      setMarkers((prev) => prev.map((m) => ({ ...m, color: color.hex })));
    }
  };

  // ── Assemble & Send Payload to AI Set Grader ──────────────────────────────
  const handleProceedToAnalysis = () => {
    triggerHaptic('success');
    const startPoint = markers.find((m) => m.type === 'start') || markers[0];
    const topPoint =
      markers.find((m) => m.type === 'top') || markers[markers.length - 1];

    const payload: RouteAnnotationPayload = {
      wallAngleDegrees,
      holdCount: markers.length,
      estimatedSpans: spans,
      maxSpan,
      averageSpan: avgSpan,
      startPoint,
      topPoint,
      markers,
      routeColor: selectedColor?.name,
      imageUri,
    };

    onAnalyze(payload);
  };

  // Selected marker object
  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);

  return (
    <View style={styles.container}>
      {/* ── Top Floating Navigation & Actions ────────────────────────────── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerIconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBadge}>
          <Target size={13} color="#8E7CFF" style={{ marginRight: 5 }} />
          <Text style={styles.headerTitleText}>ROUTE ISOLATION</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{markers.length} HOLDS</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={handleUndo}
            style={[styles.headerIconButton, markers.length === 0 && styles.disabledBtn]}
            activeOpacity={0.7}
            disabled={markers.length === 0}
          >
            <RotateCcw size={16} color={markers.length > 0 ? '#FFFFFF' : '#555562'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClear}
            style={[styles.headerIconButton, markers.length === 0 && styles.disabledBtn]}
            activeOpacity={0.7}
            disabled={markers.length === 0}
          >
            <Trash2 size={16} color={markers.length > 0 ? '#FF5C5C' : '#555562'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Interactive Viewport Canvas ─────────────────────────────────── */}
      <View
        style={styles.canvasContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setCanvasLayout({ width, height });
          }
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.canvasWrapper, animatedImageStyle]}>
            <Image
              source={{ uri: imageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />

            {/* Connecting Polyline Layer */}
            {markers.length > 1 && (
              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  <LinearGradient id="routeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <Stop offset="0%" stopColor="#6EE756" stopOpacity="0.8" />
                    <Stop offset="50%" stopColor="#8E7CFF" stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#6EE756" stopOpacity="0.9" />
                  </LinearGradient>
                </Defs>

                {/* Draw sequential route segments */}
                {markers.map((marker, i) => {
                  if (i === 0) return null;
                  const prev = markers[i - 1];
                  const x1 = prev.x * canvasLayout.width;
                  const y1 = prev.y * canvasLayout.height;
                  const x2 = marker.x * canvasLayout.width;
                  const y2 = marker.y * canvasLayout.height;

                  return (
                    <Line
                      key={`line_${prev.id}_${marker.id}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="url(#routeGradient)"
                      strokeWidth="2.8"
                      strokeDasharray="5, 4"
                    />
                  );
                })}
              </Svg>
            )}

            {/* Hold Marker Rings */}
            {markers.map((m) => {
              const posX = m.x * canvasLayout.width - 20;
              const posY = m.y * canvasLayout.height - 20;
              const isSelected = m.id === selectedMarkerId;

              const markerThemeColor =
                m.type === 'start'
                  ? '#6EE756'
                  : m.type === 'top'
                  ? '#6EE756'
                  : m.type === 'crux'
                  ? '#FF5C5C'
                  : m.color || '#8E7CFF';

              return (
                <View
                  key={m.id}
                  style={[
                    styles.markerRing,
                    {
                      left: posX,
                      top: posY,
                      borderColor: markerThemeColor,
                      backgroundColor:
                        m.type === 'start'
                          ? 'rgba(110, 231, 86, 0.28)'
                          : m.type === 'top'
                          ? 'rgba(110, 231, 86, 0.35)'
                          : m.type === 'crux'
                          ? 'rgba(255, 92, 92, 0.35)'
                          : 'rgba(142, 124, 255, 0.28)',
                      shadowColor: markerThemeColor,
                    },
                    isSelected && styles.markerRingSelected,
                    m.type === 'top' && styles.markerRingTop,
                  ]}
                >
                  <Text
                    style={[
                      styles.markerLabel,
                      {
                        color:
                          m.type === 'start' || m.type === 'top'
                            ? '#6EE756'
                            : m.type === 'crux'
                            ? '#FF5C5C'
                            : '#FFFFFF',
                      },
                    ]}
                  >
                    {m.type === 'start'
                      ? 'S'
                      : m.type === 'top'
                      ? 'TOP'
                      : m.type === 'crux'
                      ? 'CRX'
                      : m.order}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        </GestureDetector>

        {/* Selected Marker Quick-Edit Context Bar */}
        {selectedMarker && (
          <View style={styles.selectedMarkerBar}>
            <Text style={styles.selectedMarkerTitle}>
              Hold #{selectedMarker.order} • {selectedMarker.type.toUpperCase()}
            </Text>
            <View style={styles.roleButtonRow}>
              <TouchableOpacity
                onPress={() => updateMarkerType(selectedMarker.id, 'start')}
                style={[
                  styles.roleChip,
                  selectedMarker.type === 'start' && styles.roleChipActiveStart,
                ]}
                activeOpacity={0.75}
              >
                <Text style={styles.roleChipText}>Start</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateMarkerType(selectedMarker.id, 'hand')}
                style={[
                  styles.roleChip,
                  selectedMarker.type === 'hand' && styles.roleChipActiveHand,
                ]}
                activeOpacity={0.75}
              >
                <Text style={styles.roleChipText}>Hand</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateMarkerType(selectedMarker.id, 'crux')}
                style={[
                  styles.roleChip,
                  selectedMarker.type === 'crux' && styles.roleChipActiveCrux,
                ]}
                activeOpacity={0.75}
              >
                <Zap size={11} color="#FF5C5C" style={{ marginRight: 3 }} />
                <Text style={[styles.roleChipText, { color: '#FF5C5C' }]}>Crux</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateMarkerType(selectedMarker.id, 'top')}
                style={[
                  styles.roleChip,
                  selectedMarker.type === 'top' && styles.roleChipActiveTop,
                ]}
                activeOpacity={0.75}
              >
                <Flag size={11} color="#6EE756" style={{ marginRight: 3 }} />
                <Text style={[styles.roleChipText, { color: '#6EE756' }]}>Top</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => removeMarker(selectedMarker.id)}
                style={styles.deleteRoleChip}
                activeOpacity={0.75}
              >
                <Trash2 size={13} color="#FF5C5C" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Guidance Instruction Pill when no holds placed */}
        {markers.length === 0 && (
          <View style={styles.hintBanner} pointerEvents="none">
            <Info size={14} color="#8E7CFF" style={{ marginRight: 6 }} />
            <Text style={styles.hintText}>
              Tap holds on wall to tag • 1st tap is Start • Pinch to zoom
            </Text>
          </View>
        )}
      </View>

      {/* ── Route Color Quick Picker Sheet / Bar ────────────────────────── */}
      {isColorPickerOpen && (
        <View style={styles.colorPickerContainer}>
          <View style={styles.colorPickerHeader}>
            <Text style={styles.colorPickerTitle}>SELECT ROUTE HOLD COLOR</Text>
            <TouchableOpacity onPress={() => setIsColorPickerOpen(false)}>
              <ChevronDown size={18} color="#9A9AA6" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorRow}
          >
            {ROUTE_COLORS.map((c) => {
              const isChosen = selectedColor?.id === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => handleSelectRouteColor(c)}
                  style={[
                    styles.colorChip,
                    { backgroundColor: c.badgeBg, borderColor: c.hex },
                    isChosen && styles.colorChipSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                  <Text style={[styles.colorChipText, { color: c.hex }]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Bottom Control Bar & AI Grader CTA ──────────────────────────── */}
      <View style={styles.bottomFooter}>
        {/* Left: Color Isolation Mode Trigger */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setIsColorPickerOpen((prev) => !prev);
          }}
          style={[
            styles.colorTriggerBtn,
            selectedColor && {
              borderColor: selectedColor.hex,
              backgroundColor: selectedColor.badgeBg,
            },
          ]}
          activeOpacity={0.8}
        >
          <Palette
            size={16}
            color={selectedColor ? selectedColor.hex : '#8E7CFF'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.colorTriggerText,
              selectedColor && { color: selectedColor.hex },
            ]}
          >
            {selectedColor ? selectedColor.name : 'Route Color'}
          </Text>
        </TouchableOpacity>

        {/* Center: Live Telemetry readout */}
        {markers.length > 1 && (
          <View style={styles.telemetryPill}>
            <Text style={styles.telemetryText}>
              Max: ~{maxSpanCm}cm {maxSpan >= 0.22 ? '⚡ Dyno' : ''}
            </Text>
          </View>
        )}

        {/* Right: Analyze Route CTA */}
        <TouchableOpacity
          onPress={handleProceedToAnalysis}
          style={[
            styles.analyzeCtaBtn,
            markers.length === 0 && styles.analyzeCtaBtnDisabled,
          ]}
          activeOpacity={0.85}
          disabled={markers.length === 0}
        >
          <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.analyzeCtaText}>
            {markers.length === 0
              ? 'Tag Holds First'
              : `Analyze Route (${markers.length})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: 12,
    backgroundColor: '#131316',
    borderBottomWidth: 1,
    borderColor: '#2C2C35',
    zIndex: 20,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  headerTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 124, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerTitleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#8E7CFF',
    marginRight: 6,
  },
  countBadge: {
    backgroundColor: '#8E7CFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  canvasWrapper: {
    width: '100%',
    height: '100%',
  },
  markerRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  markerRingSelected: {
    transform: [{ scale: 1.25 }],
    borderWidth: 3.5,
  },
  markerRingTop: {
    borderStyle: 'dashed',
    borderWidth: 3.5,
  },
  markerLabel: {
    fontSize: 11,
    fontWeight: '900',
  },
  hintBanner: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 19, 22, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  hintText: {
    color: '#E0E0E8',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedMarkerBar: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  selectedMarkerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#9A9AA6',
    marginBottom: 8,
  },
  roleButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleChipActiveStart: {
    backgroundColor: 'rgba(110, 231, 86, 0.2)',
    borderColor: '#6EE756',
  },
  roleChipActiveHand: {
    backgroundColor: 'rgba(142, 124, 255, 0.2)',
    borderColor: '#8E7CFF',
  },
  roleChipActiveCrux: {
    backgroundColor: 'rgba(255, 92, 92, 0.2)',
    borderColor: '#FF5C5C',
  },
  roleChipActiveTop: {
    backgroundColor: 'rgba(110, 231, 86, 0.2)',
    borderColor: '#6EE756',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteRoleChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  colorPickerContainer: {
    backgroundColor: '#1E1E24',
    borderTopWidth: 1,
    borderColor: '#2C2C35',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorPickerTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#8A8A98',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  colorChipSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  colorChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#131316',
    borderTopWidth: 1,
    borderColor: '#2C2C35',
    gap: 10,
  },
  colorTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.25)',
  },
  colorTriggerText: {
    color: '#8E7CFF',
    fontSize: 13,
    fontWeight: '700',
  },
  telemetryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  telemetryText: {
    color: '#A0A0B0',
    fontSize: 11,
    fontWeight: '600',
  },
  analyzeCtaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 14,
    backgroundColor: '#8E7CFF',
    shadowColor: '#8E7CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  analyzeCtaBtnDisabled: {
    backgroundColor: '#2A2A35',
    shadowOpacity: 0,
  },
  analyzeCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
