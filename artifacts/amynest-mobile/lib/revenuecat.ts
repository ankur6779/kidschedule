// RevenueCat client wrapper for AmyNest mobile.
// Configures Purchases SDK once at startup, exposes a typed purchase()
// helper that maps our internal Plan codes -> RC packages, and surfaces
// the active entitlement.
import { Platform } from "react-native";
import Purchases, { type CustomerInfo, type PurchasesPackage } from "react-native-purchases";
import Constants from "expo-constants";

const TEST_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const RC_ENTITLEMENT_ID = "premium";
export const RC_OFFERING_ID = "default";

// Map our internal Plan codes to RC package identifiers (set during seed).
export const PLAN_TO_PACKAGE_ID: Record<"monthly" | "six_month" | "yearly", string> = {
  monthly: "$rc_monthly",
  six_month: "$rc_six_month",
  yearly: "$rc_annual",
};

let initialized = false;
let configuredUserId: string | null = null;

function pickApiKey(): string | null {
  // In Expo Go, dev builds, web, or running inside Storefront simulator,
  // RC runs in Preview API mode and the test key is appropriate.
  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    return TEST_KEY ?? null;
  }
  if (Platform.OS === "ios") return IOS_KEY ?? null;
  if (Platform.OS === "android") return ANDROID_KEY ?? null;
  return TEST_KEY ?? null;
}

export function initializeRevenueCat(): void {
  if (initialized) return;
  const apiKey = pickApiKey();
  if (!apiKey) {
    console.warn("[RevenueCat] No API key configured for this platform");
    return;
  }
  Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  initialized = true;
}

/** Identify the current user with RevenueCat. Safe to call repeatedly. */
export async function identifyUser(userId: string): Promise<void> {
  if (!initialized) initializeRevenueCat();
  if (!initialized) return;
  if (configuredUserId === userId) return;
  try {
    await Purchases.logIn(userId);
    configuredUserId = userId;
  } catch (e) {
    console.warn("[RevenueCat] logIn failed", e);
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!initialized) return;
  try {
    await Purchases.logOut();
    configuredUserId = null;
  } catch {
    // ignore (anonymous user)
  }
}

export async function getCurrentOffering(): Promise<PurchasesPackage[]> {
  if (!initialized) initializeRevenueCat();
  if (!initialized) return [];
  const offerings = await Purchases.getOfferings();
  const current = offerings.current ?? offerings.all[RC_OFFERING_ID];
  return current?.availablePackages ?? [];
}

export type PurchaseResult =
  | { ok: true; isPremium: boolean; customerInfo: CustomerInfo }
  | { ok: false; userCancelled: boolean; reason: string };

/** Trigger a purchase for our internal plan code. Maps to RC package identifier. */
export async function purchasePlan(
  plan: "monthly" | "six_month" | "yearly",
): Promise<PurchaseResult> {
  if (!initialized) initializeRevenueCat();
  if (!initialized) {
    return { ok: false, userCancelled: false, reason: "RevenueCat not initialised" };
  }

  const pkgId = PLAN_TO_PACKAGE_ID[plan];
  const packages = await getCurrentOffering();
  const pkg = packages.find((p) => p.identifier === pkgId);
  if (!pkg) {
    return { ok: false, userCancelled: false, reason: `Package ${pkgId} not found in offering` };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = customerInfo.entitlements.active[RC_ENTITLEMENT_ID] !== undefined;
    return { ok: true, isPremium, customerInfo };
  } catch (e: any) {
    const userCancelled = !!e?.userCancelled;
    return {
      ok: false,
      userCancelled,
      reason: userCancelled ? "Purchase cancelled" : (e?.message ?? "Purchase failed"),
    };
  }
}

export async function restorePurchases(): Promise<{ isPremium: boolean }> {
  if (!initialized) initializeRevenueCat();
  if (!initialized) return { isPremium: false };
  const customerInfo = await Purchases.restorePurchases();
  return { isPremium: customerInfo.entitlements.active[RC_ENTITLEMENT_ID] !== undefined };
}
