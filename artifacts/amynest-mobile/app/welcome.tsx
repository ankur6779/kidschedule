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
  Image,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOGO = require("../assets/images/amynest-logo.png");

const COACH_HIGHLIGHTS = [
  "Personalized plans for your child",
  "10–12 step deep solutions",
  "Progress tracking built-in",
  "Continuous guidance until solved",
];

const PROBLEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
  { icon: "flame", label: "Tantrums & Anger", color: "#EF4444" },
  { icon: "phone-portrait", label: "Screen Addiction", color: "#06B6D4" },
  { icon: "moon", label: "Sleep Problems", color: "#6366F1" },
  { icon: "ear-outline", label: "Not Listening", color: "#F97316" },
  { icon: "restaurant", label: "Fussy Eating", color: "#EC4899" },
  { icon: "locate", label: "Low Focus", color: "#A855F7" },
];

const SECONDARY_FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string; gradient: readonly [string, string] }[] = [
  {
    icon: "calendar",
    title: "Smart Daily Routine",
    desc: "Create structured, personalized routines that help your child build strong habits.",
    gradient: ["#06B6D4", "#3B82F6"] as const,
  },
  {
    icon: "grid",
    title: "Parent Hub",
    desc: "Access activities, insights, and curated parenting guidance in one place.",
    gradient: ["#EC4899", "#F97316"] as const,
  },
  {
    icon: "flash",
    title: "Quick AI Help",
    desc: "Ask anything and get instant parenting advice anytime, right when you need it.",
    gradient: ["#FFD166", "#F97316"] as const,
  },
];

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  {
    icon: "locate",
    title: "Choose your goal",
    desc: "Pick the parenting challenge you want to solve — from tantrums to sleep.",
  },
  {
    icon: "help-circle",
    title: "Answer a few questions",
    desc: "Tell Amy about your child's age, personality, and current habits.",
  },
  {
    icon: "list",
    title: "Get your step-by-step plan",
    desc: "Receive a personalized, science-backed plan you can start today.",
  },
];

const TRUST_PILLARS: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  {
    icon: "book",
    title: "Habit Formation",
    desc: "Built on proven principles of how children form lasting habits.",
  },
  {
    icon: "flask",
    title: "Behavioral Research",
    desc: "Grounded in modern child psychology and emotional development science.",
  },
  {
    icon: "shield-checkmark",
    title: "Real Frameworks",
    desc: "Practical parenting frameworks used by experts worldwide.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const floatY = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(colorAnim, { toValue: 4, duration: 4000, easing: Easing.linear, useNativeDriver: false }),
    ).start();
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const titleColor = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ["#7B3FF2", "#FF4ECD", "#4FC3F7", "#FFD166", "#7B3FF2"],
  });

  const tap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleStart = () => {
    tap();
    router.push("/sign-up");
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        locations={[0, 0.55, 1]}
        style={styles.container}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
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
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* NAV — minimal (matches web) */}
          <View style={styles.nav}>
            <View style={styles.navBrand}>
              <Image source={LOGO} style={styles.navLogo} resizeMode="contain" />
              <Text style={styles.navBrandText}>
                AmyNest <Text style={styles.navBrandAi}>AI</Text>
              </Text>
            </View>
            <Link href="/sign-in" asChild>
              <TouchableOpacity testID="link-sign-in" activeOpacity={0.7}>
                <Text style={styles.navSignIn}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* HERO */}
          <Animated.View style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            {/* Glass badge */}
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={12} color="#C4B5FD" />
              <Text style={styles.badgeText}>AI-Powered Parenting Coach</Text>
            </View>

            {/* Floating logo — centered */}
            <Animated.View style={[styles.bigLogoWrap, { transform: [{ translateY: floatY }] }]}>
              <View style={styles.bigLogoGlow} />
              <Image source={LOGO} style={styles.bigLogoImg} resizeMode="contain" />
            </Animated.View>

            {/* Headline — color cycling */}
            <Animated.Text style={[styles.title, { color: titleColor }]}>
              Where Smart Parenting Begins
            </Animated.Text>

            {/* Subtext */}
            <Text style={styles.subtitle}>
              Get step-by-step, science-backed parenting plans personalized for your child — by your AI Parenting Coach.
            </Text>

            {/* Primary CTA */}
            <TouchableOpacity onPress={handleStart} activeOpacity={0.9} testID="button-hero-cta" style={styles.ctaWrap}>
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

          {/* PROBLEM HOOK */}
          <View style={styles.sectionWrap}>
            <View style={styles.eyebrow}>
              <Ionicons name="sparkles" size={11} color="#F472B6" />
              <Text style={styles.eyebrowText}>REAL PARENTING PROBLEMS</Text>
            </View>
            <Text style={styles.sectionTitle}>Struggling with these?</Text>
            <Text style={styles.sectionSub}>
              Every parent faces them. Amy Coach helps you solve them — one personalized step at a time.
            </Text>

            <View style={styles.problemsGrid}>
              {PROBLEMS.map((p) => (
                <View key={p.label} style={styles.problemCard}>
                  <View
                    style={[
                      styles.problemIcon,
                      { backgroundColor: `${p.color}25`, borderColor: `${p.color}55` },
                    ]}
                  >
                    <Ionicons name={p.icon} size={18} color={p.color} />
                  </View>
                  <Text style={styles.problemLabel} numberOfLines={2}>
                    {p.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.problemFooter}>
              You're not alone — and you don't have to figure it out yourself.
            </Text>
          </View>

          {/* AMY COACH — CORE FEATURE */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Everything You Need for Smarter Parenting</Text>
            <Text style={styles.sectionSub}>
              One platform. Multiple powerful tools designed for your child.
            </Text>

            <View style={styles.coachCard}>
              <View style={styles.coachHeaderRow}>
                <LinearGradient
                  colors={["#A855F7", "#6366F1"] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.coachIcon}
                >
                  <Ionicons name="bulb" size={26} color="#fff" />
                </LinearGradient>
                <View style={styles.coachHeaderText}>
                  <View style={styles.coachTitleRow}>
                    <Text style={styles.coachTitle}>Amy Coach</Text>
                    <LinearGradient
                      colors={["#A855F7", "#EC4899"] as const}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.corePill}
                    >
                      <Text style={styles.corePillText}>CORE FEATURE</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
              <Text style={styles.coachSub}>
                From tantrums to screen time, sleep to focus — Amy Coach gives you deep, personalized step-by-step plans that actually work. No generic advice, only science-backed solutions tailored to your child.
              </Text>
              <View style={styles.coachBullets}>
                {COACH_HIGHLIGHTS.map((h) => (
                  <View key={h} style={styles.coachBullet}>
                    <Ionicons name="checkmark-circle" size={18} color="#C4B5FD" />
                    <Text style={styles.coachBulletText}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Secondary features grid (2-col) */}
            <View style={styles.secondaryGrid}>
              {SECONDARY_FEATURES.map((f) => (
                <View key={f.title} style={styles.secondaryCard}>
                  <LinearGradient
                    colors={f.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.secondaryIcon}
                  >
                    <Ionicons name={f.icon} size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.secondaryTitle}>{f.title}</Text>
                  <Text style={styles.secondaryDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>

            {/* Mid CTA */}
            <Text style={styles.midCtaText}>
              Start with Amy Coach and explore more as you grow.
            </Text>
            <TouchableOpacity onPress={handleStart} activeOpacity={0.9} testID="button-features-cta" style={[styles.ctaWrap, { marginTop: 14 }]}>
              <LinearGradient
                colors={["#A855F7", "#EC4899"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.cta, { minWidth: 220, paddingVertical: 14 }]}
              >
                <Text style={[styles.ctaText, { fontSize: 15 }]}>Get Started</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* HOW IT WORKS */}
          <View style={styles.sectionWrap}>
            <View style={styles.eyebrow}>
              <Ionicons name="flash" size={11} color="#FFD166" />
              <Text style={styles.eyebrowText}>GET STARTED IN MINUTES</Text>
            </View>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <Text style={styles.sectionSub}>
              Three simple steps to your first personalized parenting plan.
            </Text>

            {STEPS.map((s, idx) => (
              <View key={s.title} style={styles.stepCard}>
                <LinearGradient
                  colors={["#A855F7", "#EC4899"] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stepNumber}
                >
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </LinearGradient>
                <LinearGradient
                  colors={["#A855F7", "#6366F1"] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stepIcon}
                >
                  <Ionicons name={s.icon} size={22} color="#fff" />
                </LinearGradient>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            ))}
          </View>

          {/* TRUST / SCIENCE */}
          <View style={styles.trustWrap}>
            <View style={styles.trustHeaderIcon}>
              <Ionicons name="shield-checkmark" size={26} color="#fff" />
            </View>
            <Text style={styles.trustTitle}>Built on Child Psychology &amp; Behavioral Science</Text>
            <Text style={styles.trustSub}>
              Every plan is grounded in proven research — not generic advice. Trust the framework, follow the steps.
            </Text>
            {TRUST_PILLARS.map((t) => (
              <View key={t.title} style={styles.trustCard}>
                <View style={styles.trustCardIcon}>
                  <Ionicons name={t.icon} size={18} color="#C4B5FD" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trustCardTitle}>{t.title}</Text>
                  <Text style={styles.trustCardDesc}>{t.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* FINAL CTA */}
          <View style={styles.finalCtaCard}>
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.finalCtaIcon}
            >
              <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.finalCtaTitle}>Ready to start your parenting journey?</Text>
            <Text style={styles.finalCtaSub}>
              Join AmyNest AI and get a personalized parenting plan in minutes — completely free.
            </Text>
            <TouchableOpacity onPress={handleStart} activeOpacity={0.9} testID="button-final-cta" style={styles.ctaWrap}>
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
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerBrand}>
              <Image source={LOGO} style={styles.footerLogo} resizeMode="contain" />
              <Text style={styles.footerBrandText}>
                AmyNest <Text style={styles.navBrandAi}>AI</Text>
              </Text>
            </View>
            <Text style={styles.footerTag}>Where Smart Parenting Begins</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Glow blobs */
  blobsContainer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 9999 },
  blob1: { width: 420, height: 420, top: -120, left: -120, backgroundColor: "rgba(168,85,247,0.30)" },
  blob2: { width: 480, height: 480, top: 280, right: -160, backgroundColor: "rgba(59,130,246,0.25)" },
  blob3: { width: 360, height: 360, bottom: -60, left: 40, backgroundColor: "rgba(236,72,153,0.20)" },

  scroll: { paddingHorizontal: 20 },

  /* NAV (matches web) */
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  navBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  navLogo: { width: 32, height: 32, borderRadius: 8 },
  navBrandText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.3,
  },
  navBrandAi: {
    color: "#A855F7",
    fontFamily: "Inter_700Bold",
  },
  navSignIn: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  /* HERO */
  hero: { alignItems: "center", paddingTop: 32, paddingBottom: 40 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 28,
  },
  badgeText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  /* Logo */
  bigLogoWrap: {
    width: 144,
    height: 144,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  bigLogoGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.45)",
    opacity: 0.7,
  },
  bigLogoImg: { width: 144, height: 144, borderRadius: 999 },

  /* Headline */
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 12,
    marginBottom: 28,
  },

  /* CTA */
  ctaWrap: { width: "100%", alignItems: "center" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    minWidth: 280,
    shadowColor: "#A855F7",
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  smallNote: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 18,
    textAlign: "center",
  },

  /* SECTIONS — shared */
  sectionWrap: { paddingTop: 16, paddingBottom: 32 },
  eyebrow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 12,
  },
  eyebrowText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 26,
    lineHeight: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  sectionSub: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    marginBottom: 22,
    paddingHorizontal: 10,
  },

  /* PROBLEMS */
  problemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  problemCard: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  problemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  problemLabel: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  problemFooter: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 10,
  },

  /* COACH CARD */
  coachCard: {
    backgroundColor: "rgba(168,85,247,0.10)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    overflow: "hidden",
  },
  coachHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 14,
  },
  coachIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A855F7",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  coachHeaderText: { flex: 1, paddingTop: 4 },
  coachTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  coachTitle: {
    color: "#fff",
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  corePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  corePillText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  coachSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  coachBullets: { gap: 8 },
  coachBullet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coachBulletText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  /* SECONDARY FEATURES (2-col grid) */
  secondaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  secondaryCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  secondaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryTitle: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  secondaryDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "Inter_400Regular",
  },
  midCtaText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 22,
  },

  /* HOW IT WORKS */
  stepCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 22,
    padding: 20,
    paddingTop: 24,
    marginBottom: 12,
    position: "relative",
  },
  stepNumber: {
    position: "absolute",
    top: -12,
    left: -10,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EC4899",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  stepTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  stepDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },

  /* TRUST */
  trustWrap: {
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.25)",
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
    alignItems: "center",
  },
  trustHeaderIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#6366F1",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  trustTitle: {
    color: "#fff",
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  trustSub: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  trustCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    width: "100%",
  },
  trustCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(168,85,247,0.20)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  trustCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  trustCardDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
  },

  /* FINAL CTA */
  finalCtaCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  finalCtaIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#EC4899",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  finalCtaTitle: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 30,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  finalCtaSub: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    marginBottom: 22,
  },

  /* FOOTER */
  footer: {
    paddingTop: 22,
    paddingBottom: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    gap: 6,
  },
  footerBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerLogo: { width: 24, height: 24, borderRadius: 6 },
  footerBrandText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.80)",
  },
  footerTag: {
    fontSize: 11,
    color: "rgba(255,255,255,0.40)",
    fontFamily: "Inter_500Medium",
  },
});
