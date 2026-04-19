import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import ActionButtons, { type ActionResult } from "./ActionButtons";
import { brand, brandAlpha } from "@/constants/colors";

const { height: SCREEN_H } = Dimensions.get("window");
export const CARD_HEIGHT = SCREEN_H;

export type CoachWin = {
  id: string;
  index: number;
  title: string;
  objective: string;
  explanation: string;
  actions: string[];
  example: string;
  mistake: string;
  microTask: string;
  science: string;
  accent: readonly [string, string];
};

type Props = {
  win: CoachWin;
  total: number;
  topInset: number;
  bottomInset: number;
  onAction: (result: ActionResult) => void;
};

function SectionHeader({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function CoachCard({ win, total, topInset, bottomInset, onAction }: Props) {
  return (
    <View style={[styles.page, { height: CARD_HEIGHT }]}>
      <Animated.View
        entering={FadeIn.duration(450)}
        style={[styles.cardWrap, { paddingTop: topInset + 88, paddingBottom: bottomInset + 16 }]}
      >
        <BlurView intensity={40} tint="light" style={styles.card}>
          <LinearGradient
            colors={["rgba(255,255,255,0.92)", "rgba(255,255,255,0.78)"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Accent bar */}
          <LinearGradient
            colors={win.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Win header */}
            <View style={styles.winRow}>
              <LinearGradient
                colors={win.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.winNumber}
              >
                <Text style={styles.winNumberText}>{win.index}</Text>
              </LinearGradient>
              <Text style={styles.winLabel}>WIN {win.index} OF {total}</Text>
            </View>

            <Text style={styles.title}>{win.title}</Text>

            {/* Objective */}
            <View style={styles.objectiveBox}>
              <Ionicons name="flag" size={14} color={brand.violet600} />
              <Text style={styles.objectiveText}>{win.objective}</Text>
            </View>

            {/* Deep explanation */}
            <SectionHeader icon="book-outline" label="WHY THIS WORKS" color={brand.indigo500} />
            <Text style={styles.bodyText}>{win.explanation}</Text>

            {/* Actions */}
            <SectionHeader icon="checkbox-outline" label="DO THIS" color="#059669" />
            <View style={{ gap: 10, marginTop: 4 }}>
              {win.actions.map((a, i) => (
                <View key={i} style={styles.actionRow}>
                  <View style={styles.actionDot}>
                    <Text style={styles.actionDotText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.actionText}>{a}</Text>
                </View>
              ))}
            </View>

            {/* Example */}
            <SectionHeader icon="chatbubble-ellipses-outline" label="REAL EXAMPLE" color="#0EA5E9" />
            <View style={styles.calloutBox}>
              <Text style={styles.calloutText}>{win.example}</Text>
            </View>

            {/* Mistake */}
            <SectionHeader icon="alert-circle-outline" label="AVOID THIS" color="#DC2626" />
            <View style={[styles.calloutBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
              <Text style={[styles.calloutText, { color: "#7F1D1D" }]}>{win.mistake}</Text>
            </View>

            {/* Micro task */}
            <SectionHeader icon="flash-outline" label="MICRO TASK FOR TODAY" color="#D97706" />
            <View style={[styles.calloutBox, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
              <Text style={[styles.calloutText, { color: "#78350F", fontWeight: "600" }]}>
                {win.microTask}
              </Text>
            </View>

            {/* Science */}
            <View style={styles.science}>
              <Ionicons name="flask-outline" size={11} color="#6B7280" />
              <Text style={styles.scienceText}>{win.science}</Text>
            </View>
          </ScrollView>

          {/* Action buttons (sticky bottom) */}
          <View style={styles.actionsWrap}>
            <ActionButtons onAction={onAction} />
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    paddingHorizontal: 16,
  },
  cardWrap: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: brand.violet600,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 16,
  },
  accentBar: {
    height: 5,
    width: "100%",
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 110,
  },
  winRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  winNumber: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  winNumberText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  winLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: "#1F2937",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  objectiveBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: brandAlpha.violet600_08,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: brandAlpha.violet600_18,
  },
  objectiveText: {
    flex: 1,
    color: brand.violet800,
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  bodyText: {
    color: "#374151",
    fontSize: 14.5,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  actionDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  actionDotText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "800",
  },
  actionText: {
    flex: 1,
    color: "#374151",
    fontSize: 14.5,
    lineHeight: 21,
  },
  calloutBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  calloutText: {
    color: "#075985",
    fontSize: 14,
    lineHeight: 20.5,
  },
  science: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  scienceText: {
    flex: 1,
    color: "#6B7280",
    fontSize: 11,
    lineHeight: 16,
    fontStyle: "italic",
  },
  actionsWrap: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingTop: 10,
    paddingHorizontal: 6,
    paddingBottom: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
});
