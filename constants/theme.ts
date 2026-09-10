import { ViewStyle } from 'react-native';

/**
 * Exact color palette & typography tokens matching reference mockups:
 * - Background Mat: Dark speckled charcoal (#141416 base with chalk speckles)
 * - Elevated Card Surfaces: #1E1E24 (range #1C1C20 to #222227)
 * - Card Border / Edge Stroke: 1px solid #2D2D35 (or rgba(255, 255, 255, 0.08))
 * - Lime / Flash Green: #6EE756 (Flash status, badges, sparklines)
 * - Pastel Purple / Lavender: #8E7CFF (Top, active tab, primary buttons)
 * - Soft Cream / Attempt: #E8DEB5
 * - Muted Charcoal / Fail: #55555D
 * - Sub-labels: #7A7A88 (uppercase tracking, font size 11-12)
 */
export const THEME_COLORS = {
  bgMat: '#141416',
  cardSurface: '#1E1E24',
  cardSurfaceAlt: '#222227',
  cardBorder: '#2D2D35',
  cardBorderSubtle: 'rgba(255, 255, 255, 0.08)',
  flashGreen: '#6EE756',
  lavender: '#8E7CFF',
  softCream: '#E8DEB5',
  mutedFail: '#55555D',
  sublabelGray: '#7A7A88',
  white: '#FFFFFF',
};

export const FLOATING_CARD_STYLE: ViewStyle = {
  backgroundColor: '#1E1E24',
  borderColor: '#2D2D35',
  borderWidth: 1,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  elevation: 5,
};

export const FLOATING_ISLAND_STYLE: ViewStyle = {
  backgroundColor: 'rgba(22, 22, 28, 0.92)',
  borderColor: '#2D2D35',
  borderWidth: 1,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.45,
  shadowRadius: 12,
  elevation: 8,
};
