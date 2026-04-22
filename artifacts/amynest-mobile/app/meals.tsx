import React from "react";
import { View, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SmartMealSuggestions from "@/components/SmartMealSuggestions";

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: "#F8F7FF" }}>
      <Stack.Screen options={{ title: "🍱 Tiffin & Meals" }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        <SmartMealSuggestions />
      </ScrollView>
    </View>
  );
}
