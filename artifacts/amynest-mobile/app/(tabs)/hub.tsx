import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
  Image, Platform, LayoutAnimation, UIManager,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useTheme } from "@/contexts/ThemeContext";
import { LifeSkillsZone } from "@/components/LifeSkillsZone";
import InfantHub from "@/components/InfantHub";
import { isInfantHubAge } from "@workspace/infant-hub";
import { useProfileComplete } from "@/hooks/useProfileComplete";
import { ProfileLockScreen } from "@/components/ProfileLockScreen";

const LOGO = require("../../assets/images/amynest-logo.png");

type Child = { id: number; name: string; age: number; ageMonths?: number };

const AMY_PROMPTS = [
  { emoji: "😴", label: "Sleep problems", prompt: "My child is having trouble sleeping. What should I do?" },
  { emoji: "😤", label: "Tantrums",       prompt: "My child is having frequent tantrums. How should I handle this?" },
  { emoji: "🥦", label: "Picky eating",   prompt: "My child is a picky eater. What strategies can help?" },
  { emoji: "📚", label: "School anxiety", prompt: "My child is anxious about going to school. How can I help?" },
  { emoji: "📱", label: "Screen time",    prompt: "How much screen time is appropriate?" },
  { emoji: "💬", label: "Language",       prompt: "How can I support my child's language development?" },
];

const EMOTIONAL = [
  { emoji: "🫂", title: "I'm feeling overwhelmed",    prompt: "I'm feeling completely overwhelmed as a parent. What can I do?" },
  { emoji: "😰", title: "My child seems anxious",     prompt: "My child seems anxious and worried a lot. How can I help?" },
  { emoji: "😔", title: "We're struggling to connect", prompt: "I feel like my child and I aren't connecting. How can we build a stronger bond?" },
  { emoji: "😮‍💨", title: "I need a parenting break", prompt: "I'm a parent who needs time for myself. How do I take care of my wellbeing?" },
];

function ageGroup(age: number, months = 0): { label: string; emoji: string } {
  const total = age * 12 + months;
  if (total < 12) return { label: "Infant", emoji: "👶" };
  if (total < 36) return { label: "Toddler", emoji: "🧒" };
  if (total < 60) return { label: "Preschool", emoji: "🎨" };
  if (total < 144) return { label: "School age", emoji: "📚" };
  return { label: "Teen", emoji: "🎒" };
}

export default function HubScreen() {
  const { profileComplete, isLoading: profileLoading } = useProfileComplete();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { theme } = useTheme();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("amy");

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: async () => {
      const r = await authFetch("/api/children");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const effective = useMemo(() => {
    if (!children?.length) return null;
    return selectedId ? children.find(c => c.id === selectedId) ?? children[0] : children[0];
  }, [children, selectedId]);

  const grp = effective ? ageGroup(effective.age, effective.ageMonths ?? 0) : null;

  const askAmy = (q: string) => {
    router.push({ pathname: "/amy-ai", params: { q } });
  };

  if (!profileLoading && !profileComplete) {
    return <ProfileLockScreen sectionName="Hub" />;
  }

  return (
    <LinearGradient colors={theme.gradient} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 140,
          paddingHorizontal: 16,
          gap: 16,
        }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Parenting Hub</Text>
            <Text style={styles.subtitle}>Articles, tips, activities & support</Text>
          </View>
          <Pressable
            onPress={() => router.push("/amy-ai")}
            style={styles.askAmyBtn}
          >
            <LinearGradient colors={["#FFD27A", "#FF4ECD", "#7B3FF2"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.askAmyGrad}>
              <Ionicons name="chatbubbles" size={14} color="#fff" />
              <Text style={styles.askAmyText}>Ask Amy</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Premium Parent Hub entry */}
        <Pressable
          onPress={() => router.push("/hub/premium" as never)}
          accessibilityRole="button"
          accessibilityLabel="Open the premium Parent Hub"
          testID="open-premium-hub"
          style={{ borderRadius: 22, overflow: "hidden" }}
        >
          <LinearGradient
            colors={["#A855F7", "#EC4899", "#F97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flexDirection: "row", alignItems: "center", padding: 18, gap: 14 }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}>
              <Ionicons name="grid" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: -0.2 }}>
                Premium Parent Hub
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>
                Tools, activities, insights & personalised picks
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        {isLoading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color="#FF4ECD" />
          </View>
        )}

        {!isLoading && children.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="baby-face-outline" size={48} color="#FF4ECD" />
            <Text style={styles.emptyTitle}>Add a child to get started</Text>
            <Text style={styles.emptyDesc}>Personalized tips, articles, and activities unlock once Amy knows your child.</Text>
            <Pressable onPress={() => router.push("/children/new")} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Add Child</Text>
            </Pressable>
          </View>
        )}

        {/* Child selector */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {children.map(c => {
              const g = ageGroup(c.age, c.ageMonths ?? 0);
              const isSel = effective?.id === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedId(c.id)}
                  style={[styles.chip, isSel && styles.chipActive]}
                >
                  <Text style={{ fontSize: 18 }}>{g.emoji}</Text>
                  <View>
                    <Text style={[styles.chipName, isSel && { color: "#fff" }]}>{c.name}</Text>
                    <Text style={[styles.chipAge, isSel && { color: "rgba(255,255,255,0.85)" }]}>{g.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Infant & Toddler Hub — only when any child is ≤ 24 months */}
        {(() => {
          const selMonths = effective ? effective.age * 12 + (effective.ageMonths ?? 0) : -1;
          const target = isInfantHubAge(selMonths)
            ? effective
            : children
                .map(c => ({ child: c, months: c.age * 12 + (c.ageMonths ?? 0) }))
                .filter(x => isInfantHubAge(x.months))
                .sort((a, b) => a.months - b.months)[0]?.child;
          if (!target) return null;
          const m = target.age * 12 + (target.ageMonths ?? 0);
          return <InfantHub childName={target.name} ageMonths={m} />;
        })()}

        {effective && grp && (
          <View style={styles.agePillRow}>
            <View style={styles.agePill}>
              <Text style={{ color: "#FFD27A", fontWeight: "700" }}>{grp.emoji} {grp.label}</Text>
            </View>
            <Text style={styles.personalised}>Personalised for <Text style={{ color: "#fff", fontWeight: "700" }}>{effective.name}</Text></Text>
          </View>
        )}

        {/* Sections */}
        <Section
          id="amy"
          icon={<MaterialCommunityIcons name="brain" size={20} color="#fff" />}
          accent={["#7B3FF2", "#FF4ECD"]}
          title="Ask Amy AI"
          desc="Warm, practical parenting advice — instantly"
          open={openSection === "amy"}
          onToggle={() => setOpenSection(s => s === "amy" ? null : "amy")}
        >
          <Text style={styles.sectionLead}>Tap a topic and Amy will reply.</Text>
          <View style={styles.promptsGrid}>
            {AMY_PROMPTS.map(p => (
              <Pressable key={p.label} onPress={() => askAmy(p.prompt)} style={styles.promptChip}>
                <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
                <Text style={styles.promptLabel}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => router.push("/amy-ai")} style={styles.askAmyFull}>
            <Ionicons name="chatbubbles" size={16} color="#fff" />
            <Text style={styles.askAmyFullText}>Ask Amy anything</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </Section>

        <Section
          id="articles"
          icon={<Ionicons name="book" size={20} color="#fff" />}
          accent={["#10B981", "#34D399"]}
          title="Parenting Articles"
          desc="Research-based, age-matched reading"
          open={openSection === "articles"}
          onToggle={() => setOpenSection(s => s === "articles" ? null : "articles")}
        >
          <Text style={styles.sectionLead}>
            {effective
              ? `Curated for ${effective.name}'s age. Open the web app for the full library.`
              : "Add a child to see matched articles."}
          </Text>
          <View style={styles.articleList}>
            {[
              { t: "Positive discipline 101", e: "🌱" },
              { t: "Building emotional vocabulary", e: "💬" },
              { t: "Why play matters", e: "🧩" },
            ].map(a => (
              <View key={a.t} style={styles.articleItem}>
                <Text style={{ fontSize: 18 }}>{a.e}</Text>
                <Text style={styles.articleTitle}>{a.t}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </View>
            ))}
          </View>
        </Section>

        <Section
          id="tips"
          icon={<Ionicons name="sparkles" size={20} color="#fff" />}
          accent={["#A78BFA", "#7B3FF2"]}
          title="Daily Tips"
          desc="Amy AI picks today's best tips"
          open={openSection === "tips"}
          onToggle={() => setOpenSection(s => s === "tips" ? null : "tips")}
        >
          {effective ? (
            <View style={styles.tipsList}>
              {[
                "Catch them being good — name the behavior aloud.",
                "Offer two acceptable choices to defuse power struggles.",
                "Read together for 10 min before bed to anchor the routine.",
              ].map((t, i) => (
                <View key={i} style={styles.tipCard}>
                  <Text style={styles.tipNum}>{i + 1}</Text>
                  <Text style={styles.tipText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.sectionLead}>Add a child to unlock daily tips.</Text>
          )}
        </Section>

        <Section
          id="emotional"
          icon={<Ionicons name="heart" size={20} color="#fff" />}
          accent={["#F472B6", "#FF4ECD"]}
          title="Emotional Support"
          desc="For the tough parenting days"
          open={openSection === "emotional"}
          onToggle={() => setOpenSection(s => s === "emotional" ? null : "emotional")}
        >
          <Text style={styles.sectionLead}>Parenting is hard. Amy will listen — no judgment.</Text>
          <View style={styles.emotionalGrid}>
            {EMOTIONAL.map(e => (
              <Pressable key={e.title} onPress={() => askAmy(e.prompt)} style={styles.emoCard}>
                <Text style={{ fontSize: 22 }}>{e.emoji}</Text>
                <Text style={styles.emoTitle}>{e.title}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section
          id="activities"
          icon={<Ionicons name="color-palette" size={20} color="#fff" />}
          accent={["#FB7185", "#F59E0B"]}
          title="Activities & Learning"
          desc="Age-based games, stories & skills"
          open={openSection === "activities"}
          onToggle={() => setOpenSection(s => s === "activities" ? null : "activities")}
        >
          <Text style={styles.sectionLead}>Amy curates activities by age. Tap below to open the full library on the web app.</Text>
          <View style={styles.activityRow}>
            {["Stories", "Puzzles", "Crafts", "Songs"].map(a => (
              <View key={a} style={styles.activityCard}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{a}</Text>
              </View>
            ))}
          </View>
        </Section>

        {effective && effective.age >= 2 && effective.age <= 15 && (
          <Section
            id="life-skills"
            icon={<Ionicons name="compass" size={20} color="#fff" />}
            accent={["#10B981", "#34D399"]}
            title="🧭 Life Skills Mode"
            desc="Daily real-life skills, ages 2–15"
            open={openSection === "life-skills"}
            onToggle={() => setOpenSection(s => s === "life-skills" ? null : "life-skills")}
          >
            <LifeSkillsZone child={{ id: effective.id, name: effective.name, age: effective.age }} />
          </Section>
        )}

        {/* Bottom CTA */}
        <Pressable onPress={() => router.push("/(tabs)/routines")} style={styles.bottomCta}>
          <Ionicons name="calendar" size={16} color="#FF4ECD" />
          <Text style={styles.bottomCtaText}>Generate today's routine</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

function Section({
  id, icon, accent, title, desc, open, onToggle, children,
}: {
  id: string;
  icon: React.ReactNode;
  accent: [string, string];
  title: string;
  desc: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const handlePress = () => {
    LayoutAnimation.configureNext({
      duration: 240,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    onToggle();
  };
  return (
    <View style={[styles.section, open && styles.sectionOpen]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.sectionHeader, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <LinearGradient
          colors={accent}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.sectionIcon}
        >
          {icon}
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDesc}>{desc}</Text>
        </View>
        <View style={[styles.chevWrap, open && styles.chevWrapOpen]}>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={14}
            color={open ? "#FF4ECD" : "rgba(255,255,255,0.65)"}
          />
        </View>
      </Pressable>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 10 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", fontFamily: Platform.select({ default: undefined }) },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },
  askAmyBtn: { borderRadius: 999, overflow: "hidden" },
  askAmyGrad: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  askAmyText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  emptyCard: {
    padding: 24, borderRadius: 24, alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  emptyTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  emptyDesc: { color: "rgba(255,255,255,0.6)", textAlign: "center", fontSize: 13 },
  primaryBtn: { backgroundColor: "#7B3FF2", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, marginTop: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },

  chip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  chipActive: { backgroundColor: "rgba(123,63,242,0.4)", borderColor: "#FF4ECD" },
  chipName: { color: "rgba(255,255,255,0.9)", fontWeight: "700", fontSize: 13 },
  chipAge: { color: "rgba(255,255,255,0.55)", fontSize: 10 },

  agePillRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  agePill: { backgroundColor: "rgba(255,210,122,0.12)", borderWidth: 1, borderColor: "rgba(255,210,122,0.4)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  personalised: { color: "rgba(255,255,255,0.6)", fontSize: 12 },

  // Glass card — RN can't do CSS backdrop-filter, so we approximate with
  // a soft translucent fill, a subtle inner-light border, and an outer glow
  // (shadow on iOS / elevation on Android) that intensifies when open.
  section: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
    shadowColor: "#7B3FF2",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionOpen: {
    borderColor: "rgba(255,78,205,0.55)",
    backgroundColor: "rgba(255,255,255,0.07)",
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  sectionIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  sectionTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
  sectionDesc: { color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 },
  sectionBody: {
    padding: 14, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 10,
  },
  chevWrap: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chevWrapOpen: { borderColor: "rgba(255,78,205,0.6)", backgroundColor: "rgba(255,78,205,0.12)" },
  sectionLead: { color: "rgba(255,255,255,0.65)", fontSize: 13 },

  promptsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  promptChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    flexBasis: "48%", flexGrow: 1,
  },
  promptLabel: { color: "rgba(255,255,255,0.85)", fontWeight: "600", fontSize: 12 },
  askAmyFull: {
    marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(123,63,242,0.25)",
    borderWidth: 1, borderColor: "rgba(255,78,205,0.4)",
  },
  askAmyFullText: { color: "#fff", fontWeight: "700", flex: 1, textAlign: "center" },

  articleList: { gap: 6 },
  articleItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)" },
  articleTitle: { color: "#fff", flex: 1, fontWeight: "600", fontSize: 13 },

  tipsList: { gap: 8 },
  tipCard: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "rgba(167,139,250,0.1)", borderWidth: 1, borderColor: "rgba(167,139,250,0.25)" },
  tipNum: { color: "#FF4ECD", fontWeight: "800", fontSize: 16 },
  tipText: { color: "rgba(255,255,255,0.85)", flex: 1, fontSize: 13, lineHeight: 18 },

  emotionalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emoCard: {
    padding: 12, borderRadius: 14, gap: 4, flexBasis: "48%", flexGrow: 1,
    backgroundColor: "rgba(244,114,182,0.1)", borderWidth: 1, borderColor: "rgba(244,114,182,0.25)",
  },
  emoTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },

  activityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  activityCard: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(251,113,133,0.18)", borderWidth: 1, borderColor: "rgba(251,113,133,0.3)" },

  bottomCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  bottomCtaText: { color: "#FF4ECD", fontWeight: "700" },
});
