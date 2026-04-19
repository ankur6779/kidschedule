import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Volume2, Pause, Play, SkipBack, SkipForward, Headphones,
  Sparkles, Gauge, X, Clock,
} from "lucide-react";
import { LESSONS, AGE_LABELS, lessonsForAge, type AgeBucket, type Lesson } from "@/lib/audio-lessons";

const AGE_ORDER: AgeBucket[] = ["0-2", "2-4", "5-7", "8-10", "10+"];

const RESUME_KEY = "amynest_audio_resume_v1";
type ResumeMap = Record<string, number>;
const loadResume = (): ResumeMap => {
  try { return JSON.parse(localStorage.getItem(RESUME_KEY) ?? "{}"); } catch { return {}; }
};
const saveResume = (m: ResumeMap) => localStorage.setItem(RESUME_KEY, JSON.stringify(m));

export default function AudioLessonsPage() {
  const [, setLocation] = useLocation();
  const [age, setAge] = useState<AgeBucket>("2-4");
  const [open, setOpen] = useState<Lesson | null>(null);

  const lessons = useMemo(() => lessonsForAge(age), [age]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f0c29 0%, #1a1040 55%, #0c1220 100%)",
      color: "#fff",
      paddingBottom: 80,
    }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
        background: "linear-gradient(180deg, rgba(15,12,41,0.95) 0%, rgba(15,12,41,0.7) 100%)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(139,92,246,0.2)",
      }}>
        <button
          onClick={() => setLocation("/amy-coach")}
          style={{ color: "#c4b5fd", background: "rgba(167,139,250,0.15)", borderRadius: 999, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Headphones size={20} color="#c4b5fd" />
          <h1 style={{ fontFamily: "Quicksand, sans-serif", fontSize: 18, fontWeight: 800, margin: 0 }}>
            Amy Audio Lessons
          </h1>
        </div>
      </div>

      {/* Intro */}
      <div style={{ padding: "20px 16px 8px", maxWidth: 720, margin: "0 auto" }}>
        <p style={{ color: "#c7c0e8", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          Hands full? Let Amy talk you through the most important parenting topics for your child's age group.
          Each lesson is 3–5 minutes. Tap any lesson to listen.
        </p>
      </div>

      {/* Age selector */}
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px",
        scrollbarWidth: "none",
      }} className="ws-no-scrollbar">
        {AGE_ORDER.map((a) => {
          const active = a === age;
          return (
            <button
              key={a}
              onClick={() => setAge(a)}
              style={{
                whiteSpace: "nowrap",
                padding: "9px 14px",
                borderRadius: 999,
                border: "1px solid " + (active ? "transparent" : "rgba(139,92,246,0.3)"),
                background: active
                  ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                  : "rgba(255,255,255,0.06)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: active ? "0 4px 12px rgba(139,92,246,0.4)" : "none",
              }}
            >
              {AGE_LABELS[a]}
            </button>
          );
        })}
      </div>

      {/* Lesson grid */}
      <div style={{
        maxWidth: 720, margin: "0 auto",
        padding: "8px 16px",
        display: "grid", gridTemplateColumns: "1fr", gap: 12,
      }}>
        {lessons.map((l) => (
          <button
            key={l.id}
            onClick={() => setOpen(l)}
            style={{
              textAlign: "left",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: 16,
              padding: 16,
              cursor: "pointer",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              color: "#fff",
              transition: "transform 0.15s, background 0.15s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div style={{
              fontSize: 30, lineHeight: 1, width: 48, height: 48,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(139,92,246,0.15)", borderRadius: 12,
              flexShrink: 0,
            }}>{l.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, fontFamily: "Quicksand, sans-serif" }}>
                  {l.title}
                </h3>
              </div>
              <p style={{ margin: "0 0 8px", color: "#c7c0e8", fontSize: 13, lineHeight: 1.45 }}>
                {l.description}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "#a99fd9" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} /> {l.durationMin} min
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Sparkles size={12} /> {l.expert}
                </span>
              </div>
            </div>
            <Volume2 size={18} color="#c4b5fd" style={{ flexShrink: 0, marginTop: 4 }} />
          </button>
        ))}
        {lessons.length === 0 && (
          <div style={{ textAlign: "center", color: "#a99fd9", padding: 30 }}>
            More lessons for this age group coming soon.
          </div>
        )}
      </div>

      {open && <PlayerSheet lesson={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

// ─── Player ─────────────────────────────────────────────────────────
function PlayerSheet({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [paragraphIdx, setParagraphIdx] = useState(0);
  const [rate, setRate] = useState<number>(1);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Resume from saved index
  useEffect(() => {
    const r = loadResume();
    const saved = r[lesson.id] ?? 0;
    if (saved > 0 && saved < lesson.paragraphs.length) setParagraphIdx(saved);
    else if (saved >= lesson.paragraphs.length) setParagraphIdx(0);
  }, [lesson.id]);

  // Persist position
  useEffect(() => {
    const r = loadResume();
    r[lesson.id] = paragraphIdx;
    saveResume(r);
  }, [lesson.id, paragraphIdx]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
    }
    return () => {
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  // Whenever play state, paragraph or rate changes, restart utterance for that paragraph.
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    if (!playing) return;
    const text = lesson.paragraphs[paragraphIdx];
    if (!text) { setPlaying(false); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = rate;
    utt.pitch = 1;
    utt.lang = "en-IN";
    utt.onend = () => {
      // auto-advance
      setParagraphIdx((i) => {
        if (i + 1 >= lesson.paragraphs.length) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    };
    utt.onerror = () => setPlaying(false);
    utterRef.current = utt;
    synth.speak(utt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, paragraphIdx, rate, supported]);

  const next = () => {
    if (paragraphIdx + 1 < lesson.paragraphs.length) setParagraphIdx(paragraphIdx + 1);
  };
  const prev = () => {
    if (paragraphIdx > 0) setParagraphIdx(paragraphIdx - 1);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(8,5,25,0.85)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: "linear-gradient(180deg, #1a1040 0%, #0f0c29 100%)",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: "16px 20px 28px",
          color: "#fff",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.6)",
          maxHeight: "92vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 28 }}>{lesson.emoji}</div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: "Quicksand, sans-serif" }}>{lesson.title}</h3>
              <div style={{ fontSize: 11, color: "#a99fd9" }}>{lesson.expert} · {lesson.durationMin} min</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ color: "#c4b5fd", background: "rgba(167,139,250,0.15)", borderRadius: 999, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {!supported && (
          <div style={{
            padding: 12, borderRadius: 12,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#fecaca", fontSize: 13, marginBottom: 12,
          }}>
            Audio playback is not supported in this browser. You can still read the lesson below.
          </div>
        )}

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {lesson.paragraphs.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= paragraphIdx ? "#8b5cf6" : "rgba(139,92,246,0.2)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Current paragraph (highlighted) */}
        <div style={{
          background: "rgba(139,92,246,0.10)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: 14, padding: 14,
          marginBottom: 14,
          fontSize: 15, lineHeight: 1.6,
          color: "#fff",
        }}>
          {lesson.paragraphs[paragraphIdx]}
        </div>

        {/* Mini transcript of all paragraphs */}
        <details style={{ marginBottom: 14, color: "#c7c0e8" }}>
          <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>
            Show full transcript
          </summary>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {lesson.paragraphs.map((p, i) => (
              <button
                key={i}
                onClick={() => setParagraphIdx(i)}
                style={{
                  textAlign: "left", color: i === paragraphIdx ? "#fff" : "#c7c0e8",
                  background: "transparent",
                  border: "none", padding: 0, cursor: "pointer",
                  fontSize: 13, lineHeight: 1.55,
                  opacity: i === paragraphIdx ? 1 : 0.85,
                }}
              >
                <strong style={{ color: "#a99fd9", marginRight: 6 }}>{i + 1}.</strong>{p}
              </button>
            ))}
          </div>
        </details>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
          <button
            onClick={prev}
            disabled={paragraphIdx === 0}
            aria-label="Previous"
            style={{
              color: "#fff", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(139,92,246,0.3)", borderRadius: 999,
              width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: paragraphIdx === 0 ? "default" : "pointer", opacity: paragraphIdx === 0 ? 0.4 : 1,
            }}
          ><SkipBack size={18} /></button>

          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={!supported}
            aria-label={playing ? "Pause" : "Play"}
            style={{
              color: "#fff", background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              border: "none", borderRadius: 999, width: 64, height: 64,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: supported ? "pointer" : "default",
              boxShadow: "0 8px 24px rgba(139,92,246,0.5)",
              opacity: supported ? 1 : 0.4,
            }}
          >
            {playing ? <Pause size={26} /> : <Play size={26} style={{ marginLeft: 3 }} />}
          </button>

          <button
            onClick={next}
            disabled={paragraphIdx === lesson.paragraphs.length - 1}
            aria-label="Next"
            style={{
              color: "#fff", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(139,92,246,0.3)", borderRadius: 999,
              width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: paragraphIdx === lesson.paragraphs.length - 1 ? "default" : "pointer",
              opacity: paragraphIdx === lesson.paragraphs.length - 1 ? 0.4 : 1,
            }}
          ><SkipForward size={18} /></button>
        </div>

        {/* Rate */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Gauge size={14} color="#a99fd9" />
          <span style={{ fontSize: 12, color: "#a99fd9", marginRight: 6 }}>Speed</span>
          {[0.85, 1, 1.15, 1.3, 1.5].map((r) => (
            <button
              key={r}
              onClick={() => setRate(r)}
              style={{
                fontSize: 11, fontWeight: 700,
                padding: "5px 10px", borderRadius: 999,
                border: "1px solid " + (rate === r ? "transparent" : "rgba(139,92,246,0.3)"),
                background: rate === r ? "linear-gradient(135deg, #8b5cf6, #ec4899)" : "transparent",
                color: "#fff", cursor: "pointer",
              }}
            >{r}×</button>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: "#7a749b", textAlign: "center" }}>
          Voice uses your browser. Works offline. Tap a paragraph in the transcript to jump to it.
        </div>
      </div>
    </div>
  );
}
