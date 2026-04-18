import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { API_BASE_URL } from "@/constants/api";
import { ActivityIndicator, View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

setBaseUrl(API_BASE_URL);

const tokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value); } catch { /* ignore */ }
  },
  async clearToken(key: string) {
    try { await SecureStore.deleteItemAsync(key); } catch { /* ignore */ }
  },
};

type OnboardingStatus = "unknown" | "checking" | "complete" | "incomplete" | "error";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>("unknown");
  const checkInFlightRef = useRef(false);

  useEffect(() => {
    if (isSignedIn && getToken) {
      setAuthTokenGetter(() => getToken());
    }
  }, [isSignedIn, getToken]);

  const checkOnboardingStatus = useCallback(async (): Promise<"complete" | "incomplete"> => {
    if (checkInFlightRef.current || !getToken) return "incomplete";
    checkInFlightRef.current = true;
    setOnboardingStatus("checking");
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/onboarding`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) {
        setOnboardingStatus("incomplete");
        return "incomplete";
      }
      const data = (await res.json()) as { onboardingComplete?: boolean };
      const result: "complete" | "incomplete" = data?.onboardingComplete === true ? "complete" : "incomplete";
      setOnboardingStatus(result);
      return result;
    } catch {
      setOnboardingStatus("error");
      return "incomplete";
    } finally {
      checkInFlightRef.current = false;
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inOnboarding = segments[0] === "onboarding";
    const inAuth = segments[0] === "sign-in" || segments[0] === "sign-up";

    if (!isSignedIn) {
      if (!inAuth) router.replace("/sign-in");
      return;
    }

    if (onboardingStatus === "unknown" || onboardingStatus === "error") {
      checkOnboardingStatus().then(result => {
        if (result === "incomplete" && !inOnboarding) {
          router.replace("/onboarding");
        } else if (result === "complete" && (inAuth || inOnboarding)) {
          router.replace("/(tabs)");
        }
      });
      return;
    }

    if (onboardingStatus === "checking") return;

    if (onboardingStatus === "incomplete") {
      if (inTabsGroup) {
        checkOnboardingStatus().then(result => {
          if (result === "incomplete") {
            router.replace("/onboarding");
          }
        });
      } else if (!inOnboarding) {
        router.replace("/onboarding");
      }
      return;
    }

    if (onboardingStatus === "complete") {
      if (inAuth || inOnboarding) {
        router.replace("/(tabs)");
      }
    }
  }, [isLoaded, isSignedIn, segments, onboardingStatus]);

  useEffect(() => {
    if (!isSignedIn) {
      queryClient.clear();
      setOnboardingStatus("unknown");
      checkInFlightRef.current = false;
    }
  }, [isSignedIn]);

  const isCheckingOnboarding = isSignedIn && (onboardingStatus === "unknown" || onboardingStatus === "checking");

  if (!isLoaded || isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F7FF" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8F7FF" } }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="children/[id]"
        options={{
          headerShown: true,
          headerTitle: "Child Profile",
          headerBackTitle: "Back",
          headerTintColor: "#6366F1",
          headerStyle: { backgroundColor: "#F8F7FF" },
        }}
      />
      <Stack.Screen
        name="children/new"
        options={{
          headerShown: true,
          headerTitle: "Add Child",
          headerBackTitle: "Back",
          headerTintColor: "#6366F1",
          headerStyle: { backgroundColor: "#F8F7FF" },
        }}
      />
      <Stack.Screen
        name="routines/[id]"
        options={{
          headerShown: true,
          headerTitle: "Routine Detail",
          headerBackTitle: "Back",
          headerTintColor: "#6366F1",
          headerStyle: { backgroundColor: "#F8F7FF" },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AuthGate>
                  <RootLayoutNav />
                </AuthGate>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
