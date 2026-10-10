export const colors = {
  // Surfaces
  bg: "#F5F2EC",
  bgTexture: "#E9E4DA",
  card: "#FFFFFF",
  cardMuted: "#F0ECE4",
  border: "rgba(28, 27, 34, 0.08)",

  // Text
  text: "#1C1B22",
  textMuted: "#6B6877",
  textOnAccent: "#FFFFFF",

  // Brand accent (purple)
  accent: "#6A52D1",
  accentPressed: "#5440B5",
  accentSoft: "#ECE8FB",
  accentText: "#5440B5",

  // Result colours
  flash: "#3BA462",
  flashSoft: "#DDF1D3",
  flashText: "#1F6B3A",
  top: "#6A52D1",
  topSoft: "#ECE8FB",
  topText: "#5440B5",
  attempt: "#D9C99A",
  attemptSoft: "#EFE7D0",
  attemptText: "#6B5B2E",
  fail: "#9A99A6",
  failSoft: "#E6E5EA",
  failText: "#4A4955",

  // Feedback
  danger: "#C0392B",
  dangerSoft: "#FBE3E6",
  dangerText: "#9B2C3A",
  success: "#2E8B4F",

  // Overlay / glass
  glass: "rgba(255, 255, 255, 0.78)",
  scrim: "rgba(28, 27, 34, 0.40)",

  // Depth (v3.0)
  bevelHighlight: "rgba(255, 255, 255, 0.90)",
  bevelShadow: "rgba(28, 27, 34, 0.10)",
  glassBorder: "rgba(28, 27, 34, 0.08)",
  glow: "rgba(106, 82, 209, 0.12)",

  // Translucent Materials (v4.0 Spatial Editorial)
  materialBase: "rgba(0, 0, 0, 0.03)",
  materialBorder: "transparent",
  materialHighlight: "transparent",

  // Translucent Typography
  textWhitePrimary: "#000000",
  textWhiteSecondary: "rgba(0, 0, 0, 0.50)",
  textWhiteMuted: "rgba(0, 0, 0, 0.40)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  card: {
    shadowColor: "#1C1B22",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  floating: {
    shadowColor: "#1C1B22",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

export const type = {
  display: {
    fontFamily: "Sora_400Regular",
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums" as const],
  },
  title: { fontFamily: "Sora_400Regular", fontSize: 22, lineHeight: 28, fontVariant: ["tabular-nums" as const] },
  stat: {
    fontFamily: "Sora_400Regular",
    fontSize: 36,
    lineHeight: 40,
    fontVariant: ["tabular-nums" as const],
  },
  statSm: {
    fontFamily: "Sora_400Regular",
    fontSize: 24,
    lineHeight: 28,
    fontVariant: ["tabular-nums" as const],
  },
  heading: { fontFamily: "Inter_400Regular", fontSize: 17, lineHeight: 22, fontVariant: ["tabular-nums" as const] },
  body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, fontVariant: ["tabular-nums" as const] },
  control: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20, fontVariant: ["tabular-nums" as const] },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2.5,
    fontVariant: ["tabular-nums" as const],
    textTransform: "uppercase" as const,
  },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums" as const] },
};

export const motion = {
  duration: {
    instant: 80,
    fast: 140,
    base: 220,
    slow: 280,
    celebrate: 280,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    enter: [0.23, 1, 0.32, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
  spring: { damping: 20, stiffness: 240, mass: 0.8 },
  layoutSpring: { damping: 18, stiffness: 200 },
  pressSpring: { damping: 18, stiffness: 350, scale: 0.97 },
  sheetSpring: { damping: 24, stiffness: 260 },
};

export const gradeBands = [
  { bg: '#E8EAF0', text: '#3D4166', solid: '#7C85C4', label: 'Beginner' },
  { bg: '#DDF1D3', text: '#1F6B3A', solid: '#3BA462', label: 'Intermediate' },
  { bg: '#FEF0D8', text: '#9B5B00', solid: '#E07A00', label: 'Advanced' },
  { bg: '#ECE8FB', text: '#5440B5', solid: '#6A52D1', label: 'Expert' },
] as const;

export function gradeBand(gradeIndex: number): typeof gradeBands[number] {
  if (gradeIndex <= 2) return gradeBands[0];
  if (gradeIndex <= 5) return gradeBands[1];
  if (gradeIndex <= 8) return gradeBands[2];
  return gradeBands[3];
}
