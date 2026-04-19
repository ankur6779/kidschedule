import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Platform, ActivityIndicator, KeyboardAvoidingView, Alert, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import * as Haptics from "expo-haptics";

type ChatRole = "amy" | "user";
type ChatMsg = { id: string; role: ChatRole; text: string };
type Step =
  | "intro" | "child-name" | "child-dob" | "child-school" | "child-class"
  | "child-school-start" | "child-school-end" | "child-wake" | "child-sleep"
  | "child-food" | "add-more" | "parent-name" | "parent-role" | "parent-work"
  | "saving" | "save-error" | "done";

type ChildData = {
  name: string; dob: string; age: number; ageMonths: number;
  isSchoolGoing: boolean; childClass: string;
  schoolStartTime: string; schoolEndTime: string;
  wakeUpTime: string; sleepTime: string; foodType: string;
};
type ParentData = { name: string; role: string; workType: string };

function genId(): string { return Date.now().toString() + Math.random().toString(36).substr(2, 6); }

function dobToAge(dob: string): { years: number; months: number } {
  const born = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  let months = now.getMonth() - born.getMonth();
  if (months < 0) { years--; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

function to24h(display: string): string {
  const [time, period] = display.split(" ");
  const parts = (time ?? "").split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const hour = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const WAKE_OPTS = ["5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM"];
const SLEEP_OPTS = ["8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM"];
const SCHOOL_START = ["7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM"];
const SCHOOL_END = ["12:00 PM", "1:00 PM", "2:00 PM", "2:30 PM", "3:00 PM", "4:00 PM"];
const CLASSES = ["Nursery", "LKG / KG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th+"];
const ROLES = ["Mother", "Father", "Both", "Grandparent"];
const WORK_TYPES: { label: string; value: string }[] = [
  { label: "Work from Home", value: "work_from_home" },
  { label: "Office Job", value: "office" },
  { label: "Not Working", value: "not_working" },
  { label: "Homemaker", value: "homemaker" },
];

const PRIMARY = "#6366F1";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const authFetch = useAuthFetch();
  const qc = useQueryClient();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [textInput, setTextInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [selected, setSelected] = useState("");
  const [children, setChildren] = useState<ChildData[]>([]);
  const [curr, setCurr] = useState<Partial<ChildData>>({});
  const [parent, setParent] = useState<Partial<ParentData>>({});
  const listRef = useRef<FlatList<ChatMsg>>(null);
  const stepRef = useRef<Step>("intro");

  const addMsg = useCallback((role: ChatRole, text: string) => {
    setMessages(m => [{ id: genId(), role, text }, ...m]);
  }, []);

  const amySays = useCallback((text: string, delay = 700) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMsg("amy", text);
    }, delay);
  }, [addMsg]);

  const userReplies = useCallback((text: string, nextStep: Step, nextAmyMsg?: string) => {
    addMsg("user", text);
    setSelected("");
    setTextInput("");
    if (nextAmyMsg) {
      setTimeout(() => amySays(nextAmyMsg), 400);
    }
    setTimeout(() => {
      stepRef.current = nextStep;
      setStep(nextStep);
    }, nextAmyMsg ? 1400 : 400);
  }, [addMsg, amySays]);

  useEffect(() => {
    const firstName = user?.firstName || "there";
    setTimeout(() => {
      addMsg("amy", `Hi ${firstName}! I'm Amy, your parenting coach. Let me set up your profile — it'll take about 2 minutes!`);
      setTimeout(() => amySays("Let's start — what's your child's name?", 800), 1200);
      setTimeout(() => { stepRef.current = "child-name"; setStep("child-name"); }, 2200);
    }, 600);
  }, []);

  const saveEverything = async (finalParent: ParentData, finalChildren: ChildData[]) => {
    stepRef.current = "saving";
    setStep("saving");
    addMsg("amy", "Saving your profile now...");

    try {
      for (const child of finalChildren) {
        const res = await authFetch("/api/children", {
          method: "POST",
          body: JSON.stringify({
            name: child.name, dob: child.dob || "",
            age: child.age || 0, ageMonths: child.ageMonths || 0,
            isSchoolGoing: child.isSchoolGoing ?? false,
            childClass: child.childClass || "",
            schoolStartTime: child.schoolStartTime || "09:00",
            schoolEndTime: child.schoolEndTime || "15:00",
            wakeUpTime: child.wakeUpTime || "07:00",
            sleepTime: child.sleepTime || "21:00",
            travelMode: "car",
            foodType: child.foodType || "veg",
            goals: "balanced-routine",
          }),
        });
        if (!res.ok) throw new Error(`Failed to create child: ${res.status}`);
      }

      const profileRes = await authFetch("/api/parent-profile", {
        method: "PUT",
        body: JSON.stringify({
          name: finalParent.name || "",
          role: (finalParent.role || "mother").toLowerCase(),
          workType: finalParent.workType || "work_from_home",
        }),
      });
      if (!profileRes.ok) throw new Error(`Failed to update profile: ${profileRes.status}`);

      const onboardingRes = await authFetch("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({
          children: finalChildren.map(c => ({ name: c.name, ageGroup: `${c.age}`, problems: [] })),
          parent: { caregiver: finalParent.role, concern: "", routineLevel: "medium" },
          priorityGoal: "balanced-routine",
          onboardingComplete: true,
        }),
      });
      if (!onboardingRes.ok) throw new Error(`Failed to complete onboarding: ${onboardingRes.status}`);

      qc.invalidateQueries();
      stepRef.current = "done";
      setStep("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      stepRef.current = "save-error";
      setStep("save-error");
      addMsg("amy", "Something went wrong saving your profile. Please try again.");
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  if (step === "saving") {
    return (
      <View style={[styles.doneContainer, { paddingTop: topPad, paddingBottom: botPad, backgroundColor: colors.background }]}>
        <Image
          source={require("../assets/images/amynest-logo.png")}
          style={styles.amyBigBubble}
          resizeMode="cover"
        />
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Amy is setting up your profile...</Text>
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (step === "done") {
    return (
      <View style={[styles.doneContainer, { paddingTop: topPad, paddingBottom: botPad, backgroundColor: colors.background }]}>
        <View style={[styles.amyBigBubble, { backgroundColor: "#10B981" }]}>
          <Ionicons name="checkmark" size={36} color="#fff" />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Profile ready!</Text>
        <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>All set for {children[0]?.name ?? "your child"}</Text>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: PRIMARY }]}
          onPress={() => router.replace("/(tabs)")}
          testID="go-dashboard-btn"
        >
          <Text style={styles.doneBtnText}>Go to Dashboard</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "save-error") {
    return (
      <View style={[styles.doneContainer, { paddingTop: topPad, paddingBottom: botPad, backgroundColor: colors.background }]}>
        <View style={[styles.amyBigBubble, { backgroundColor: "#EF4444" }]}>
          <Ionicons name="alert-circle" size={36} color="#fff" />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Something went wrong</Text>
        <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>We couldn't save your profile. Check your connection and try again.</Text>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: PRIMARY }]}
          onPress={() => {
            stepRef.current = "parent-work";
            setStep("parent-work");
          }}
          testID="retry-save-btn"
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.doneBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderInput(): React.ReactNode {
    switch (step) {
      case "intro":
        return null;

      case "child-name":
        return (
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Child's name"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              returnKeyType="send"
              onSubmitEditing={() => {
                if (!textInput.trim()) return;
                const name = textInput.trim();
                setCurr(c => ({ ...c, name }));
                userReplies(name, "child-dob", `Nice! When is ${name}'s date of birth?`);
              }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: PRIMARY }]}
              onPress={() => {
                if (!textInput.trim()) return;
                const name = textInput.trim();
                setCurr(c => ({ ...c, name }));
                userReplies(name, "child-dob", `Nice! When is ${name}'s date of birth?`);
              }}
            >
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case "child-dob":
        return (
          <View style={styles.dobContainer}>
            <TextInput
              style={[styles.textInput, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              value={dobInput}
              onChangeText={setDobInput}
              placeholder="YYYY-MM-DD (e.g. 2020-05-15)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: PRIMARY, opacity: dobInput.length >= 8 ? 1 : 0.5 }]}
              disabled={dobInput.length < 8}
              onPress={() => {
                const { years, months } = dobToAge(dobInput);
                setCurr(c => ({ ...c, dob: dobInput, age: years, ageMonths: months }));
                userReplies(dobInput, "child-school", `Is ${curr.name} going to school?`);
                setDobInput("");
              }}
            >
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        );

      case "child-school":
        return (
          <View style={styles.rowBtns}>
            {["Yes, school going", "No, not yet"].map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  const isSchool = opt.startsWith("Yes");
                  setCurr(c => ({ ...c, isSchoolGoing: isSchool }));
                  if (isSchool) {
                    userReplies(opt, "child-class", `Which class is ${curr.name} in?`);
                  } else {
                    setCurr(c => ({ ...c, childClass: "", schoolStartTime: "09:00", schoolEndTime: "15:00" }));
                    userReplies(opt, "child-wake", `What time does ${curr.name} wake up?`);
                  }
                }}
              >
                <Text style={[styles.optionBtnText, { color: colors.foreground }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "child-class":
        return (
          <View style={styles.chipGrid}>
            {CLASSES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, { backgroundColor: selected === c ? PRIMARY : colors.card, borderColor: selected === c ? PRIMARY : colors.border }]}
                onPress={() => {
                  setSelected(c);
                  Haptics.selectionAsync();
                  setCurr(ch => ({ ...ch, childClass: c }));
                  userReplies(c, "child-school-start", "What time does school start?");
                }}
              >
                <Text style={[styles.chipText, { color: selected === c ? "#fff" : colors.foreground }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "child-school-start":
        return (
          <View style={styles.chipGrid}>
            {SCHOOL_START.map(t => (
              <TouchableOpacity key={t}
                style={[styles.chip, { backgroundColor: selected === t ? PRIMARY : colors.card, borderColor: selected === t ? PRIMARY : colors.border }]}
                onPress={() => {
                  setSelected(t); Haptics.selectionAsync();
                  setCurr(c => ({ ...c, schoolStartTime: to24h(t) }));
                  userReplies(t, "child-school-end", "And school ends at?");
                }}>
                <Text style={[styles.chipText, { color: selected === t ? "#fff" : colors.foreground }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "child-school-end":
        return (
          <View style={styles.chipGrid}>
            {SCHOOL_END.map(t => (
              <TouchableOpacity key={t}
                style={[styles.chip, { backgroundColor: selected === t ? PRIMARY : colors.card, borderColor: selected === t ? PRIMARY : colors.border }]}
                onPress={() => {
                  setSelected(t); Haptics.selectionAsync();
                  setCurr(c => ({ ...c, schoolEndTime: to24h(t) }));
                  userReplies(t, "child-wake", `What time does ${curr.name} wake up?`);
                }}>
                <Text style={[styles.chipText, { color: selected === t ? "#fff" : colors.foreground }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "child-wake":
        return (
          <View style={styles.chipGrid}>
            {WAKE_OPTS.map(t => (
              <TouchableOpacity key={t}
                style={[styles.chip, { backgroundColor: selected === t ? PRIMARY : colors.card, borderColor: selected === t ? PRIMARY : colors.border }]}
                onPress={() => {
                  setSelected(t); Haptics.selectionAsync();
                  setCurr(c => ({ ...c, wakeUpTime: to24h(t) }));
                  userReplies(t, "child-sleep", `And bedtime for ${curr.name}?`);
                }}>
                <Text style={[styles.chipText, { color: selected === t ? "#fff" : colors.foreground }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "child-sleep":
        return (
          <View style={styles.chipGrid}>
            {SLEEP_OPTS.map(t => (
              <TouchableOpacity key={t}
                style={[styles.chip, { backgroundColor: selected === t ? PRIMARY : colors.card, borderColor: selected === t ? PRIMARY : colors.border }]}
                onPress={() => {
                  setSelected(t); Haptics.selectionAsync();
                  setCurr(c => ({ ...c, sleepTime: to24h(t) }));
                  userReplies(t, "child-food", "What kind of food does your family prefer?");
                }}>
                <Text style={[styles.chipText, { color: selected === t ? "#fff" : colors.foreground }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "child-food":
        return (
          <View style={styles.rowBtns}>
            {[{ label: "Vegetarian", value: "veg" }, { label: "Non-Vegetarian", value: "non_veg" }].map(opt => (
              <TouchableOpacity key={opt.value}
                style={[styles.optionBtn, { backgroundColor: selected === opt.value ? PRIMARY : colors.card, borderColor: selected === opt.value ? PRIMARY : colors.border }]}
                onPress={() => {
                  setSelected(opt.value); Haptics.selectionAsync();
                  const finishedChild = { ...curr, foodType: opt.value } as ChildData;
                  setChildren(cs => [...cs, finishedChild]);
                  setCurr({});
                  userReplies(opt.label, "add-more", "Got it! Do you have another child to add?");
                }}>
                <Text style={[styles.optionBtnText, { color: selected === opt.value ? "#fff" : colors.foreground }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "add-more":
        return (
          <View style={styles.rowBtns}>
            {["Yes, add another", "No, continue"].map(opt => (
              <TouchableOpacity key={opt}
                style={[styles.optionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  if (opt.startsWith("Yes")) {
                    userReplies(opt, "child-name", "Great! What's the next child's name?");
                  } else {
                    userReplies(opt, "parent-name", "Almost done! What's your name?");
                  }
                }}>
                <Text style={[styles.optionBtnText, { color: colors.foreground }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "parent-name":
        return (
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              returnKeyType="send"
              onSubmitEditing={() => {
                if (!textInput.trim()) return;
                const name = textInput.trim();
                setParent(p => ({ ...p, name }));
                userReplies(name, "parent-role", `Nice to meet you, ${name}! What's your role?`);
              }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: PRIMARY }]}
              onPress={() => {
                if (!textInput.trim()) return;
                const name = textInput.trim();
                setParent(p => ({ ...p, name }));
                userReplies(name, "parent-role", `Nice to meet you, ${name}! What's your role?`);
              }}
            >
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case "parent-role":
        return (
          <View style={styles.chipGrid}>
            {ROLES.map(r => (
              <TouchableOpacity key={r}
                style={[styles.chip, { backgroundColor: selected === r ? PRIMARY : colors.card, borderColor: selected === r ? PRIMARY : colors.border }]}
                onPress={() => {
                  setSelected(r); Haptics.selectionAsync();
                  setParent(p => ({ ...p, role: r }));
                  userReplies(r, "parent-work", "And your work situation?");
                }}>
                <Text style={[styles.chipText, { color: selected === r ? "#fff" : colors.foreground }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "parent-work":
        return (
          <View style={styles.chipGrid}>
            {WORK_TYPES.map(wt => (
              <TouchableOpacity key={wt.value}
                style={[styles.chip, { backgroundColor: selected === wt.value ? PRIMARY : colors.card, borderColor: selected === wt.value ? PRIMARY : colors.border }]}
                onPress={() => {
                  setSelected(wt.value); Haptics.selectionAsync();
                  const updatedParent: ParentData = { ...parent, workType: wt.value } as ParentData;
                  setParent(updatedParent);
                  userReplies(wt.label, "saving");
                  setTimeout(() => saveEverything(updatedParent, children), 800);
                }}>
                <Text style={[styles.chipText, { color: selected === wt.value ? "#fff" : colors.foreground }]}>{wt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  }

  const inputNode = renderInput();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <View style={[styles.amyRow, { justifyContent: "space-between" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("../assets/images/amynest-logo.png")}
              style={styles.amyAvatar}
              resizeMode="cover"
            />
            <View>
              <Text style={[styles.amyName, { color: colors.foreground }]}>Amy</Text>
              <Text style={[styles.amyStatus, { color: "#10B981" }]}>Parenting Coach</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={async () => {
              try {
                await authFetch("/api/onboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ onboardingComplete: true }),
                });
              } catch (_) {}
              router.replace("/(tabs)");
            }}
            style={styles.skipBtn}
            activeOpacity={0.7}
            testID="skip-onboarding-btn"
          >
            <Text style={styles.skipBtnText}>Skip — will do it manually</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        inverted
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          typing ? (
            <View style={[styles.msgRow, { justifyContent: "flex-start" }]}>
              <Image
                source={require("../assets/images/amynest-logo.png")}
                style={{ width: 28, height: 28, borderRadius: 14 }}
                resizeMode="cover"
              />
              <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.dot, { backgroundColor: PRIMARY }]} />
                <View style={[styles.dot, { backgroundColor: PRIMARY }]} />
                <View style={[styles.dot, { backgroundColor: PRIMARY }]} />
              </View>
            </View>
          ) : null
        }
        renderItem={({ item: m }) => (
          <View style={[styles.msgRow, { justifyContent: m.role === "amy" ? "flex-start" : "flex-end" }]}>
            {m.role === "amy" && (
              <Image
                source={require("../assets/images/amynest-logo.png")}
                style={{ width: 28, height: 28, borderRadius: 14 }}
                resizeMode="cover"
              />
            )}
            <View style={[
              styles.bubble,
              m.role === "amy"
                ? { backgroundColor: colors.card, borderColor: colors.border }
                : { backgroundColor: PRIMARY },
            ]}>
              <Text style={[styles.bubbleText, { color: m.role === "amy" ? colors.foreground : "#fff" }]}>{m.text}</Text>
            </View>
          </View>
        )}
      />

      {inputNode && (
        <View style={[styles.inputContainer, { paddingBottom: botPad + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          {inputNode}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 16, paddingBottom: 12 },
  amyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.08)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.15)",
  },
  skipBtnText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#6366F1",
  },
  amyAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  amyName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  amyStatus: { fontSize: 11, fontFamily: "Inter_500Medium" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  bubble: { maxWidth: "78%", padding: 12, borderRadius: 18, borderWidth: 1, borderColor: "transparent" },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  typingBubble: { flexDirection: "row", gap: 4, padding: 14, borderRadius: 18, borderWidth: 1, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  inputContainer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  textInput: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dobContainer: { flexDirection: "row", gap: 10, alignItems: "center" },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  confirmBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  rowBtns: { flexDirection: "row", gap: 10 },
  optionBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1.5 },
  optionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  doneContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  amyBigBubble: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  doneBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  doneBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
});
