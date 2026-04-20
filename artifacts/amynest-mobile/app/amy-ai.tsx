import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import AiQuotaBanner from "@/components/AiQuotaBanner";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { brand } from "@/constants/colors";

type Message = { id: string; role: "user" | "amy"; text: string };

export default function AmyAIScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const params = useLocalSearchParams<{ q?: string }>();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "amy", text: "Hi! I'm Amy 💜 your AI parenting coach. Ask me anything — sleep, tantrums, picky eating, school worries. I'm here." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Pull primary child for richer Amy context — best-effort
  const { data: childrenData } = useQuery<Array<{ name?: string; age?: number | null }>>({
    queryKey: ["children-for-amy-ai"],
    queryFn: async () => {
      const r = await authFetch("/api/children");
      return r.ok ? r.json() : [];
    },
    staleTime: 60_000,
  });
  const primaryChild = Array.isArray(childrenData) && childrenData.length > 0 ? childrenData[0] : null;

  // Auto-send if a prompt was passed via params
  useEffect(() => {
    if (params.q && typeof params.q === "string") {
      void send(params.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    // Snapshot history BEFORE appending the new question so we can send it as context
    const history = messages
      .filter(m => m.id !== "welcome")
      .slice(-6)
      .map(m => ({ role: m.role === "amy" ? "assistant" : "user", content: m.text }));
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    try {
      const { default: i18nInstance } = await import("@/i18n");
      const res = await authFetch("/api/ai/assistant-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          language: i18nInstance.language || "en",
          history,
          childName: primaryChild?.name ?? undefined,
          childAge: typeof primaryChild?.age === "number" ? primaryChild.age : undefined,
        }),
      });
      if (res.status === 402) {
        // Quota exhausted — refresh entitlements and route to paywall
        await useSubscriptionStore.getState().refresh();
        setMessages(m => [...m, { id: `a-${Date.now()}`, role: "amy", text: "You've used your free Amy AI queries for today. Upgrade to keep chatting unlimited 💜" }]);
        router.push({ pathname: "/paywall", params: { reason: "ai_quota" } });
        return;
      }
      const data = await res.json().catch(() => ({}));
      const answer: string = data?.answer ?? "Sorry, I couldn't get a response. Please try again.";
      setMessages(m => [...m, { id: `a-${Date.now()}`, role: "amy", text: answer }]);
      // Refresh quota count after a successful AI call
      void useSubscriptionStore.getState().refresh();
    } catch {
      setMessages(m => [...m, { id: `a-${Date.now()}`, role: "amy", text: "Network error — please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <LinearGradient colors={theme.gradient} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <LinearGradient colors={[brand.primary, "#FF4ECD"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.headerIcon}>
          <MaterialCommunityIcons name="chat-processing" size={18} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Amy AI</Text>
          <Text style={styles.headerSubtitle}>Your personal parenting coach</Text>
        </View>
      </View>

      <AiQuotaBanner />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(m => (
            <View key={m.id} style={[styles.bubbleRow, m.role === "user" ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
              {m.role === "amy" && (
                <LinearGradient colors={[brand.primary, "#FF4ECD"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.avatarSm}>
                  <MaterialCommunityIcons name="brain" size={14} color="#fff" />
                </LinearGradient>
              )}
              <View style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleAmy]}>
                <Text style={[styles.bubbleText, m.role === "user" && { color: "#fff" }]}>{m.text}</Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.bubbleRowLeft}>
              <LinearGradient colors={[brand.primary, "#FF4ECD"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.avatarSm}>
                <MaterialCommunityIcons name="brain" size={14} color="#fff" />
              </LinearGradient>
              <View style={[styles.bubble, styles.bubbleAmy]}>
                <ActivityIndicator size="small" color="#FF4ECD" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask Amy anything…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.input}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]}
          >
            <LinearGradient colors={[brand.primary, "#FF4ECD"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.sendBtnGrad}>
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  backBtn: { padding: 4 },
  headerIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  headerSubtitle: { color: "rgba(255,255,255,0.55)", fontSize: 11 },

  bubbleRow: { flexDirection: "row", gap: 8, alignItems: "flex-end", maxWidth: "100%" },
  bubbleRowLeft: { justifyContent: "flex-start" },
  bubbleRowRight: { justifyContent: "flex-end" },
  avatarSm: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: "82%" },
  bubbleAmy: { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderTopLeftRadius: 4 },
  bubbleUser: { backgroundColor: brand.primary, borderTopRightRadius: 4 },
  bubbleText: { color: "rgba(255,255,255,0.92)", fontSize: 14, lineHeight: 20 },

  inputBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(11,11,26,0.7)" },
  input: { flex: 1, color: "#fff", fontSize: 15, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  sendBtn: { borderRadius: 22, overflow: "hidden" },
  sendBtnGrad: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
