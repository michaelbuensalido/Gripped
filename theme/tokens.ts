export const colors = {
  // Surfaces: separated by tone and a hairline border, not by shadow
  bg: "#101014",
  bgTexture: "#101014",
  card: "#1A1A20",
  cardMuted: "#22222A", // inset tiles, inputs, unselected chips
  border: "rgba(255, 255, 255, 0.07)",

  // Text
  text: "#F2F3F7",
  textMuted: "#9A9AA8",
  textOnAccent: "#FFFFFF",

  // Accent: purple means "do this" (primary action), "you are here" (active), or "Top" (a result)
  accent: "#7059DB", // filled buttons and the centre Start button (white text)
  accentPressed: "#5F49C4",
  accentSoft: "#2D2B3E", // selected chip, active tab capsule, tinted card
  accentText: "#A596F5", // links, active icons, text on accentSoft

  // Results (fills for chart segments and dots; text uses *Text; always with a text label)
  flash: "#5ED16B",
  flashSoft: "#25372C",
  flashText: "#8BE59A",
  top: "#8B7CF6",
  topSoft: "#2C2A42",
  topText: "#A596F5",
  attempt: "#B8A66A",
  attemptSoft: "#33302C",
  attemptText: "#D9C99A",
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

  // Feedback (red is reserved for destructive actions and errors)
  danger: "#E5483B",
  dangerSoft: "#3A2124",
  dangerText: "#FF8A80",
  success: "#5ED16B",

  // Overlay
  scrim: "rgba(0, 0, 0, 0.55)",
  glass: "rgba(26, 26, 32, 0.85)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }; // 4pt grid

// Cards have NO shadow on dark. Only the floating centre button gets one.
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
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
  control: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 }, // chips, buttons, toggles: sentence case
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  }, // section and stat labels only
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
};

export const motion = {
  duration: { fast: 120, base: 200, slow: 320, celebrate: 900 }, // ms
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0, 1],
    exit: [0.4, 0, 1, 1],
  }, // cubic-bezier
  spring: { damping: 18, stiffness: 220 },
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
