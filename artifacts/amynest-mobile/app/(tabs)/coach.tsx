import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import * as Haptics from "expo-haptics";

type Child = { id: number; name: string; age: number };

type Win = {
  win: number; title: string; objective: string;
  deep_explanation: string; actions: string[];
  example: string; micro_task: string; duration: string;
};

type CoachPlan = { title: string; root_cause: string; summary: string; wins: Win[] };
type CoachApiResponse = { plan?: CoachPlan; title?: string; wins?: Win[]; root_cause?: string; summary?: string };

const GOALS = [
  { id: "manage-tantrums", label: "Tantrums" },
  { id: "emotional-regulation", label: "Emotional Regulation" },
  { id: "reduce-defiance", label: "Not Listening" },
  { id: "handle-aggression", label: "Aggression" },
  { id: "separation-anxiety", label: "Separation Anxiety" },
  { id: "balance-screen-time", label: "Screen Time" },
  { id: "improve-sleep-patterns", label: "Sleep Issues" },
  { id: "fix-bedtime-resistance", label: "Bedtime Resistance" },
  { id: "navigate-fussy-eating", label: "Fussy Eating" },
  { id: "boost-concentration", label: "Focus/Concentration" },
  { id: "reduce-homework-resistance", label: "Homework Resistance" },
  { id: "handle-working-parent-guilt", label: "Working Parent Guilt" },
];

const AGE_GROUPS = ["2-4", "5-7", "8-10"];

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const authFetch = useAuthFetch();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string>("5-7");
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedWin, setExpandedWin] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: () => authFetch("/api/children").then(r => r.json()),
  });

  const handleGenerate = async () => {
    if (!selectedGoal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);
    setPlan(null);

    const child = children.find(c => c.id === selectedChild);
    const ag = child ? (child.age < 5 ? "2-4" : child.age < 8 ? "5-7" : "8-10") : ageGroup;

    try {
      const res = await authFetch("/api/ai-coach", {
        method: "POST",
        body: JSON.stringify({ goal: selectedGoal, ageGroup: ag }),
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
        const text = await res.text();
        let accumulated = "";
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;
            try {
              const parsed = JSON.parse(raw) as { choices?: { delta?: { content?: string } }[]; content?: string };
              const delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.content ?? "";
              accumulated += delta;
            } catch {
              accumulated += raw;
            }
          }
        }
        try {
          const outer = JSON.parse(accumulated) as CoachApiResponse;
          const coachPlan: CoachPlan | undefined = outer?.plan ?? (
            outer.title && outer.wins ? { title: outer.title, root_cause: outer.root_cause ?? "", summary: outer.summary ?? "", wins: outer.wins } : undefined
          );
          if (coachPlan?.title && coachPlan?.wins) {
            setPlan(coachPlan);
          } else {
            setError("Could not parse plan from response.");
          }
        } catch {
          setError("Could not generate plan. Please try again.");
        }
      } else {
        const data = (await res.json()) as CoachApiResponse;
        const coachPlan: CoachPlan | undefined = data?.plan ?? (
          data.title && data.wins ? { title: data.title, root_cause: data.root_cause ?? "", summary: data.summary ?? "", wins: data.wins } : undefined
        );
        if (coachPlan?.title && coachPlan?.wins) {
          setPlan(coachPlan);
        } else {
          setError("Could not generate plan. Please try again.");
        }
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 90, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={[styles.amyBadge, { backgroundColor: colors.secondary }]}>
            <Ionicons name="bulb" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Amy Coach</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>AI-powered parenting guidance</Text>
          </View>
        </View>

        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Select Child (optional)</Text>
            <FlatList
              horizontal
              data={children}
              keyExtractor={c => String(c.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              scrollEnabled={children.length > 2}
              renderItem={({ item: c }) => {
                const active = selectedChild === c.id;
                return (
                  <TouchableOpacity
                    style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
                    onPress={() => setSelectedChild(active ? null : c.id)}
                  >
                    <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {!selectedChild && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Child's Age Group</Text>
            <View style={styles.row}>
              {AGE_GROUPS.map(ag => {
                const active = ageGroup === ag;
                return (
                  <TouchableOpacity
                    key={ag}
                    style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border, flex: 1 }]}
                    onPress={() => setAgeGroup(ag)}
                  >
                    <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>{ag} yrs</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>What do you want help with?</Text>
          <View style={styles.goalGrid}>
            {GOALS.map(g => {
              const active = selectedGoal === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalChip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
                  onPress={() => setSelectedGoal(active ? null : g.id)}
                >
                  <Text style={[styles.goalChipText, { color: active ? "#fff" : colors.foreground }]}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: selectedGoal ? colors.primary : colors.muted, opacity: loading ? 0.7 : 1 }]}
          onPress={handleGenerate}
          disabled={!selectedGoal || loading}
          testID="generate-plan-btn"
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color={selectedGoal ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.generateBtnText, { color: selectedGoal ? "#fff" : colors.mutedForeground }]}>
                Generate Plan
              </Text>
            </>
          )}
        </TouchableOpacity>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {plan && (
          <View style={styles.planContainer}>
            <View style={[styles.planHeader, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.planTitle, { color: colors.primary }]}>{plan.title}</Text>
              <Text style={[styles.planSummary, { color: colors.foreground }]}>{plan.summary}</Text>
            </View>

            {plan.wins.slice(0, 12).map((win, idx) => {
              const expanded = expandedWin === win.win;
              return (
                <TouchableOpacity
                  key={win.win}
                  style={[styles.winCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setExpandedWin(expanded ? null : win.win)}
                  testID={`win-card-${win.win}`}
                >
                  <View style={styles.winHeader}>
                    <View style={[styles.winNum, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.winNumText, { color: colors.primary }]}>{win.win}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.winTitle, { color: colors.foreground }]}>{win.title}</Text>
                      <Text style={[styles.winObj, { color: colors.mutedForeground }]} numberOfLines={expanded ? undefined : 1}>{win.objective}</Text>
                    </View>
                    <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                  </View>

                  {expanded && (
                    <View style={styles.winBody}>
                      <Text style={[styles.winExplain, { color: colors.foreground }]}>{win.deep_explanation}</Text>

                      <Text style={[styles.actionsLabel, { color: colors.mutedForeground }]}>Steps</Text>
                      {win.actions.map((a, i) => (
                        <View key={i} style={styles.actionRow}>
                          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                          <Text style={[styles.actionText, { color: colors.foreground }]}>{a}</Text>
                        </View>
                      ))}

                      <View style={[styles.microCard, { backgroundColor: colors.secondary }]}>
                        <Ionicons name="flash" size={14} color={colors.primary} />
                        <Text style={[styles.microText, { color: colors.primary }]}>{win.micro_task}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  amyBadge: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  section: { marginBottom: 20, gap: 10 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, alignItems: "center" },
  chipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  row: { flexDirection: "row", gap: 10 },
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  goalChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  goalChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, marginBottom: 20 },
  generateBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  errorText: { color: "#EF4444", fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  planContainer: { gap: 12, marginBottom: 8 },
  planHeader: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  planTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  planSummary: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  winCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  winHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  winNum: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 },
  winNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  winTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  winObj: { fontSize: 13, fontFamily: "Inter_400Regular" },
  winBody: { gap: 12 },
  winExplain: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  actionsLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  actionText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  microCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12 },
  microText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
});
