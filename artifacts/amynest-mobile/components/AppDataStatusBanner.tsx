import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";

function formatRelative(ts: number | null): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Updated just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Updated ${hrs}h ago`;
  return `Updated ${Math.floor(hrs / 24)}d ago`;
}

export default function AppDataStatusBanner() {
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const lastUpdated = useAppStore((s) => s.lastUpdated);
  const fromCache = useAppStore((s) => s.fromCache);
  const hasData = useAppStore((s) => !!s.data);
  const refresh = useAppStore((s) => s.refresh);

  if (!hasData && status === "error" && error) {
    return (
      <View style={[styles.banner, styles.error]}>
        <Ionicons name="cloud-offline-outline" size={16} color="#B91C1C" />
        <Text style={styles.errorText} numberOfLines={2}>
          Unable to load data. Tap retry.
        </Text>
        <Pressable onPress={() => void refresh()} hitSlop={8} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (status === "refreshing" && hasData) {
    return (
      <View style={[styles.banner, styles.muted]}>
        <ActivityIndicator size="small" color="#7C3AED" />
        <Text style={styles.mutedText}>Refreshing…</Text>
      </View>
    );
  }

  if (hasData && lastUpdated) {
    return (
      <View style={[styles.banner, styles.muted]}>
        <Ionicons
          name={fromCache ? "save-outline" : "checkmark-circle-outline"}
          size={14}
          color="#6B7280"
        />
        <Text style={styles.mutedText}>{formatRelative(lastUpdated)}</Text>
        {error ? <Text style={styles.softErr}>· offline</Text> : null}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  muted: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderColor: "rgba(0,0,0,0.05)",
  },
  mutedText: {
    color: "#6B7280",
    fontSize: 11.5,
    fontWeight: "600",
  },
  softErr: {
    color: "#B91C1C",
    fontSize: 11.5,
    fontWeight: "600",
    marginLeft: 4,
  },
  error: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  errorText: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 12.5,
    fontWeight: "700",
  },
  retryBtn: {
    backgroundColor: "#B91C1C",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  retryText: {
    color: "#fff",
    fontSize: 11.5,
    fontWeight: "800",
  },
});
