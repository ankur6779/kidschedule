import { useEffect, useMemo, useRef, useState } from "react";

const COLORS = [
  { id: "r", name: "Red",    bg: "#ef4444" },
  { id: "b", name: "Blue",   bg: "#3b82f6" },
  { id: "g", name: "Green",  bg: "#22c55e" },
  { id: "y", name: "Yellow", bg: "#facc15" },
  { id: "p", name: "Purple", bg: "#a855f7" },
  { id: "o", name: "Orange", bg: "#fb923c" },
];

function buildSequence(len: number): string[] {
  return Array.from({ length: len }, () => COLORS[Math.floor(Math.random() * COLORS.length)].id);
}

export function ColorMemoryGame({ onFinish }: { onFinish: (score: number, total: number) => void }) {
  const ROUNDS = [3, 4, 5, 5];
  const sequences = useMemo(() => ROUNDS.map(buildSequence), []);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"show" | "input" | "feedback">("show");
  const [showIdx, setShowIdx] = useState(0);
  const [input, setInput] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [correctRound, setCorrectRound] = useState(false);
  const timerRef = useRef<number | null>(null);

  const seq = sequences[round];

  // Show phase: flash colors
  useEffect(() => {
    if (phase !== "show") return;
    setShowIdx(0);
    let i = 0;
    timerRef.current = window.setInterval(() => {
      i += 1;
      if (i >= seq.length) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        setTimeout(() => { setPhase("input"); setInput([]); }, 400);
      } else {
        setShowIdx(i);
      }
    }, 700);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, phase]);

  if (round >= sequences.length) return null;

  const onPick = (id: string) => {
    if (phase !== "input") return;
    const next = [...input, id];
    setInput(next);
    if (next.length === seq.length) {
      const ok = next.every((c, i) => c === seq[i]);
      setCorrectRound(ok);
      setPhase("feedback");
      if (ok) setScore((s) => s + 1);
      setTimeout(() => {
        if (round + 1 >= sequences.length) onFinish(ok ? score + 1 : score, sequences.length);
        else { setRound((r) => r + 1); setPhase("show"); }
      }, 1100);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color: "#a99fd9", fontSize: 12, marginBottom: 6 }}>Round {round + 1} of {sequences.length} · Length {seq.length}</div>
      <div style={{
        height: 86, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16,
      }}>
        {phase === "show" && (
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: COLORS.find((c) => c.id === seq[showIdx])?.bg ?? "#fff",
            boxShadow: "0 0 30px " + (COLORS.find((c) => c.id === seq[showIdx])?.bg ?? "#fff") + "55",
            transition: "background 0.15s",
          }} />
        )}
        {phase === "input" && (
          <div style={{ color: "#c7c0e8", fontSize: 13 }}>Now tap the colours in order ({input.length}/{seq.length})</div>
        )}
        {phase === "feedback" && (
          <div style={{ fontSize: 32, color: correctRound ? "#22c55e" : "#ef4444", fontWeight: 800 }}>
            {correctRound ? "✓" : "✗"}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 260, margin: "0 auto" }}>
        {COLORS.map((c) => (
          <button key={c.id} disabled={phase !== "input"} onClick={() => onPick(c.id)}
            style={{
              background: c.bg, color: "#fff", border: "none", borderRadius: 12,
              padding: "20px 0", fontSize: 12, fontWeight: 800,
              fontFamily: "Quicksand, sans-serif",
              cursor: phase === "input" ? "pointer" : "default",
              opacity: phase === "input" ? 1 : 0.5,
            }}
          >{c.name}</button>
        ))}
      </div>
      <div style={{ marginTop: 14, color: "#c4b5fd", fontSize: 12, fontWeight: 700 }}>Score: {score}</div>
    </div>
  );
}
