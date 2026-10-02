export const colors = {
  // Surfaces
  bg: "#101014", // flat charcoal
  bgTexture: "#101014",
  card: "#1A1A20", // solid dark cards
  cardMuted: "#22222A", // inset tiles, input backgrounds
  border: "rgba(255, 255, 255, 0.07)", // subtle 1px border

  // Text
  text: "#F2F3F7",
  textMuted: "#9A9AA8",
  textOnAccent: "#FFFFFF",

  // Brand accent (purple)
  accent: "#7059DB",
  accentPressed: "#5440B5",
  accentSoft: "rgba(112, 89, 219, 0.15)", // chips, active tab pill
  accentText: "#A596F5", 

  // Result colours
  flash: "#4ADE80",
  flashSoft: "rgba(74, 222, 128, 0.15)",
  flashText: "#86EFAC",
  top: "#7059DB",
  topSoft: "rgba(112, 89, 219, 0.15)",
  topText: "#A596F5",
  attempt: "#FACC15",
  attemptSoft: "rgba(250, 204, 21, 0.15)",
  attemptText: "#FEF08A",
  fail: "#6B7280",
  failSoft: "rgba(107, 114, 128, 0.15)",
  failText: "#9CA3AF",

  // Feedback
  danger: "#EF4444",
  dangerSoft: "rgba(239, 68, 68, 0.15)",
  dangerText: "#FCA5A5",
  success: "#4ADE80",

  // Overlay / glass
  glass: "rgba(26, 26, 32, 0.78)", // tab bar blur
  scrim: "rgba(0, 0, 0, 0.65)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  floating: {
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

export const type = {
  display: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: { fontFamily: "Sora_600SemiBold", fontSize: 22, lineHeight: 28 },
  stat: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 34,
    lineHeight: 38,
    fontVariant: ["tabular-nums" as const],
  },
  statSm: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 24,
    lineHeight: 28,
    fontVariant: ["tabular-nums" as const],
  },
  heading: { fontFamily: "Inter_600SemiBold", fontSize: 17, lineHeight: 22 },
  body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  control: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
};

export const motion = {
  duration: { fast: 120, base: 200, slow: 320, celebrate: 900 },
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0, 1],
    exit: [0.4, 0, 1, 1],
  },
  spring: { damping: 18, stiffness: 220 },
};

export const gradeBands = [
  { bg: 'rgba(96, 165, 250, 0.15)', text: '#93C5FD', solid: '#3B82F6', label: 'Beginner' },
  { bg: 'rgba(74, 222, 128, 0.15)', text: '#86EFAC', solid: '#22C55E', label: 'Intermediate' },
  { bg: 'rgba(251, 146, 60, 0.15)', text: '#FDBA74', solid: '#F97316', label: 'Advanced' },
  { bg: 'rgba(192, 132, 252, 0.15)', text: '#D8B4FE', solid: '#A855F7', label: 'Expert' },
] as const;

export function gradeBand(gradeIndex: number): typeof gradeBands[number] {
  if (gradeIndex <= 2) return gradeBands[0];
  if (gradeIndex <= 5) return gradeBands[1];
  if (gradeIndex <= 8) return gradeBands[2];
  return gradeBands[3];
}
