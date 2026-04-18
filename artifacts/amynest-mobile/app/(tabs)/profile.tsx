import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import * as Haptics from "expo-haptics";

type Colors = ReturnType<typeof useColors>;

type ParentProfile = {
  id: number; name?: string; role: string; workType: string;
  gender?: string; mobileNumber?: string;
};

type Child = { id: number };

const ROLES: string[] = ["mother", "father", "both", "grandparent"];
const WORK_TYPES: { label: string; value: string }[] = [
  { label: "Work from Home", value: "work_from_home" },
  { label: "Office Job", value: "office" },
  { label: "Not Working", value: "not_working" },
  { label: "Homemaker", value: "homemaker" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();
  const authFetch = useAuthFetch();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("mother");
  const [workType, setWorkType] = useState("work_from_home");

  const { data: profile, isLoading } = useQuery<ParentProfile | null>({
    queryKey: ["parent-profile"],
    queryFn: async () => {
      const res = await authFetch("/api/parent-profile");
      if (res.status === 404) return null;
      return res.json() as Promise<ParentProfile>;
    },
    retry: false,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: () => authFetch("/api/children").then(r => r.json()) as Promise<Child[]>,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? user?.firstName ?? "");
      setRole(profile.role ?? "mother");
      setWorkType(profile.workType ?? "work_from_home");
    }
  }, [profile, user?.firstName]);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      await authFetch("/api/parent-profile", {
        method: "PUT",
        body: JSON.stringify({ name, role, workType }),
      });
      qc.invalidateQueries({ queryKey: ["parent-profile"] });
      setEditing(false);
    } catch {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          qc.clear();
          await signOut();
        },
      },
    ]);
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const displayName = profile?.name ?? user?.firstName ?? "Parent";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 90, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)} style={[styles.editBtn, { backgroundColor: colors.secondary }]}>
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSave} style={[styles.editBtn, { backgroundColor: colors.primary }]} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.avatarSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{displayName}</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.emailAddresses?.[0]?.emailAddress}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{children.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Children</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#F0FDF4" }]}>
            <Ionicons name="leaf" size={22} color="#10B981" />
            <Text style={[styles.statLabel, { color: "#059669" }]}>Active</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : editing ? (
          <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.editCardTitle, { color: colors.foreground }]}>Edit Profile</Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
              <TextInput
                style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                testID="profile-name-input"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Role</Text>
              <View style={styles.chipRow}>
                {ROLES.map(r => {
                  const active = role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}
                      onPress={() => setRole(r)}
                    >
                      <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Work Type</Text>
              <View style={styles.chipRow}>
                {WORK_TYPES.map(wt => {
                  const active = workType === wt.value;
                  return (
                    <TouchableOpacity
                      key={wt.value}
                      style={[styles.chip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}
                      onPress={() => setWorkType(wt.value)}
                    >
                      <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>{wt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoRow icon="person" label="Role" value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "—"} colors={colors} />
            <InfoRow icon="briefcase" label="Work Type" value={WORK_TYPES.find(w => w.value === profile?.workType)?.label ?? "—"} colors={colors} />
            <InfoRow icon="call" label="Mobile" value={profile?.mobileNumber ?? "Not set"} colors={colors} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}
          onPress={handleLogout}
          testID="logout-btn"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

type InfoRowProps = { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string; colors: Colors };

function InfoRow({ icon, label, value, colors }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  editBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  avatarSection: { flexDirection: "row", alignItems: "center", gap: 16, padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 3 },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center", gap: 4 },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  infoCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  editCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 16, marginBottom: 20 },
  editCardTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  logoutText: { color: "#EF4444", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
