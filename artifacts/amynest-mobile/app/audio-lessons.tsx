import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
  Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { brand } from "@/constants/colors";
import * as Haptics from "expo-haptics";

// ── Lesson data (mirrors web lib/audio-lessons.ts) ────────────────────────
type AgeBucket = "0-2" | "2-4" | "5-7" | "8-10" | "10+";
interface Lesson { id: string; title: string; age: AgeBucket; duration: string; emoji: string; script: string }

const LESSONS: Lesson[] = [
  // 0-2
  { id:"a1", title:"Newborn Sleep Cycles", age:"0-2", duration:"4 min", emoji:"😴", script:"Newborns sleep 14–17 hours a day in short bursts of 45–90 minutes. Their sleep cycles are shorter than adults — about 50 minutes — which is why they wake so often. The best thing you can do is follow their cues. Watch for eye-rubbing, yawning, or looking away. Responding quickly prevents overtiredness, which actually makes sleep harder. A consistent pre-sleep routine — dim lights, a warm bath, a soft song — begins building sleep associations from week 4 onwards." },
  { id:"a2", title:"Tummy Time Basics",    age:"0-2", duration:"3 min", emoji:"🐢", script:"Tummy time builds the neck, shoulder, and core muscles babies need to roll, sit, and crawl. Start with 2–3 minutes, 2–3 times a day, from the very first week home. Use a rolled towel under the chest for support. Make it fun: lie face-to-face with your baby, use a mirror, or place a high-contrast toy in front. By 4 months, most babies can lift their head 90 degrees. If your baby hates it, try tummy time on your chest or lap first." },
  { id:"a3", title:"Responsive Feeding",   age:"0-2", duration:"3 min", emoji:"🍼", script:"Responsive feeding means following your baby's hunger and fullness cues rather than a strict schedule. Look for rooting, sucking motions, or hands moving toward the mouth as early hunger signals — crying is a late cue. Feed until satisfied, not until a bottle is empty. This builds a healthy relationship with food and trust. Research shows responsive feeding is linked to better self-regulation, healthy weight, and stronger attachment." },
  // 2-4
  { id:"b1", title:"Toddler Tantrums",     age:"2-4", duration:"4 min", emoji:"😤", script:"Tantrums peak between ages 2 and 3 because children have big emotions but immature prefrontal cortices — the part of the brain that manages them. The most effective response is calm consistency. Stay close, name the emotion: 'You're really frustrated.' Don't try to reason mid-tantrum — the thinking brain is offline. After it passes, reconnect with a hug, then briefly discuss what happened. Prevention: hunger, tiredness, and overstimulation are the biggest triggers. Two-minute warnings before transitions help enormously." },
  { id:"b2", title:"Language Explosion",   age:"2-4", duration:"3 min", emoji:"💬", script:"Between 18 months and 3 years, most children add up to 10 new words a day. The single biggest predictor of vocabulary size is how much parents talk to and with their child — not at them. Use parallel talk: narrate what you both are doing. Expand their sentences: if they say 'more milk', you say 'you want more milk, here you go'. Read together daily — even the same books repeatedly. Dual-language children may mix languages, which is completely normal and a cognitive advantage." },
  { id:"b3", title:"Screen Time for Toddlers", age:"2-4", duration:"3 min", emoji:"📱", script:"WHO and AAP guidelines suggest under 1 hour of high-quality screen time per day for ages 2–5, with a parent present when possible. The problem isn't screens — it's displacement of talk, play, and sleep. Video chat with grandparents counts as quality screen time. Educational apps with two-way interaction (where the child must respond) are better than passive watching. The best habit: no screens 1 hour before bedtime, no screens during meals, and always discuss what you watched together." },
  // 5-7
  { id:"c1", title:"Building Reading Habits", age:"5-7", duration:"4 min", emoji:"📚", script:"The 5–7 window is when children move from learning to read to reading to learn — a critical transition. Reading aloud together even after children can read independently accelerates vocabulary and comprehension. Create a reading ritual: same time daily, cozy spot, no pressure to read perfectly. Let children choose books. Comic books and non-fiction count. Libraries remove cost as a barrier. Research shows children who read for 20 minutes a day are exposed to 1.8 million words a year more than those who don't." },
  { id:"c2", title:"School Anxiety",         age:"5-7", duration:"4 min", emoji:"🎒", script:"School anxiety is very common in the 5–7 range during transitions — new school year, new teacher, or after illness. Validate the feeling first: 'It makes sense you feel nervous.' Avoid excessive reassurance loops (which backfire) and instead focus on coping: 'What's one thing that might be okay today?' Maintain a predictable morning routine — chaos amplifies anxiety. Coordinate with the teacher for a check-in strategy. If avoidance is severe or physical symptoms appear regularly, consult a paediatric psychologist." },
  { id:"c3", title:"Emotional Coaching",     age:"5-7", duration:"4 min", emoji:"❤️", script:"Emotional coaching is the parenting approach most strongly linked to children's social competence and academic achievement. It has 5 steps: notice the emotion, see it as a teaching moment, listen and validate, name the emotion, and then problem-solve together. The opposite — dismissing ('You're fine') or punishing emotions ('Stop crying or I'll give you something to cry about') — suppresses emotional development. Children who are emotionally coached show better stress responses, stronger friendships, and lower rates of anxiety and depression." },
  // 8-10
  { id:"d1", title:"Homework Motivation",   age:"8-10", duration:"4 min", emoji:"✏️", script:"Motivation research consistently shows that autonomy, competence, and connection drive intrinsic motivation better than rewards and punishments. For homework: let children choose when and where within limits ('you can do it before or after dinner'). Break large tasks into 20-minute chunks. Celebrate effort and strategy, not just results: 'You really stuck with that hard problem.' Avoid hovering — struggle is where learning happens. If power struggles are chronic, speak with the teacher about workload or check for an undiagnosed learning difference." },
  { id:"d2", title:"Peer Pressure & Friendships", age:"8-10", duration:"3 min", emoji:"👫", script:"Ages 8–10 mark the shift from family as the primary social world to peers. Children this age are intensely concerned with belonging. Build a strong home base: regular one-on-one time, open dinner conversations, and genuine interest in their social world without interrogating. Teach the 'broken record' technique for peer pressure: simply repeat your position calmly. Help them identify at least one trusted adult at school. Research shows children with even one close friendship have dramatically better mental health outcomes." },
  // 10+
  { id:"e1", title:"Talking to Teens",       age:"10+", duration:"5 min", emoji:"🎧", script:"The teenage brain prioritises peer opinion and novelty because the reward system develops earlier than the prefrontal cortex. This makes risk-taking and peer influence peak behaviours — not defiance. The most predictive factor of teen wellbeing is whether they feel they can come to a parent without being lectured. Practice the 20-second rule: listen for at least 20 seconds before speaking. Ask open questions. Share your own experiences non-judgmentally. Repair after arguments quickly — 'I got frustrated and I could have listened better.'" },
  { id:"e2", title:"Digital Safety for Older Kids", age:"10+", duration:"4 min", emoji:"🔒", script:"Research on digital wellbeing shows that rules without explanation backfire with older children. Instead, co-create agreements: what platforms, how long, where devices sleep at night (not in bedrooms). Teach them to evaluate sources, spot manipulation, and protect their personal information. Have explicit conversations about sexting and its legal consequences before they encounter pressure — studies show this reduces incidence. Model the behaviour you want: phones away at meals, no scrolling while talking." },
  { id:"e3", title:"Supporting Teen Mental Health", age:"10+", duration:"5 min", emoji:"🌱", script:"1 in 5 teenagers experience a mental health condition — most go undetected and untreated. Warning signs include: persistent sadness or irritability, social withdrawal, sleep changes, declining grades, giving away possessions. If you're concerned, say so directly: 'I've noticed you seem down lately. I'm not going anywhere — I want to understand.' Avoid minimising ('everyone feels like that') or catastrophising. Seek assessment early; most conditions respond well to therapy when caught before they're entrenched. Your relationship is the most protective factor." },
];

const AGE_BUCKETS: { key: AgeBucket; label: string; emoji: string }[] = [
  { key: "0-2",  label: "0–2 yrs",  emoji: "👶" },
  { key: "2-4",  label: "2–4 yrs",  emoji: "🧒" },
  { key: "5-7",  label: "5–7 yrs",  emoji: "🎨" },
  { key: "8-10", label: "8–10 yrs", emoji: "📚" },
  { key: "10+",  label: "10+ yrs",  emoji: "🎒" },
];

// ── Simulated TTS player using Expo Speech ────────────────────────────────
function usePlayer(lesson: Lesson | null) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef  = useRef(0);
  const TOTAL_SECS  = lesson ? parseInt(lesson.duration) * 60 : 240;

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [lesson?.id]);

  const play = () => {
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      const pct = Math.min(elapsedRef.current / TOTAL_SECS, 1);
      setProgress(pct);
      if (pct >= 1) { clearInterval(intervalRef.current!); setPlaying(false); }
    }, 1000);
  };
  const pause = () => {
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const skip = (delta: number) => {
    elapsedRef.current = Math.max(0, Math.min(TOTAL_SECS, elapsedRef.current + delta));
    setProgress(elapsedRef.current / TOTAL_SECS);
  };
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60); const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  return { playing, progress, play, pause, skip, elapsed: elapsedRef.current, total: TOTAL_SECS, formatTime };
}

export default function AudioLessonsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedAge, setSelectedAge] = useState<AgeBucket>("2-4");
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const lessons = useMemo(() => LESSONS.filter(l => l.age === selectedAge), [selectedAge]);
  const player = usePlayer(openLesson);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pulsePlay = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  return (
    <LinearGradient colors={["#0f0c29", "#1a1040", "#0c1220"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#c4b5fd" />
        </TouchableOpacity>
        <Ionicons name="headset" size={20} color="#c4b5fd" style={{ marginRight: 6 }} />
        <Text style={styles.headerTitle}>Amy Audio Lessons</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Text style={styles.intro}>
          Hands full? Let Amy talk you through the most important parenting topics for your child's age. Each lesson is 3–5 minutes.
        </Text>

        {/* Age selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agePills} style={{ marginBottom: 20 }}>
          {AGE_BUCKETS.map(b => {
            const active = b.key === selectedAge;
            return (
              <TouchableOpacity
                key={b.key}
                onPress={() => { setSelectedAge(b.key); setOpenLesson(null); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                activeOpacity={0.8}
              >
                {active ? (
                  <LinearGradient colors={[brand.primary, "#ec4899"]} style={styles.pill}>
                    <Text style={styles.pillTextActive}>{b.emoji} {b.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.pillInactive}>
                    <Text style={styles.pillText}>{b.emoji} {b.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lesson list */}
        {lessons.map(lesson => {
          const isOpen = openLesson?.id === lesson.id;
          return (
            <View key={lesson.id} style={[styles.lessonCard, isOpen && styles.lessonCardOpen]}>
              <TouchableOpacity
                onPress={() => { setOpenLesson(isOpen ? null : lesson); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                activeOpacity={0.85}
                style={styles.lessonHeader}
              >
                <View style={styles.lessonEmoji}><Text style={{ fontSize: 26 }}>{lesson.emoji}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <Ionicons name="time-outline" size={11} color="#a99fd9" />
                    <Text style={styles.lessonMeta}>{lesson.duration}</Text>
                  </View>
                </View>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#a99fd9" />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.playerWrap}>
                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: `${player.progress * 100}%` as any }]} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    <Text style={styles.timeText}>{player.formatTime(player.elapsed)}</Text>
                    <Text style={styles.timeText}>{lesson.duration}</Text>
                  </View>

                  {/* Controls */}
                  <View style={styles.controls}>
                    <TouchableOpacity onPress={() => player.skip(-15)} style={styles.skipBtn} activeOpacity={0.7}>
                      <Ionicons name="play-back" size={22} color="#c4b5fd" />
                    </TouchableOpacity>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      <TouchableOpacity
                        onPress={() => { pulsePlay(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); player.playing ? player.pause() : player.play(); }}
                        style={styles.playBtn} activeOpacity={0.85}
                      >
                        <LinearGradient colors={[brand.primary, "#ec4899"]} style={styles.playBtnGrad}>
                          <Ionicons name={player.playing ? "pause" : "play"} size={26} color="#fff" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity onPress={() => player.skip(15)} style={styles.skipBtn} activeOpacity={0.7}>
                      <Ionicons name="play-forward" size={22} color="#c4b5fd" />
                    </TouchableOpacity>
                  </View>

                  {/* Script preview */}
                  <Text style={styles.script} numberOfLines={5}>{lesson.script}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(139,92,246,0.2)",
    gap: 6,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(167,139,250,0.15)",
    alignItems: "center", justifyContent: "center", marginRight: 4,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  intro: { color: "#c7c0e8", fontSize: 13, lineHeight: 20, marginVertical: 16 },
  agePills: { gap: 8, paddingVertical: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  pillInactive: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(139,92,246,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  pillText: { color: "#c4b5fd", fontSize: 13, fontWeight: "600" },
  pillTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  lessonCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.25)",
    borderRadius: 16, marginBottom: 10, overflow: "hidden",
  },
  lessonCardOpen: { borderColor: brand.primary + "60" },
  lessonHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  lessonEmoji: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  lessonTitle: { color: "#fff", fontSize: 14, fontWeight: "800", lineHeight: 19 },
  lessonMeta: { color: "#a99fd9", fontSize: 11 },
  playerWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  progressTrack: {
    height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: brand.primary },
  timeText: { color: "#a99fd9", fontSize: 11 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginVertical: 16 },
  skipBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  playBtn: { width: 60, height: 60, borderRadius: 30, overflow: "hidden" },
  playBtnGrad: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
  script: {
    color: "#c7c0e8", fontSize: 12.5, lineHeight: 18.5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10, padding: 12,
  },
});
