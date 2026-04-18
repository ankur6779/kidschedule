import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import * as Haptics from "expo-haptics";

type Colors = ReturnType<typeof useColors>;

type Child = {
  id: number; name: string; age: number; ageMonths?: number; dob?: string;
  isSchoolGoing?: boolean; childClass?: string;
  schoolStartTime: string; schoolEndTime: string;
  wakeUpTime: string; sleepTime: string; foodType?: string; goals: string;
  travelMode?: string;
};

const FOOD_TYPES: { label: string; value: string }[] = [
  { label: "Vegetarian", value: "veg" },
  { label: "Non-Vegetarian", value: "non_veg" },
];
const TRAVEL_MODES: string[] = ["car", "bus", "walk", "auto"];

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
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
  const [travelMode, setTravelMode] = useState("car");
  const [goals, setGoals] = useState("balanced-routine");

  const { data: child, isLoading } = useQuery<Child>({
    queryKey: ["child", id],
    queryFn: () => authFetch(`/api/children/${id}`).then(r => r.json()) as Promise<Child>,
    enabled: !!id && id !== "new",
  });

  useEffect(() => {
    if (child) {
      setName(child.name ?? "");
      setDob(child.dob ?? "");
      setIsSchool(child.isSchoolGoing ?? false);
      setChildClass(child.childClass ?? "");
      setSchoolStart(child.schoolStartTime ?? "09:00");
      setSchoolEnd(child.schoolEndTime ?? "15:00");
      setWakeUp(child.wakeUpTime ?? "07:00");
      setSleep(child.sleepTime ?? "21:00");
      setFoodType(child.foodType ?? "veg");
      setTravelMode(child.travelMode ?? "car");
      setGoals(child.goals ?? "balanced-routine");
    }
  }, [child]);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await authFetch(`/api/children/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name, dob, isSchoolGoing: isSchool,
          childClass: isSchool ? childClass : "",
          schoolStartTime: schoolStart, schoolEndTime: schoolEnd,
          wakeUpTime: wakeUp, sleepTime: sleep,
          foodType, travelMode, goals,
        }),
      });
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["child", id] });
      setEditing(false);
    } catch {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Child", `Are you sure you want to remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          try {
            await authFetch(`/api/children/${id}`, { method: "DELETE" });
            qc.invalidateQueries({ queryKey: ["children"] });
            router.back();
          } catch {
            Alert.alert("Error", "Failed to delete child.");
          }
        },
      },
    ]);
  };

  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={styles.avatarEmoji}>{(child?.age ?? 0) < 4 ? "🧒" : "🧑"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.childName, { color: colors.foreground }]}>{child?.name}</Text>
            <Text style={[styles.childMeta, { color: colors.mutedForeground }]}>
              {child?.age} yr{(child?.age ?? 0) !== 1 ? "s" : ""} · {child?.isSchoolGoing ? "School going" : "Not in school"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editIconBtn, { backgroundColor: editing ? colors.primary : colors.secondary }]}
            onPress={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> :
              <Ionicons name={editing ? "checkmark" : "pencil"} size={18} color={editing ? "#fff" : colors.primary} />}
          </TouchableOpacity>
        </View>

        {editing ? (
          <View style={styles.formSection}>
            <Field label="Name" value={name} onChange={setName} colors={colors} />
            <Field label="Date of Birth (YYYY-MM-DD)" value={dob} onChange={setDob} colors={colors} keyboardType="numeric" />

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
                <Field label="Class" value={childClass} onChange={setChildClass} colors={colors} />
                <Field label="School Start (HH:MM)" value={schoolStart} onChange={setSchoolStart} colors={colors} placeholder="09:00" />
                <Field label="School End (HH:MM)" value={schoolEnd} onChange={setSchoolEnd} colors={colors} placeholder="15:00" />
              </>
            )}

            <Field label="Wake Up Time (HH:MM)" value={wakeUp} onChange={setWakeUp} colors={colors} placeholder="07:00" />
            <Field label="Sleep Time (HH:MM)" value={sleep} onChange={setSleep} colors={colors} placeholder="21:00" />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginBottom: 6 }]}>Food Type</Text>
            <View style={styles.chipRow}>
              {FOOD_TYPES.map(f => (
                <TouchableOpacity key={f.value}
                  style={[styles.chip, { backgroundColor: foodType === f.value ? colors.primary : colors.card, borderColor: foodType === f.value ? colors.primary : colors.border }]}
                  onPress={() => { setFoodType(f.value); Haptics.selectionAsync(); }}>
                  <Text style={[styles.chipText, { color: foodType === f.value ? "#fff" : colors.foreground }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginBottom: 6, marginTop: 4 }]}>Travel Mode</Text>
            <View style={styles.chipRow}>
              {TRAVEL_MODES.map(t => (
                <TouchableOpacity key={t}
                  style={[styles.chip, { backgroundColor: travelMode === t ? colors.primary : colors.card, borderColor: travelMode === t ? colors.primary : colors.border }]}
                  onPress={() => { setTravelMode(t); Haptics.selectionAsync(); }}>
                  <Text style={[styles.chipText, { color: travelMode === t ? "#fff" : colors.foreground }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <InfoCard title="Daily Schedule" colors={colors}>
              <InfoRow icon="sunny-outline" label="Wake Up" value={child?.wakeUpTime ?? "—"} colors={colors} />
              <InfoRow icon="moon-outline" label="Sleep" value={child?.sleepTime ?? "—"} colors={colors} />
              {child?.isSchoolGoing && (
                <>
                  <InfoRow icon="school-outline" label="School Start" value={child.schoolStartTime} colors={colors} />
                  <InfoRow icon="flag-outline" label="School End" value={child.schoolEndTime} colors={colors} />
                  {child.childClass && <InfoRow icon="book-outline" label="Class" value={child.childClass} colors={colors} />}
                </>
              )}
            </InfoCard>
            <InfoCard title="Preferences" colors={colors}>
              <InfoRow icon="restaurant-outline" label="Food" value={child?.foodType === "non_veg" ? "Non-Vegetarian" : "Vegetarian"} colors={colors} />
              <InfoRow icon="car-outline" label="Travel" value={child?.travelMode ?? "Car"} colors={colors} />
            </InfoCard>
          </View>
        )}

        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}
          onPress={handleDelete}
          testID="delete-child-btn"
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteBtnText}>Remove Child</Text>
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
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}

type InfoCardProps = { title: string; children: React.ReactNode; colors: Colors };

function InfoCard({ title, children, colors }: InfoCardProps) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

type InfoRowProps = { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string; colors: Colors };

function InfoRow({ icon, label, value, colors }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={colors.mutedForeground} />
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24, paddingTop: 16 },
  avatar: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 28 },
  childName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  childMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  editIconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  formSection: { gap: 14, marginBottom: 20 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoSection: { gap: 14, marginBottom: 20 },
  infoCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  infoCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", padding: 16, paddingBottom: 8 },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  infoLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  deleteBtnText: { color: "#EF4444", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
