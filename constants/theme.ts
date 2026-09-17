import { ViewStyle, TextStyle, Platform } from 'react-native';

/**
 * CruxLog Industrial Tactile Design Tokens
 * Dieter Rams / Teenage Engineering ledger aesthetic.
 * No gradients. No glows. Function over decoration.
 */
export const THEME_COLORS = {
  // Background & Surfaces
  bgMat: '#111113',
  cardSurface: '#19191D',
  cardSurfaceHero: '#19191D',
  cardSurfaceAlt: '#141417',
  cardBorder: '#27272F',
  cardBorderSubtle: '#222229',

  // Brand & Accent — used for STATE only, never decoration
  lavender: '#8E7CFF',
  brandAccent: '#8E7CFF',

  // Outcomes & Status
  flashGreen: '#6EE756',
  softCream: '#E8DEB5',
  mutedFail: '#3E3E48',
  error: '#FF453A',

  // Typography & Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9090A0',
  sectionHeader: '#9090A0',
  textDim: '#555562',
  textDark: '#111113',
  white: '#FFFFFF',

  // Backward compatibility aliases
  sublabelGray: '#9090A0',
};

/** Standard Flat Surface Card — no glows, no glass. Solid and honest. */
export const FLOATING_CARD_STYLE: ViewStyle = {
  backgroundColor: '#19191D',
  borderColor: '#27272F',
  borderWidth: 1,
  borderRadius: 12,
};

/** Elevated Hero Card — same flat treatment, slightly inset bg */
export const FLOATING_CARD_HERO_STYLE: ViewStyle = {
  backgroundColor: '#19191D',
  borderColor: '#27272F',
  borderWidth: 1,
  borderRadius: 12,
};

/** Floating Island for navigation capsule */
export const FLOATING_ISLAND_STYLE: ViewStyle = {
  backgroundColor: 'rgba(17, 17, 19, 0.95)',
  borderColor: '#27272F',
  borderWidth: 1,
};

/** Grade Badge Pill: Sharp lime border, no solid fill */
export const GRADE_BADGE_CONTAINER_STYLE: ViewStyle = {
  backgroundColor: '#141417',
  borderRadius: 6,
  paddingHorizontal: 10,
  paddingVertical: 3,
  alignSelf: 'flex-start',
  borderWidth: 1,
  borderColor: '#6EE756',
};

export const GRADE_BADGE_TEXT_STYLE: TextStyle = {
  color: '#6EE756',
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 0.5,
};

/** Primary Action Button — solid rectangle, no glow shadow */
export const PRIMARY_BUTTON_STYLE: ViewStyle = {
  backgroundColor: '#8E7CFF',
  height: 44,
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
};

export const PRIMARY_BUTTON_TEXT_STYLE: TextStyle = {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '700',
  letterSpacing: 0.5,
};

/** Monospace clock font — for elapsed timer display */
export const MONO_FONT_FAMILY = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

/** Typography Presets */
export const SCREEN_TITLE_STYLE: TextStyle = {
  color: '#FFFFFF',
  fontSize: 28,
  fontWeight: '700',
  letterSpacing: -0.5,
};

export const SCREEN_SUBTITLE_STYLE: TextStyle = {
  color: '#9090A0',
  fontSize: 14,
  fontWeight: '400',
  marginTop: 4,
};

export const SECTION_HEADER_STYLE: TextStyle = {
  color: '#9090A0',
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  marginBottom: 10,
};
