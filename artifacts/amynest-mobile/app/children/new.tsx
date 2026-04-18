import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import * as Haptics from "expo-haptics";

type Colors = ReturnType<typeof useColors>;

const FOOD_TYPES: { label: string; value: string }[] = [
  { label: "Vegetarian", value: "veg" },
  { label: "Non-Vegetarian", value: "non_veg" },
];

function dobToAge(dob: string): { years: number; months: number } {
  const born = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  let months = now.getMonth() - born.getMonth();
  if (months < 0) { years--; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

export default function NewChildScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [isSchool, setIsSchool] = useState(false);
  const [childClass, setChildClass] = useState("");
  const [schoolStart, setSchoolStart] = useState("09:00");
  const [schoolEnd, setSchoolEnd] = useState("15:00");
  const [wakeUp, setWakeUp] = useState("07:00");
  const [sleep, setSleep] = useState("21:00");
  const [foodType, setFoodType] = useState("veg");

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Child name is required."); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const { years, months } = dobToAge(dob || new Date().toISOString().slice(0, 10));
      await authFetch("/api/children", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(), dob: dob || "",
          age: years, ageMonths: months,
          isSchoolGoing: isSchool,
          childClass: isSchool ? childClass : "",
          schoolStartTime: schoolStart, schoolEndTime: schoolEnd,
          wakeUpTime: wakeUp, sleepTime: sleep,
          travelMode: "car", foodType, goals: "balanced-routine",
        }),
      });
      qc.invalidateQueries({ queryKey: ["children"] });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to add child. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: botPad + 32, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Add Child</Text>

        <View style={styles.formSection}>
          <Field label="Child's Name *" value={name} onChange={setName} colors={colors} placeholder="Enter name" />
          <Field label="Date of Birth (YYYY-MM-DD)" value={dob} onChange={setDob} colors={colors} placeholder="e.g. 2020-05-15" keyboardType="numeric" />

          <View style={styles.switchRow}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>School Going</Text>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: isSchool ? colors.primary : colors.muted }]}
              onPress={() => { setIsSchool(!isSchool); Haptics.selectionAsync(); }}
            >
              <View style={[styles.toggleKnob, { transform: [{ translateX: isSchool ? 20 : 2 }] }]} />
            </TouchableOpacity>
          </View>

          {isSchool && (
            <>
              <Field label="Class" value={childClass} onChange={setChildClass} colors={colors} placeholder="e.g. 3rd" />
              <Field label="School Start (HH:MM)" value={schoolStart} onChange={setSchoolStart} colors={colors} placeholder="09:00" />
              <Field label="School End (HH:MM)" value={schoolEnd} onChange={setSchoolEnd} colors={colors} placeholder="15:00" />
            </>
          )}

          <Field label="Wake Up Time (HH:MM)" value={wakeUp} onChange={setWakeUp} colors={colors} placeholder="07:00" />
          <Field label="Sleep Time (HH:MM)" value={sleep} onChange={setSleep} colors={colors} placeholder="21:00" />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginBottom: 6 }]}>Food Preference</Text>
          <View style={styles.chipRow}>
            {FOOD_TYPES.map(f => (
              <TouchableOpacity key={f.value}
                style={[styles.chip, { backgroundColor: foodType === f.value ? colors.primary : colors.card, borderColor: foodType === f.value ? colors.primary : colors.border }]}
                onPress={() => { setFoodType(f.value); Haptics.selectionAsync(); }}>
                <Text style={[styles.chipText, { color: foodType === f.value ? "#fff" : colors.foreground }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving || !name.trim() ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving || !name.trim()}
          testID="save-child-btn"
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Add Child</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (text: string) => void;
  colors: Colors;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
};

function Field({ label, value, onChange, colors, placeholder, keyboardType }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 24 },
  formSection: { gap: 14, marginBottom: 24 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
