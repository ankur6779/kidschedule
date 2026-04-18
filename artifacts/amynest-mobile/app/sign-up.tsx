import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image,
} from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

WebBrowser.maybeCompleteAuthSession();

const LOGO = require("../assets/images/amynest-logo.png");

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
    <LinearGradient
      colors={["#0f0c29", "#1a1040", "#0c1220"]}
      style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}
    >
      {/* Ambient orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Brand */}
          <View style={styles.brandRow}>
            <Image source={LOGO} style={styles.logoBox} resizeMode="contain" />
            <Text style={styles.brandName}>AmyNest</Text>
            <LinearGradient colors={["#7B3FF2", "#FF4ECD"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </LinearGradient>
          </View>

          {step === "form" ? (
            <>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Start your AI parenting journey</Text>

              <View style={styles.form}>
                {/* Google button */}
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogleSignUp}
                  disabled={googleLoading}
                  testID="google-sign-up-btn"
                  activeOpacity={0.85}
                >
                  <View style={styles.googleBtnInner}>
                    {googleLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="logo-google" size={20} color="#EA4335" />
                    )}
                    <Text style={styles.googleBtnText}>
                      {googleLoading ? "Connecting…" : "Continue with Google"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or sign up with email</Text>
                  <View style={styles.divider} />
                </View>

                {/* First Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Your first name"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      autoComplete="given-name"
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPass}
                      placeholder="Min. 8 characters"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn} hitSlop={8}>
                      <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Create account button */}
                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={loading || !email || !password || !firstName}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={(loading || !email || !password || !firstName) ? ["#4B4B6B", "#4B4B6B"] : ["#7B3FF2", "#FF4ECD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.primaryBtnText}>Create Account</Text>
                    }
                  </LinearGradient>
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
              <Text style={styles.subtitle}>We sent a code to{"\n"}{email}</Text>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="key-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      placeholder="6-digit code"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={loading || !code}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={(loading || !code) ? ["#4B4B6B", "#4B4B6B"] : ["#7B3FF2", "#FF4ECD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.primaryBtnText}>Verify Email</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep("form")} style={{ alignItems: "center", marginTop: 4 }}>
                  <Text style={styles.linkText}>← Back</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb1: {
    position: "absolute", top: -80, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(123,63,242,0.18)",
  },
  orb2: {
    position: "absolute", bottom: 80, left: -80,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,78,205,0.12)",
  },
  scroll: { flexGrow: 1, paddingHorizontal: 28, justifyContent: "center", paddingVertical: 32 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 36 },
  logoBox: { width: 44, height: 44, borderRadius: 12 },
  brandName: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  aiBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 2 },
  aiBadgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  title: { fontSize: 30, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginBottom: 32 },
  form: { gap: 16 },
  googleBtn: {
    height: 56, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  googleBtnInner: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  googleBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText: { fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "Inter_400Regular" },
  inputGroup: { gap: 7 },
  label: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.7)", fontFamily: "Inter_600SemiBold" },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    height: 54, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, fontSize: 15, color: "#FFFFFF", fontFamily: "Inter_400Regular",
  },
  eyeBtn: { padding: 4 },
  primaryBtn: {
    height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center",
    shadowColor: "#7B3FF2", shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  footerText: { color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular" },
  linkText: { color: "#A78BFA", fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
