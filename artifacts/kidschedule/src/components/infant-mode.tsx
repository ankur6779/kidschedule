import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Volume2, ChevronDown, ChevronUp } from "lucide-react";
import { formatAge, PARENT_TASKS_BY_GROUP } from "@/lib/age-groups";

// ─────────────────────────────────────────────────────────────
// Lullaby Player using Web Audio API
// ─────────────────────────────────────────────────────────────
type LullabyTrack = { name: string; notes: number[]; tempo: number; emoji: string };

const LULLABY_TRACKS: LullabyTrack[] = [
  {
    name: "Twinkle Twinkle",
    emoji: "⭐",
    tempo: 0.45,
    notes: [261.63, 261.63, 392, 392, 440, 440, 392, 349.23, 349.23, 329.63, 329.63, 293.66, 293.66, 261.63],
  },
  {
    name: "Sleep Little Baby",
    emoji: "🌙",
    tempo: 0.6,
    notes: [329.63, 293.66, 261.63, 293.66, 329.63, 329.63, 329.63, 293.66, 293.66, 293.66, 329.63, 392, 392],
  },
  {
    name: "Gentle Lullaby",
    emoji: "🌸",
    tempo: 0.55,
    notes: [392, 349.23, 329.63, 293.66, 261.63, 293.66, 329.63, 349.23, 392, 392, 392, 349.23, 329.63],
  },
];

function useLullabyPlayer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(null);
  };

  const play = (track: LullabyTrack) => {
    stop();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioCtx();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      let cancelled = false;
      let currentOsc: OscillatorNode | null = null;

      const playLoop = (startTime: number) => {
        track.notes.forEach((freq, i) => {
          const t = startTime + i * track.tempo;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + track.tempo * 0.9);
          osc.start(t);
          osc.stop(t + track.tempo);
          if (i === track.notes.length - 1) {
            osc.onended = () => {
              if (!cancelled) playLoop(ctx.currentTime + 0.05);
            };
          }
          currentOsc = osc;
        });
      };

      playLoop(ctx.currentTime + 0.05);
      setPlaying(track.name);

      stopRef.current = () => {
        cancelled = true;
        try { currentOsc?.stop(); } catch {}
        setPlaying(null);
      };
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  useEffect(() => () => { stop(); }, []);

  return { play, stop, playing };
}

// ─────────────────────────────────────────────────────────────
// Vaccination Timeline
// ─────────────────────────────────────────────────────────────
const VACCINES = [
  { age: "At Birth", vaccines: ["BCG", "Hepatitis B (dose 1)", "OPV 0"], done: true },
  { age: "6 Weeks", vaccines: ["DPT (dose 1)", "OPV 1", "Hib", "Rotavirus", "PCV"], done: false },
  { age: "10 Weeks", vaccines: ["DPT (dose 2)", "OPV 2", "Hib", "Rotavirus", "PCV"], done: false },
  { age: "14 Weeks", vaccines: ["DPT (dose 3)", "OPV 3", "IPV", "Hib", "Rotavirus", "PCV"], done: false },
  { age: "6 Months", vaccines: ["Hepatitis B (dose 2)", "OPV 4"], done: false },
  { age: "9 Months", vaccines: ["MMR (dose 1)", "MR Vaccine"], done: false },
  { age: "12 Months", vaccines: ["Hepatitis A", "Typhoid", "Varicella"], done: false },
];

// ─────────────────────────────────────────────────────────────
// InfantMode Component
// ─────────────────────────────────────────────────────────────
interface InfantModeProps {
  childName: string;
  ageYears: number;
  ageMonths: number;
}

export function InfantMode({ childName, ageYears, ageMonths }: InfantModeProps) {
  const { play, stop, playing } = useLullabyPlayer();
  const [openCard, setOpenCard] = useState<string | null>("feeding");
  const parentTasks = PARENT_TASKS_BY_GROUP["infant"];

  const toggle = (id: string) => setOpenCard((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <div className="text-5xl">👶</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-pink-100 text-pink-800 border-pink-300 font-bold">Infant Mode</Badge>
              <Badge variant="outline" className="text-xs">{formatAge(ageYears, ageMonths)}</Badge>
            </div>
            <h2 className="font-quicksand text-xl font-bold text-foreground">
              {childName}'s Care Guide
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Personalized guidance for your little one's stage of development
            </p>
          </div>
        </div>
      </div>

      {/* Guidance Cards */}
      {[
        {
          id: "feeding",
          emoji: "🤱",
          title: "Feeding Tips",
          color: "border-amber-200 bg-amber-50",
          titleColor: "text-amber-900",
          content: (
            <div className="space-y-3 text-sm text-amber-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Breastfeeding Benefits", icon: "❤️", points: ["Perfect nutrition for newborns", "Boosts immunity (antibodies)", "Reduces infection risk", "Promotes bonding & warmth", "WHO recommends exclusive breastfeeding for 6 months"] },
                  { title: "Feeding Intervals", icon: "⏰", points: ["0–1 month: every 1.5–3 hours (8–12x/day)", "1–3 months: every 2–3 hours", "3–6 months: every 3–4 hours", "6+ months: start solids + milk", "Feed on demand — watch hunger cues"] },
                  { title: "Hunger Cues", icon: "🍼", points: ["Rooting (turning head to breast)", "Sucking on hands or lips", "Fussiness before crying", "Crying is a late hunger signal"] },
                  { title: "Introducing Solids (6m+)", icon: "🥄", points: ["Start with purees: rice, dal water, mashed banana", "One new food every 3 days", "Avoid honey, salt, sugar before 1 year", "Ensure plenty of tummy time after feeding"] },
                ].map((card) => (
                  <div key={card.title} className="bg-white rounded-2xl p-3 border border-amber-100">
                    <p className="font-bold text-amber-900 mb-2">{card.icon} {card.title}</p>
                    <ul className="space-y-1">
                      {card.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-1.5 text-xs">
                          <span className="text-amber-500 mt-0.5">•</span>{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "vaccination",
          emoji: "💉",
          title: "Vaccination Schedule",
          color: "border-blue-200 bg-blue-50",
          titleColor: "text-blue-900",
          content: (
            <div className="space-y-2">
              <p className="text-xs text-blue-700 mb-3 font-medium">⚠️ Always follow your pediatrician's advice. This is a general Indian immunization schedule.</p>
              {VACCINES.map((v) => (
                <div key={v.age} className="bg-white rounded-xl p-3 border border-blue-100 flex items-start gap-3">
                  <div className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${v.done ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {v.age}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {v.vaccines.map((vac) => (
                      <span key={vac} className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">{vac}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 mt-3">
                ✅ <strong>Why vaccines matter:</strong> They protect your baby from life-threatening diseases before their immune system is fully developed. Never skip or delay without doctor's advice.
              </div>
            </div>
          ),
        },
        {
          id: "sleep",
          emoji: "😴",
          title: "Sleep Guidance",
          color: "border-indigo-200 bg-indigo-50",
          titleColor: "text-indigo-900",
          content: (
            <div className="space-y-3 text-sm text-indigo-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Sleep Hours by Age", icon: "🕐", points: ["Newborn: 14–17 hours (total)", "1–2 months: 12–16 hours", "3–5 months: 12–15 hours", "6–12 months: 12–16 hours", "Includes naps throughout the day"] },
                  { title: "Safe Sleep (Back to Sleep)", icon: "🛏️", points: ["Always place baby on their back", "Firm, flat sleep surface", "No pillows, blankets, or soft toys in crib", "Keep room temperature comfortable (22–24°C)", "Room-sharing but NOT bed-sharing for safety"] },
                  { title: "Sleep Cycles", icon: "🌙", points: ["Infants have shorter cycles (50–60 min)", "Light sleep & REM is longer than adults", "Night wakings are completely normal", "Avoid rushing to pick up — observe first", "Consistent bedtime routine helps regulate"] },
                  { title: "Bedtime Routine Tips", icon: "✨", points: ["Same time each night (7–8 PM)", "Warm bath → feeding → gentle rocking", "Lullabies & dim lights signal sleep time", "Put down drowsy but awake after 3 months"] },
                ].map((card) => (
                  <div key={card.title} className="bg-white rounded-2xl p-3 border border-indigo-100">
                    <p className="font-bold text-indigo-900 mb-2">{card.icon} {card.title}</p>
                    <ul className="space-y-1">
                      {card.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-1.5 text-xs">
                          <span className="text-indigo-400 mt-0.5">•</span>{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "potty",
          emoji: "🚿",
          title: "Potty Training Guide",
          color: "border-emerald-200 bg-emerald-50",
          titleColor: "text-emerald-900",
          content: (
            <div className="space-y-3 text-sm text-emerald-800">
              <div className="bg-white rounded-2xl p-4 border border-emerald-100">
                <p className="font-bold text-emerald-900 mb-3">📅 Readiness Signs (Usually 18–24 months)</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Stays dry for 2+ hours", "Shows interest in toilet", "Can pull pants up/down", "Communicates when wet/dirty", "Can follow simple instructions", "Shows discomfort in dirty diaper"].map((sign) => (
                    <div key={sign} className="flex items-center gap-1.5 text-xs">
                      <span className="text-emerald-500">✓</span> {sign}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                  <p className="font-bold text-emerald-900 mb-2">🏆 Training Steps</p>
                  <ol className="space-y-1 list-decimal list-inside text-xs">
                    <li>Introduce the potty — let them explore it</li>
                    <li>Use simple words like "pee" and "poo"</li>
                    <li>Set regular toilet times (morning, after meals)</li>
                    <li>Praise every success, no punishment for accidents</li>
                    <li>Transition to underwear when ready</li>
                  </ol>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                  <p className="font-bold text-emerald-900 mb-2">⚠️ Don'ts</p>
                  <ul className="space-y-1 text-xs">
                    {["Never force or punish accidents", "Don't start during major life changes", "Avoid negative language", "Don't compare with other children", "Don't rush — every child is different"].map((d) => (
                      <li key={d} className="flex items-start gap-1.5"><span className="text-rose-500 mt-0.5">✗</span>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ),
        },
      ].map(({ id, emoji, title, color, titleColor, content }) => (
        <Card key={id} className={`rounded-3xl border-2 ${color} shadow-none`}>
          <button
            className="w-full p-5 flex items-center justify-between"
            onClick={() => toggle(id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <h3 className={`font-quicksand text-lg font-bold ${titleColor}`}>{title}</h3>
            </div>
            {openCard === id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </button>
          {openCard === id && (
            <CardContent className="px-5 pb-5 pt-0">
              {content}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Lullaby Player */}
      <Card className="rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎵</span>
            <div>
              <h3 className="font-quicksand text-lg font-bold text-purple-900">Lullaby Music</h3>
              <p className="text-xs text-purple-700">Calming melodies to soothe your baby to sleep</p>
            </div>
          </div>
          <div className="space-y-2">
            {LULLABY_TRACKS.map((track) => {
              const isPlaying = playing === track.name;
              return (
                <div key={track.name} className="flex items-center gap-3 bg-white/70 rounded-2xl px-4 py-3 border border-purple-100">
                  <span className="text-xl">{track.emoji}</span>
                  <span className="flex-1 text-sm font-bold text-purple-900">{track.name}</span>
                  {isPlaying ? (
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5 items-end h-5">
                        {[3, 5, 4, 6, 3].map((h, i) => (
                          <div key={i} className={`w-1 bg-purple-500 rounded-full animate-bounce`} style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full h-8 px-3 border-purple-300 text-purple-700 ml-2"
                        onClick={stop}
                      >
                        <Square className="h-3 w-3 mr-1" /> Stop
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => play(track)}
                    >
                      <Play className="h-3 w-3 mr-1" /> Play
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-purple-600 mt-3 text-center">
            🎵 Melodies generated by the browser's audio engine — no internet needed
          </p>
        </CardContent>
      </Card>

      {/* Parent Tasks */}
      <Card className="rounded-3xl border-2 border-rose-200 bg-rose-50 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">💝</span>
            <div>
              <h3 className="font-quicksand text-lg font-bold text-rose-900">Your Parent Tasks Today</h3>
              <p className="text-xs text-rose-700">Small daily actions with big developmental impact</p>
            </div>
          </div>
          <div className="space-y-2">
            {parentTasks.map((t) => (
              <div key={t.task} className="flex items-start gap-3 bg-white rounded-2xl p-3 border border-rose-100">
                <span className="text-xl shrink-0">{t.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-rose-900">{t.task}</p>
                  <p className="text-xs text-rose-600 mt-0.5">⏱ {t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
