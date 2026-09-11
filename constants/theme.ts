import { ViewStyle, TextStyle } from 'react-native';

/**
 * Antigravity Neo-Tactile Dark Mode Design Tokens
 * 1:1 System standard aligned with Home and Progress reference screens.
 */
export const THEME_COLORS = {
  // Background & Surfaces
  bgMat: '#131316',
  cardSurface: 'rgba(30, 30, 36, 0.68)',
  cardSurfaceHero: 'rgba(32, 32, 40, 0.75)',
  cardSurfaceAlt: 'rgba(36, 36, 44, 0.65)',
  cardBorder: 'rgba(255, 255, 255, 0.09)',
  cardBorderSubtle: 'rgba(255, 255, 255, 0.05)',

  // Brand & Accent
  lavender: '#8E7CFF',
  brandAccent: '#8E7CFF',

  // Outcomes & Status
  flashGreen: '#6EE756',
  softCream: '#E8DEB5',
  mutedFail: '#484852',
  error: '#EF4444',

  // Typography & Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9AA6',
  sectionHeader: '#8A8A98',
  textDark: '#111115',
  white: '#FFFFFF',

  // Backward compatibility alias
  sublabelGray: '#8A8A98',
};

/** Standard Floating Card anatomy: Glassy translucent card with subtle light-catching border */
export const FLOATING_CARD_STYLE: ViewStyle = {
  backgroundColor: 'rgba(30, 30, 36, 0.68)',
  borderColor: 'rgba(255, 255, 255, 0.09)',
  borderTopColor: 'rgba(255, 255, 255, 0.16)',
  borderWidth: 1,
  borderRadius: 20,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  elevation: 5,
};

/** Elevated Hero Card anatomy: Glassy translucent hero card with top highlight */
export const FLOATING_CARD_HERO_STYLE: ViewStyle = {
  backgroundColor: 'rgba(32, 32, 40, 0.75)',
  borderColor: 'rgba(255, 255, 255, 0.10)',
  borderTopColor: 'rgba(255, 255, 255, 0.20)',
  borderWidth: 1,
  borderRadius: 24,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.45,
  shadowRadius: 12,
  elevation: 6,
};

/** Floating Island for navigation capsule */
export const FLOATING_ISLAND_STYLE: ViewStyle = {
  backgroundColor: 'rgba(22, 22, 28, 0.92)',
  borderColor: '#2C2C35',
  borderWidth: 1,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.45,
  shadowRadius: 12,
  elevation: 8,
};

/** Grade Badge Pill: Solid Lime Green #6EE756 with dark bold #111115 text */
export const GRADE_BADGE_CONTAINER_STYLE: ViewStyle = {
  backgroundColor: '#6EE756',
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 3.5,
  alignSelf: 'flex-start',
  shadowColor: '#6EE756',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.35,
  shadowRadius: 6,
  elevation: 3,
};

export const GRADE_BADGE_TEXT_STYLE: TextStyle = {
  color: '#111115',
  fontSize: 13,
  fontWeight: '700',
  letterSpacing: 0.5,
};

/** Primary Action Button Style: 50-52pt height, Lavender #8E7CFF, bold white */
export const PRIMARY_BUTTON_STYLE: ViewStyle = {
  backgroundColor: '#8E7CFF',
  height: 52,
  borderRadius: 26,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#8E7CFF',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  elevation: 5,
};

export const PRIMARY_BUTTON_TEXT_STYLE: TextStyle = {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '700',
  letterSpacing: 0.5,
};

/** Typography Presets */
export const SCREEN_TITLE_STYLE: TextStyle = {
  color: '#FFFFFF',
  fontSize: 34,
  fontWeight: '700',
  letterSpacing: -0.5,
};

export const SCREEN_SUBTITLE_STYLE: TextStyle = {
  color: '#9A9AA6',
  fontSize: 14,
  fontWeight: '400',
  marginTop: 4,
};

export const SECTION_HEADER_STYLE: TextStyle = {
  color: '#8A8A98',
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  marginBottom: 10,
};
