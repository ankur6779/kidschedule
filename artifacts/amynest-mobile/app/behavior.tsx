import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useTheme } from "@/contexts/ThemeContext";

type Child = { id: number; name: string };
type Behavior = { id: number; childId: number; childName?: string; date: string; type: string; behavior: string; notes?: string };

const TYPES: { key: string; label: string; emoji: string; color: string }[] = [
  { key: "positive", label: "Positive", emoji: "🌟", color: "#34D399" },
  { key: "negative", label: "Challenging", emoji: "⚡", color: "#FBBF24" },
  { key: "milestone", label: "Milestone", emoji: "🏆", color: "#A78BFA" },
];

export default function BehaviorScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { theme } = useTheme();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ childId: 0, type: "positive", behavior: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: async () => { const r = await authFetch("/api/children"); return r.ok ? r.json() : []; },
  });

  const { data: behaviors = [], isLoading } = useQuery<Behavior[]>({
    queryKey: ["behaviors"],
    queryFn: async () => { const r = await authFetch("/api/behaviors"); return r.ok ? r.json() : []; },
  });

  const handleAdd = async () => {
    if (!form.childId || !form.behavior.trim()) { Alert.alert("Pick a child and describe the behavior"); return; }
    setSaving(true);
    try {
      const r = await authFetch("/api/behaviors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: form.childId,
          type: form.type,
          behavior: form.behavior.trim(),
          notes: form.notes.trim() || undefined,
          date: new Date().toISOString(),
        }),
      });
      if (!r.ok) throw new Error();
      await qc.invalidateQueries({ queryKey: ["behaviors"] });
      setForm({ childId: 0, type: "positive", behavior: "", notes: "" });
      setOpen(false);
    } catch { Alert.alert("Error", "Could not log behavior."); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete", "Remove this entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const r = await authFetch(`/api/behaviors/${id}`, { method: "DELETE" });
          if (!r.ok) throw new Error();
          await qc.invalidateQueries({ queryKey: ["behaviors"] });
        } catch { Alert.alert("Error", "Could not delete."); }
      }},
    ]);
  };

  const grouped = useMemo(() => {
    const groups: Record<string, Behavior[]> = {};
    [...behaviors].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(b => {
      const d = new Date(b.date);
      const key = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      (groups[key] ||= []).push(b);
    });
    return groups;
  }, [behaviors]);

  return (
    <LinearGradient colors={theme.gradient} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <LinearGradient colors={["#FBBF24", "#FB7185"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.headerIcon}>
          <Ionicons name="happy" size={18} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Behavior</Text>
          <Text style={styles.headerSubtitle}>Track moments — Amy spots the patterns</Text>
        </View>
        <Pressable onPress={() => setOpen(true)} style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 14 }}>
        {isLoading && <ActivityIndicator color="#FF4ECD" style={{ marginTop: 40 }} />}
        {!isLoading && behaviors.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="happy-outline" size={48} color="rgba(255,189,36,0.6)" />
            <Text style={styles.emptyTitle}>Start tracking behavior</Text>
            <Text style={styles.emptyDesc}>Log moments — both wins and challenges. Amy uses them to give you better advice.</Text>
            <Pressable onPress={() => setOpen(true)} style={styles.primaryBtn}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Log first moment</Text>
            </Pressable>
          </View>
        )}

        {Object.entries(grouped).map(([day, items]) => (
          <View key={day} style={{ gap: 8 }}>
            <Text style={styles.daySection}>{day}</Text>
            {items.map(b => {
              const t = TYPES.find(x => x.key === b.type) ?? TYPES[0];
              return (
                <View key={b.id} style={[styles.card, { borderLeftColor: t.color }]}>
                  <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.cardChild}>{b.childName ?? "Child"}</Text>
                      <Text style={[styles.typeChip, { color: t.color, borderColor: t.color }]}>{t.label}</Text>
                    </View>
                    <Text style={styles.cardBehavior}>{b.behavior}</Text>
                    {b.notes && <Text style={styles.cardNotes}>{b.notes}</Text>}
                  </View>
                  <Pressable onPress={() => handleDelete(b.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={16} color="rgba(251,113,133,0.7)" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)} />
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log a moment</Text>

            <View style={{ gap: 12, marginTop: 8 }}>
              <View>
                <Text style={styles.label}>Child</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {children.map(c => {
                    const sel = form.childId === c.id;
                    return (
                      <Pressable key={c.id} onPress={() => setForm(f => ({ ...f, childId: c.id }))} style={[styles.smallChip, sel && styles.smallChipSel]}>
                        <Text style={{ color: sel ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 12 }}>{c.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View>
                <Text style={styles.label}>Type</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {TYPES.map(t => {
                    const sel = form.type === t.key;
                    return (
                      <Pressable key={t.key} onPress={() => setForm(f => ({ ...f, type: t.key }))} style={[styles.typeBtn, sel && { backgroundColor: t.color + "30", borderColor: t.color }]}>
                        <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{t.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text style={styles.label}>What happened?</Text>
                <TextInput
                  style={styles.input}
                  value={form.behavior}
                  onChangeText={t => setForm(f => ({ ...f, behavior: t }))}
                  placeholder="e.g. Shared toys without prompting"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                />
              </View>

              <View>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: "top" }]}
                  value={form.notes}
                  onChangeText={t => setForm(f => ({ ...f, notes: t }))}
                  placeholder="Context Amy should know"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  multiline
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <Pressable onPress={() => setOpen(false)} style={[styles.modalBtn, styles.modalBtnCancel]}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleAdd} disabled={saving} style={[styles.modalBtn, { flex: 1 }]}>
                  <LinearGradient colors={["#FBBF24", "#FB7185"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.modalBtnGrad}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  headerIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  headerSubtitle: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(251,113,133,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(251,113,133,0.4)" },

  emptyCard: { padding: 24, borderRadius: 24, alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "dashed", marginTop: 24 },
  emptyTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  emptyDesc: { color: "rgba(255,255,255,0.6)", textAlign: "center", fontSize: 13 },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FB7185", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, marginTop: 6 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },

  daySection: { color: "rgba(255,255,255,0.6)", fontWeight: "700", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  card: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderLeftWidth: 4 },
  cardChild: { color: "#fff", fontWeight: "700", fontSize: 13 },
  typeChip: { fontSize: 10, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderRadius: 999 },
  cardBehavior: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
  cardNotes: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontStyle: "italic", marginTop: 2 },

  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalCard: { backgroundColor: "#14142B", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, borderTopWidth: 1, borderColor: "rgba(251,113,133,0.25)" },
  modalHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 8 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 14 },

  smallChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  smallChipSel: { backgroundColor: "#7B3FF2", borderColor: "#FF4ECD" },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },

  modalBtn: { borderRadius: 14, overflow: "hidden", flex: 1 },
  modalBtnGrad: { paddingVertical: 14, alignItems: "center" },
  modalBtnCancel: { backgroundColor: "rgba(255,255,255,0.08)", paddingVertical: 14, alignItems: "center" },
});
