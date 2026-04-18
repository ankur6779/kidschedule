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

const FEATURES = [
  {
    icon: "bulb" as const,
    title: "AI Coach",
    desc: "Deep, personalized step-by-step parenting plans rooted in child psychology — built just for your child.",
    gradient: ["#A855F7", "#6366F1"] as const,
  },
  {
    icon: "calendar" as const,
    title: "Smart Routines",
    desc: "Structured daily routines that help your child build strong, lasting habits effortlessly.",
    gradient: ["#06B6D4", "#3B82F6"] as const,
  },
  {
    icon: "grid" as const,
    title: "Parent Hub",
    desc: "Activities, insights, and curated parenting guidance — everything you need in one place.",
    gradient: ["#EC4899", "#F97316"] as const,
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

          {/* FEATURES */}
          <View style={styles.featuresWrap}>
            <Text style={styles.sectionTitle}>Everything you need to parent smarter</Text>
            <Text style={styles.sectionSub}>
              Three powerful tools, one beautifully simple app — built around your family.
            </Text>

            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <LinearGradient
                  colors={f.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureIcon}
                >
                  <Ionicons name={f.icon} size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
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
  bigLogoImg: { width: 144, height: 144, borderRadius: 28 },

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

  /* FEATURES */
  featuresWrap: { paddingTop: 12, paddingBottom: 32 },
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
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  featureCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    gap: 14,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A855F7",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  featureTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  featureDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 20,
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
