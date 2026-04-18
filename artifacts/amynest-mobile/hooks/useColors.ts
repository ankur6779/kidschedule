import colors from "@/constants/colors";

/**
 * Returns the design tokens for the AmyNest premium dark theme.
 * The app is dark-only — system color scheme is intentionally ignored.
 */
export function useColors() {
  return { ...colors.dark, radius: colors.radius };
}
