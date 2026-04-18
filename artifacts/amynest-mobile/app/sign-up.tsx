import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

WebBrowser.maybeCompleteAuthSession();

const PRIMARY = "#6366F1";
const BG = "#F8F7FF";
const DARK = "#1E1B4B";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await signUp.create({ firstName, emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message?: string }[] };
      Alert.alert("Sign Up Failed", clerkErr.errors?.[0]?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/onboarding");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message?: string }[] };
      Alert.alert("Verification Failed", clerkErr.errors?.[0]?.message ?? "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: oauthSetActive } = await startOAuthFlow();
      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        router.replace("/onboarding");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message?: string }[] };
      const msg = clerkErr.errors?.[0]?.message ?? "Google sign-in failed. Please try again.";
      Alert.alert("Sign Up Failed", msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Ionicons name="leaf" size={28} color="#fff" />
            </View>
            <Text style={styles.brandName}>AmyNest</Text>
          </View>

          {step === "form" ? (
            <>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Start your parenting journey</Text>
              <View style={styles.form}>
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogleSignUp}
                  disabled={googleLoading}
                  testID="google-sign-up-btn"
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={DARK} />
                  ) : (
                    <Ionicons name="logo-google" size={20} color="#DB4437" />
                  )}
                  <Text style={styles.googleBtnText}>
                    {googleLoading ? "Connecting…" : "Continue with Google"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput style={styles.input} value={firstName} onChangeText={setFirstName}
                    placeholder="Your first name" placeholderTextColor="#A0A0BC" autoComplete="given-name" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput style={styles.input} value={email} onChangeText={setEmail}
                    autoCapitalize="none" keyboardType="email-address" autoComplete="email"
                    placeholder="you@example.com" placeholderTextColor="#A0A0BC" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passRow}>
                    <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={password}
                      onChangeText={setPassword} secureTextEntry={!showPass}
                      placeholder="Min. 8 characters" placeholderTextColor="#A0A0BC" />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                      <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || !email || !password || !firstName) && styles.disabledBtn]}
                  onPress={handleSignUp}
                  disabled={loading || !email || !password || !firstName}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.primaryBtnText}>Create Account</Text>
                  }
                </TouchableOpacity>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <Link href="/sign-in" asChild>
                    <TouchableOpacity><Text style={styles.linkText}>Sign In</Text></TouchableOpacity>
                  </Link>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>Enter the verification code sent to {email}</Text>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput style={styles.input} value={code} onChangeText={setCode}
                    keyboardType="number-pad" placeholder="6-digit code" placeholderTextColor="#A0A0BC" />
                </View>
                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || !code) && styles.disabledBtn]}
                  onPress={handleVerify}
                  disabled={loading || !code}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.primaryBtnText}>Verify Email</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 40 },
  logoBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 24, fontWeight: "700", color: DARK, fontFamily: "Inter_700Bold" },
  title: { fontSize: 28, fontWeight: "700", color: DARK, fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 16, color: "#6B7280", fontFamily: "Inter_400Regular", marginBottom: 32 },
  form: { gap: 16 },
  googleBtn: {
    height: 54, borderRadius: 14, backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#E0E7FF",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  googleBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: DARK },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: "#E0E7FF" },
  dividerText: { fontSize: 13, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: DARK, fontFamily: "Inter_600SemiBold" },
  input: {
    height: 52, borderRadius: 14, backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#E0E7FF",
    paddingHorizontal: 16, fontSize: 15, color: DARK, fontFamily: "Inter_400Regular", marginBottom: 4,
  },
  passRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: { padding: 8 },
  primaryBtn: { height: 54, borderRadius: 14, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { color: "#6B7280", fontFamily: "Inter_400Regular" },
  linkText: { color: PRIMARY, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
