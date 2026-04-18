import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export type ActionResult = "worked" | "partial" | "not_worked";

type Props = {
  onAction: (result: ActionResult) => void;
  disabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressBtn({
  label,
  icon,
  color,
  bg,
  onPress,
  testID,
  accessibilityLabel,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  onPress: () => void;
  testID: string;
  accessibilityLabel: string;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 15, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.btn, { backgroundColor: bg, borderColor: color + "55" }, style]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.btnText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export default function ActionButtons({ onAction, disabled }: Props) {
  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]} pointerEvents={disabled ? "none" : "auto"}>
      <PressBtn
        label="Worked"
        icon="checkmark-circle"
        color="#059669"
        bg="#ECFDF5"
        onPress={() => onAction("worked")}
        testID="action-worked"
        accessibilityLabel="Mark this win as worked"
      />
      <PressBtn
        label="Partially"
        icon="contrast"
        color="#D97706"
        bg="#FFFBEB"
        onPress={() => onAction("partial")}
        testID="action-partial"
        accessibilityLabel="Mark this win as partially worked"
      />
      <PressBtn
        label="Not yet"
        icon="refresh-circle"
        color="#DC2626"
        bg="#FEF2F2"
        onPress={() => onAction("not_worked")}
        testID="action-not-worked"
        accessibilityLabel="This did not work, give me more options"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText: {
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
