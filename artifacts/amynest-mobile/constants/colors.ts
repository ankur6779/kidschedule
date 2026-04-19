const colors = {
  light: {
    text: "#0F172A",
    tint: "#7B3FF2",

    background: "#F8FAFC",
    foreground: "#0F172A",

    card: "#FFFFFF",
    cardForeground: "#0F172A",

    primary: "#7B3FF2",
    primaryForeground: "#FFFFFF",

    secondary: "#F1F5F9",
    secondaryForeground: "#0F172A",

    muted: "#F1F5F9",
    mutedForeground: "rgba(15,23,42,0.60)",

    accent: "#FF4ECD",
    accentForeground: "#FFFFFF",

    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",

    border: "rgba(15,23,42,0.10)",
    input: "rgba(15,23,42,0.14)",

    amyGradientStart: "#7B3FF2",
    amyGradientEnd: "#FF4ECD",

    glass: "rgba(255,255,255,0.85)",
    glassBorder: "rgba(15,23,42,0.08)",
    glow: "#7B3FF2",
    glowAccent: "#FF4ECD",
    surface: "#FFFFFF",
    surfaceElevated: "#F8FAFC",
    highlight: "#0EA5E9",
    textMuted: "rgba(15,23,42,0.60)",
    textDim: "rgba(15,23,42,0.45)",
  },
  dark: {
    text: "#FFFFFF",
    tint: "#7B3FF2",

    background: "#0B0B1A",
    foreground: "#FFFFFF",

    card: "#14142B",
    cardForeground: "#FFFFFF",

    primary: "#7B3FF2",
    primaryForeground: "#FFFFFF",

    secondary: "#1B1B3A",
    secondaryForeground: "#FFFFFF",

    muted: "#1B1B3A",
    mutedForeground: "rgba(255,255,255,0.6)",

    accent: "#FF4ECD",
    accentForeground: "#FFFFFF",

    destructive: "#FF5C7A",
    destructiveForeground: "#FFFFFF",

    border: "rgba(255,255,255,0.08)",
    input: "rgba(255,255,255,0.12)",

    amyGradientStart: "#7B3FF2",
    amyGradientEnd: "#FF4ECD",

    glass: "rgba(20,20,43,0.72)",
    glassBorder: "rgba(255,255,255,0.08)",
    glow: "#7B3FF2",
    glowAccent: "#FF4ECD",
    surface: "#14142B",
    surfaceElevated: "#1B1B3A",
    highlight: "#4FC3F7",
    textMuted: "rgba(255,255,255,0.6)",
    textDim: "rgba(255,255,255,0.45)",
  },
  radius: 20,
};

export default colors;

export const brand = {
  primary: "#7B3FF2",
  primaryLight: "#9B5FF5",
  violet50: "#FAF5FF",
  violet100: "#EDE9FE",
  violet200: "#E9D5FF",
  violetMist: "#DDD6FE",
  violet300: "#C4B5FD",
  violet400: "#A78BFA",
  violet500: "#8B5CF6",
  violet600: "#7C3AED",
  violet700: "#6D28D9",
  violet800: "#5B21B6",
  violet900: "#4C1D95",
  purple400: "#C084FC",
  purple500: "#A855F7",
  purple600: "#9333EA",
  purple900: "#581C87",
  indigo100: "#E0E7FF",
  indigo500: "#6366F1",
} as const;

export const brandAlpha = {
  violet600_03: "rgba(124,58,237,0.03)",
  violet600_04: "rgba(124,58,237,0.04)",
  violet600_08: "rgba(124,58,237,0.08)",
  violet600_10: "rgba(124,58,237,0.10)",
  violet600_12: "rgba(124,58,237,0.12)",
  violet600_15: "rgba(124,58,237,0.15)",
  violet600_18: "rgba(124,58,237,0.18)",
  violet600_20: "rgba(124,58,237,0.20)",
  violet600_22: "rgba(124,58,237,0.22)",
  violet600_25: "rgba(124,58,237,0.25)",
  violet600_30: "rgba(124,58,237,0.30)",
  violet600_35: "rgba(124,58,237,0.35)",
  violet500_10: "rgba(139,92,246,0.10)",
  violet500_12: "rgba(139,92,246,0.12)",
  violet500_18: "rgba(139,92,246,0.18)",
  violet500_20: "rgba(139,92,246,0.20)",
  violet500_22: "rgba(139,92,246,0.22)",
  violet500_25: "rgba(139,92,246,0.25)",
  violet500_30: "rgba(139,92,246,0.30)",
  violet500_35: "rgba(139,92,246,0.35)",
  violet500_40: "rgba(139,92,246,0.40)",
  violet500_50: "rgba(139,92,246,0.50)",
  purple500_10: "rgba(168,85,247,0.10)",
  purple500_15: "rgba(168,85,247,0.15)",
  purple500_16: "rgba(168,85,247,0.16)",
  purple500_18: "rgba(168,85,247,0.18)",
  purple500_20: "rgba(168,85,247,0.20)",
  purple500_25: "rgba(168,85,247,0.25)",
  purple500_28: "rgba(168,85,247,0.28)",
  purple500_30: "rgba(168,85,247,0.30)",
  purple500_35: "rgba(168,85,247,0.35)",
  purple500_40: "rgba(168,85,247,0.40)",
  purple500_45: "rgba(168,85,247,0.45)",
  indigo500_08: "rgba(99,102,241,0.08)",
  indigo500_10: "rgba(99,102,241,0.10)",
  indigo500_14: "rgba(99,102,241,0.14)",
  indigo500_15: "rgba(99,102,241,0.15)",
  indigo500_16: "rgba(99,102,241,0.16)",
  indigo500_20: "rgba(99,102,241,0.20)",
  indigo500_25: "rgba(99,102,241,0.25)",
  indigo500_35: "rgba(99,102,241,0.35)",
  indigo500_95: "rgba(99,102,241,0.95)",
} as const;

export const gradients = {
  violetToPurple: ["#A855F7", "#7C3AED"] as const,
  violetToIndigo: ["#8B5CF6", "#6366F1"] as const,
  deepVioletFlip: ["#7C3AED", "#A855F7"] as const,
  darkViolet: ["#6D28D9", "#8B5CF6"] as const,
  darkestViolet: ["#5B21B6", "#7C3AED"] as const,
  purpleToDeep: ["#9333EA", "#7C3AED"] as const,
  indigoToViolet: ["#6366F1", "#8B5CF6"] as const,
  purpleToPurple: ["#A855F7", "#9333EA"] as const,
} as const;
