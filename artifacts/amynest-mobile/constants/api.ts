const raw = process.env.EXPO_PUBLIC_DOMAIN ?? "";

if (!raw && typeof __DEV__ !== "undefined" && __DEV__) {
  console.error(
    "[AmyNest] EXPO_PUBLIC_DOMAIN is not set. " +
      "Add it to your .env or EAS build environment. API requests will fail."
  );
} else if (!raw) {
  throw new Error(
    "[AmyNest] EXPO_PUBLIC_DOMAIN is not set. " +
      "Add it to your EAS build environment before creating a release build."
  );
}

export const API_BASE_URL = raw.startsWith("http") ? raw : `https://${raw}`;
