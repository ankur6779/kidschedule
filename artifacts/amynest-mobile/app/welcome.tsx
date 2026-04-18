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
  Image,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOGO = require("../assets/images/amynest-logo.png");

const FEATURES = [
  {
    icon: "sparkles" as const,
    title: "AI Coach",
    tagline: "Your personal parenting expert",
    color: "#A855F7",
    bullets: [
      "10–12 step deep coaching plans for 29+ parenting challenges",
      "Built on real child psychology & behavioural science",
      "Personalized for your child's age, temperament & situation",
      "Continuous guidance until your problem is fully resolved",
    ],
  },
  {
    icon: "calendar" as const,
    title: "Smart Routines",
    tagline: "Build lasting habits, effortlessly",
    color: "#06B6D4",
    bullets: [
      "Custom daily routines designed around your family",
      "Wake-up, study, screen time, sleep — all balanced",
      "Visual schedules kids actually love to follow",
      "Track progress & celebrate small wins together",
    ],
  },
  {
    icon: "grid" as const,
    title: "Parent Hub",
    tagline: "Everything in one beautiful place",
    color: "#EC4899",
    bullets: [
      "Curated activities & expert parenting guides",
      "Quick AI help — ask anything, anytime",
      "Behaviour insights & weekly progress reports",
      "Tips backed by Dr. Becky, Dr. Karp & decades of research",
    ],
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
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceY, { toValue: -8, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceY, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
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
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const tap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleStart = () => {
    tap();
    router.push("/sign-up");
  };

  const handleMascot = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/sign-up");
  };

  return (
    <View style={{ flex: 1 }}>
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
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top nav with round logo */}
          <View style={styles.nav}>
            <View style={styles.navBrand}>
              <View style={styles.navLogoCircle}>
                <Image source={LOGO} style={styles.navLogoImg} resizeMode="cover" />
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

            {/* BIG round logo in center */}
            <Animated.View style={[styles.bigLogoWrap, { transform: [{ translateY: floatY }] }]}>
              <View style={styles.bigLogoGlow} />
              <View style={styles.bigLogoCircle}>
                <Image source={LOGO} style={styles.bigLogoImg} resizeMode="cover" />
              </View>
            </Animated.View>

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

          {/* Features — detailed */}
          <View style={styles.featuresWrap}>
            <Text style={styles.sectionTitle}>Everything you need to{"\n"}parent smarter</Text>
            <Text style={styles.sectionSub}>
              Three powerful tools, built around real child psychology — designed to make your parenting journey easier, calmer, and more confident.
            </Text>

            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.featureCard, { borderColor: `${f.color}40` }]}>
                <View style={styles.featureHeader}>
                  <View style={[styles.featureIcon, { backgroundColor: `${f.color}25` }]}>
                    <Ionicons name={f.icon} size={24} color={f.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={[styles.featureTagline, { color: f.color }]}>{f.tagline}</Text>
                  </View>
                </View>
                <View style={styles.bulletList}>
                  {f.bullets.map((b) => (
                    <View key={b} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: f.color }]} />
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Final CTA */}
          <View style={styles.finalCtaCard}>
            <View style={styles.finalIconBox}>
              <Ionicons name="rocket" size={28} color="#fff" />
            </View>
            <Text style={styles.finalTitle}>
              Ready to be a more{"\n"}confident parent?
            </Text>
            <Text style={styles.finalSub}>
              Join AmyNest AI today — get your first personalized plan in under 2 minutes. Completely free, no credit card.
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
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.trustText}>Privacy-first</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="flash" size={14} color="#F59E0B" />
                <Text style={styles.trustText}>Instant plans</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="heart" size={14} color="#EC4899" />
                <Text style={styles.trustText}>Loved by parents</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Where Smart Parenting Begins</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Floating Amy Mascot — bottom right, fixed */}
      <View
        pointerEvents="box-none"
        style={[styles.mascotFloater, { bottom: insets.bottom + 20 }]}
      >
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
                colors={["#A855F7", "#EC4899"]}
                style={styles.mascotBox}
              >
                <Text style={styles.mascotEmoji}>🤖</Text>
                <View style={styles.mascotBadge}>
                  <Text style={styles.mascotBadgeText}>AI</Text>
                </View>
              </LinearGradient>
            </Animated.View>
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>💬 Talk to Amy</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
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

  /* nav */
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  navBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  navLogoCircle: {
    width: 36, height: 36, borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
  },
  navLogoImg: { width: 36, height: 36 },
  navBrandText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  navBrandAccent: { color: "#C4B5FD" },
  navSignIn: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Inter_600SemiBold", paddingHorizontal: 10, paddingVertical: 6 },

  /* hero */
  hero: { alignItems: "center", marginTop: 16, marginBottom: 32 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 24,
  },
  badgeText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: "Inter_600SemiBold" },

  /* big middle logo */
  bigLogoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 26 },
  bigLogoGlow: {
    position: "absolute",
    width: 200, height: 200, borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.35)",
    top: -10,
  },
  bigLogoCircle: {
    width: 170, height: 170, borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#A855F7", shadowOpacity: 0.7, shadowRadius: 30, shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  bigLogoImg: { width: 170, height: 170 },

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

  /* features */
  featuresWrap: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 24, lineHeight: 30, color: "#fff", fontFamily: "Inter_700Bold",
    textAlign: "center", marginBottom: 10, letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 14, lineHeight: 20, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular",
    textAlign: "center", marginBottom: 22, paddingHorizontal: 6,
  },
  featureCard: {
    padding: 18, borderRadius: 22, marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
  },
  featureHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  featureIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  featureTitle: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 2 },
  featureTagline: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bulletList: { gap: 9, paddingLeft: 4 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { flex: 1, color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },

  /* final cta */
  finalCtaCard: {
    alignItems: "center",
    padding: 28, borderRadius: 28, marginBottom: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  finalIconBox: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: "#A855F7",
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#EC4899", shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  finalTitle: {
    fontSize: 24, lineHeight: 30, color: "#fff", fontFamily: "Inter_700Bold",
    textAlign: "center", marginBottom: 12, letterSpacing: -0.3,
  },
  finalSub: {
    fontSize: 14, lineHeight: 21, color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 22, paddingHorizontal: 4,
  },
  trustRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 18, flexWrap: "wrap" },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  trustText: { color: "rgba(255,255,255,0.7)", fontSize: 11.5, fontFamily: "Inter_600SemiBold" },

  /* footer */
  footer: { alignItems: "center", paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  footerText: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Inter_400Regular" },

  /* floating mascot bottom-right */
  mascotFloater: {
    position: "absolute",
    right: 18,
    alignItems: "center",
  },
  mascotWrap: { alignItems: "center", justifyContent: "center" },
  mascotPulse: {
    position: "absolute",
    width: 80, height: 80, borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.5)",
  },
  mascotBox: {
    width: 64, height: 64, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#A855F7", shadowOpacity: 0.7, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  mascotEmoji: { fontSize: 30 },
  mascotBadge: {
    position: "absolute",
    bottom: -4, right: -4,
    backgroundColor: "#fff",
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2, borderColor: "#A855F7",
  },
  mascotBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#A855F7" },
  tooltip: {
    position: "absolute", bottom: -28,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  tooltipText: { fontSize: 10, color: "#0f0c29", fontFamily: "Inter_600SemiBold" },
});
