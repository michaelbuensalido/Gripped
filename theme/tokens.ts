export const colors = {
  // Surfaces
  bg: "#F5F2EC", // warm off-white, like chalk/limestone
  bgTexture: "#E9E4DA", // fleck colour for the background texture
  card: "#FFFFFF",
  cardMuted: "#F0ECE4", // inset tiles, input backgrounds
  border: "rgba(28, 27, 34, 0.08)",

  // Text
  text: "#1C1B22",
  textMuted: "#6B6877",
  textOnAccent: "#FFFFFF",

  // Brand accent (purple)
  accent: "#6A52D1",
  accentPressed: "#5440B5",
  accentSoft: "#ECE8FB", // chips, active tab pill, selected states
  accentText: "#5440B5", // accent-coloured text on soft backgrounds

  // Result colours (fills are for charts/badges; always paired with a text label)
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
  glass: "rgba(255, 255, 255, 0.78)", // tab bar, sheets (with blur)
  scrim: "rgba(28, 27, 34, 0.40)",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }; // 4pt grid

export const shadow = {
  // Light mode uses soft shadows instead of the dark theme's glow/borders.
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
    fontFamily: "Sora_600SemiBold",
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: { fontFamily: "Sora_600SemiBold", fontSize: 22, lineHeight: 28 },
  stat: { fontFamily: "Sora_600SemiBold", fontSize: 34, lineHeight: 38 },
  heading: { fontFamily: "Inter_600SemiBold", fontSize: 17, lineHeight: 22 },
  body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
};

export const motion = { fast: 120, base: 200, slow: 320 }; // ms
