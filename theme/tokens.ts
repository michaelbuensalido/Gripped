export const colors = {
  // Surfaces: separated by tone and a hairline border, not by shadow
  bg: "#000000",
  bgTexture: "#000000",
  card: "#121214",
  cardMuted: "#18181A", // inset tiles, inputs, unselected chips
  border: "transparent",

  // Text
  text: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.40)",
  textOnAccent: "#FFFFFF",

  // Accent: Primary Neon Violet
  accent: "#A872FF",
  accentPressed: "#894CE0",
  accentSoft: "rgba(168, 114, 255, 0.15)", // selected chip, active tab capsule
  accentText: "#E0CCFF",

  // Results: Secondary Neon Green
  flash: "#72FF9B",
  flashSoft: "rgba(114, 255, 155, 0.15)",
  flashText: "#B5FFCB",
  top: "#A872FF",
  topSoft: "rgba(168, 114, 255, 0.15)",
  topText: "#E0CCFF",
  attempt: "#E6D485",
  attemptSoft: "rgba(230, 212, 133, 0.15)",
  attemptText: "#F0E3B3",
  fail: "#7A7987",
  failSoft: "#292930",
  failText: "#B4B3C0",

  // Grade bands (see Section 5)
  bandBeginnerSoft: "#2D303B",
  bandBeginnerText: "#B3C2DE",
  bandBeginner: "#8FA3C7",
  bandIntermediateSoft: "#1D363A",
  bandIntermediateText: "#6BDDD9",
  bandIntermediate: "#2FC7C2",
  bandAdvancedSoft: "#3C3124",
  bandAdvancedText: "#F6C46E",
  bandAdvanced: "#F0A93B",
  bandExpertSoft: "#38283B",
  bandExpertText: "#E59BDB",
  bandExpert: "#D473C8",

  // Feedback
  danger: "#FF4D4D",
  dangerSoft: "rgba(255, 77, 77, 0.15)",
  dangerText: "#FF9999",
  success: "#72FF9B",

  // Overlay
  scrim: "rgba(0, 0, 0, 0.75)",
  glass: "rgba(0, 0, 0, 0.85)",

  // Depth (v3.0)
  bevelHighlight: "transparent",
  bevelShadow: "transparent",
  glassBorder: "transparent",
  glow: "rgba(168, 114, 255, 0.25)",

  // Translucent Materials (v4.0 Spatial Editorial)
  materialBase: "rgba(255, 255, 255, 0.04)",
  materialBorder: "transparent",
  materialHighlight: "transparent",

  // Translucent Typography
  textWhitePrimary: "#FFFFFF",
  textWhiteSecondary: "rgba(255, 255, 255, 0.50)",
  textWhiteMuted: "rgba(255, 255, 255, 0.40)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }; // 4pt grid

// v3.0: cards sit on a soft black shadow (the bevel supplies the edge light).
export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  floating: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
  duration: { fast: 120, base: 200, slow: 320, celebrate: 900 }, // ms
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0, 1],
    exit: [0.4, 0, 1, 1],
  }, // cubic-bezier
  spring: { damping: 18, stiffness: 220 },
  // v3.0 fluid physics
  layoutSpring: { damping: 14, stiffness: 100 }, // list/grid items sliding into place
  pressSpring: { damping: 15, stiffness: 300, scale: 0.96 }, // PrimaryButton press-in
};

export const gradeBands = [
  { bg: "#2D303B", text: "#B3C2DE", solid: "#8FA3C7", label: "Beginner" },
  { bg: "#1D363A", text: "#6BDDD9", solid: "#2FC7C2", label: "Intermediate" },
  { bg: "#3C3124", text: "#F6C46E", solid: "#F0A93B", label: "Advanced" },
  { bg: "#38283B", text: "#E59BDB", solid: "#D473C8", label: "Expert" },
] as const;

export function gradeBand(gradeIndex: number): typeof gradeBands[number] {
  if (gradeIndex <= 2) return gradeBands[0];
  if (gradeIndex <= 5) return gradeBands[1];
  if (gradeIndex <= 8) return gradeBands[2];
  return gradeBands[3];
}
