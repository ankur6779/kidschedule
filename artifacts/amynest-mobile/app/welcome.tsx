import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FEATURES = [
  {
    icon: "sparkles" as const,
    title: "AI Coach",
    desc: "Personalized step-by-step plans rooted in child psychology.",
    color: "#A855F7",
  },
  {
    icon: "calendar" as const,
    title: "Smart Routines",
    desc: "Daily routines that build lasting habits effortlessly.",
    color: "#06B6D4",
  },
  {
    icon: "grid" as const,
    title: "Parent Hub",
    desc: "Activities & guidance — all in one beautiful place.",
    color: "#EC4899",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const floatY = useRef(new Animated.Value(0)).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // floating logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    // bouncing mascot
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceY, { toValue: -8, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceY, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    // pulse halo
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.5, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    ).start();
    // fade-in entrance
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStart = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/sign-up");
  };

  const handleMascot = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/sign-up");
  };

  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Glow blobs */}
      <View pointerEvents="none" style={styles.blobsContainer}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top nav */}
        <View style={styles.nav}>
          <View style={styles.navBrand}>
            <View style={styles.navLogoBox}>
              <Ionicons name="leaf" size={16} color="#fff" />
            </View>
            <Text style={styles.navBrandText}>
              AmyNest <Text style={styles.navBrandAccent}>AI</Text>
            </Text>
          </View>
          <Link href="/sign-in" asChild>
            <TouchableOpacity testID="link-sign-in">
              <Text style={styles.navSignIn}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Animated.View style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          {/* Badge */}
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color="#C4B5FD" />
            <Text style={styles.badgeText}>AI-Powered Parenting Coach</Text>
          </View>

          {/* Logo + Mascot */}
          <View style={styles.logoRow}>
            <Animated.View style={{ transform: [{ translateY: floatY }] }}>
              <LinearGradient
                colors={["#FFFFFF", "#E0E7FF"]}
                style={styles.logoBox}
              >
                <Ionicons name="leaf" size={56} color="#6366F1" />
              </LinearGradient>
            </Animated.View>

            {/* Mascot — clickable */}
            <Pressable onPress={handleMascot} testID="link-mascot">
              <View style={styles.mascotWrap}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.mascotPulse,
                    { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                  ]}
                />
                <Animated.View style={{ transform: [{ translateY: bounceY }] }}>
                  <LinearGradient
                    colors={["#FFFFFF", "#E0E7FF"]}
                    style={styles.mascotBox}
                  >
                    <Text style={styles.mascotEmoji}>🤖</Text>
                  </LinearGradient>
                </Animated.View>
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>💬 Talk to Amy</Text>
                </View>
              </View>
            </Pressable>
          </View>

          {/* Headline */}
          <Text style={styles.title}>
            Where Smart{"\n"}
            <Text style={styles.titleAccent}>Parenting</Text> Begins
          </Text>

          {/* Subtext */}
          <Text style={styles.subtitle}>
            Step-by-step, science-backed parenting plans personalized for your child — by your AI Parenting Coach.
          </Text>

          {/* Primary CTA */}
          <TouchableOpacity onPress={handleStart} activeOpacity={0.85} testID="button-hero-cta">
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Start Parenting Smarter</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.smallNote}>✨ Free to start · No credit card required</Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresWrap}>
          <Text style={styles.sectionTitle}>Everything you need to parent smarter</Text>
          <Text style={styles.sectionSub}>Three powerful tools, one beautifully simple app.</Text>

          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${f.color}25` }]}>
                <Ionicons name={f.icon} size={22} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Final CTA */}
        <View style={styles.finalCtaCard}>
          <View style={styles.finalIconBox}>
            <Ionicons name="chatbubbles" size={28} color="#fff" />
          </View>
          <Text style={styles.finalTitle}>Ready to start your parenting journey?</Text>
          <Text style={styles.finalSub}>
            Join AmyNest AI and get a personalized plan in minutes — completely free.
          </Text>
          <TouchableOpacity onPress={handleStart} activeOpacity={0.85} testID="button-final-cta">
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cta, { paddingHorizontal: 36 }]}
            >
              <Text style={styles.ctaText}>Start Parenting Smarter</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Where Smart Parenting Begins</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blobsContainer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 9999 },
  blob1: { width: 400, height: 400, top: -100, left: -120, backgroundColor: "rgba(168,85,247,0.25)" },
  blob2: { width: 380, height: 380, top: 280, right: -140, backgroundColor: "rgba(59,130,246,0.22)" },
  blob3: { width: 320, height: 320, bottom: -80, left: 40, backgroundColor: "rgba(236,72,153,0.18)" },

  scroll: { paddingHorizontal: 20 },

  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  navBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  navLogoBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center",
  },
  navBrandText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  navBrandAccent: { color: "#C4B5FD" },
  navSignIn: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Inter_600SemiBold", paddingHorizontal: 10, paddingVertical: 6 },

  hero: { alignItems: "center", marginTop: 16, marginBottom: 32 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 24,
  },
  badgeText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: "Inter_600SemiBold" },

  logoRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 28 },
  logoBox: {
    width: 110, height: 110, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#A855F7", shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  mascotWrap: { alignItems: "center", justifyContent: "center" },
  mascotPulse: {
    position: "absolute",
    width: 80, height: 80, borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.5)",
  },
  mascotBox: {
    width: 70, height: 70, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#A855F7", shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  mascotEmoji: { fontSize: 36 },
  tooltip: {
    position: "absolute", bottom: -28,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  tooltipText: { fontSize: 10, color: "#0f0c29", fontFamily: "Inter_600SemiBold" },

  title: {
    fontSize: 34, lineHeight: 40, color: "#fff",
    fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 14,
    letterSpacing: -0.5,
  },
  titleAccent: { color: "#C4B5FD" },
  subtitle: {
    fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular", textAlign: "center",
    paddingHorizontal: 8, marginBottom: 28,
  },

  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingHorizontal: 30, paddingVertical: 16, borderRadius: 18,
    shadowColor: "#A855F7", shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  smallNote: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 16 },

  featuresWrap: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 22, color: "#fff", fontFamily: "Inter_700Bold",
    textAlign: "center", marginBottom: 6, letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular",
    textAlign: "center", marginBottom: 20,
  },
  featureCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 20, marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  featureIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  featureTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 3 },
  featureDesc: { color: "rgba(255,255,255,0.65)", fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 17 },

  finalCtaCard: {
    alignItems: "center",
    padding: 28, borderRadius: 28, marginBottom: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  finalIconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "#A855F7",
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#EC4899", shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  finalTitle: {
    fontSize: 22, lineHeight: 28, color: "#fff", fontFamily: "Inter_700Bold",
    textAlign: "center", marginBottom: 10, letterSpacing: -0.3,
  },
  finalSub: {
    fontSize: 13.5, lineHeight: 20, color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 22,
  },

  footer: { alignItems: "center", paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  footerText: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Inter_400Regular" },
});
