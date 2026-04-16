import { useState, useMemo, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Worksheet = {
  id: string; title: string; emoji: string; bg: string; accent: string;
  fileUrl: string; ageMin: number; ageMax: number; subject: string;
};
type Reel = {
  id: string; title: string; emoji: string; bg: string; accent: string;
  videoUrl: string; duration: string; ageMin: number; ageMax: number;
};
type Origami = {
  id: string; title: string; emoji: string; bg: string; accent: string;
  difficulty: "Easy" | "Medium" | "Fun"; steps: number; ageMin: number; ageMax: number;
};
type ActivityState = {
  worksheetIds: string[]; reelIds: string[]; origamiIds: string[];
  doneIds: string[]; savedIds: string[];
};

// ─── Datasets ────────────────────────────────────────────────────────────────
const WORKSHEETS: Worksheet[] = [
  { id:"ws1",  title:"ABC Tracing Practice",       emoji:"✏️", bg:"bg-blue-100",    accent:"#3B82F6", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",       ageMin:24, ageMax:60,  subject:"Literacy" },
  { id:"ws2",  title:"1–10 Number Counting",       emoji:"🔢", bg:"bg-green-100",   accent:"#10B981", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",  ageMin:24, ageMax:60,  subject:"Math" },
  { id:"ws3",  title:"Color the Farm Animals",     emoji:"🐄", bg:"bg-orange-100",  accent:"#F97316", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",   ageMin:24, ageMax:72,  subject:"Art" },
  { id:"ws4",  title:"Match the Shapes",           emoji:"🔵", bg:"bg-purple-100",  accent:"#8B5CF6", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",    ageMin:24, ageMax:60,  subject:"Math" },
  { id:"ws5",  title:"Big & Small Sort",           emoji:"🐘", bg:"bg-amber-100",   accent:"#D97706", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",  ageMin:24, ageMax:54,  subject:"Logic" },
  { id:"ws6",  title:"Write My Name Practice",     emoji:"✨", bg:"bg-pink-100",    accent:"#EC4899", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",      ageMin:36, ageMax:84,  subject:"Literacy" },
  { id:"ws7",  title:"Spot the Difference",        emoji:"👀", bg:"bg-teal-100",    accent:"#14B8A6", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",      ageMin:36, ageMax:96,  subject:"Logic" },
  { id:"ws8",  title:"Connect the Dots – Stars",   emoji:"🌟", bg:"bg-yellow-100",  accent:"#EAB308", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",      ageMin:36, ageMax:84,  subject:"Art" },
  { id:"ws9",  title:"Alphabet Coloring A–Z",      emoji:"🎨", bg:"bg-rose-100",    accent:"#F43F5E", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",  ageMin:36, ageMax:72,  subject:"Literacy" },
  { id:"ws10", title:"Simple Addition Fun",        emoji:"➕", bg:"bg-indigo-100",  accent:"#6366F1", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",  ageMin:48, ageMax:96,  subject:"Math" },
  { id:"ws11", title:"Hindi Varnamala Tracing",    emoji:"हि",  bg:"bg-emerald-100", accent:"#059669", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",     ageMin:36, ageMax:84,  subject:"Hindi" },
  { id:"ws12", title:"My Body Parts Worksheet",    emoji:"🧍", bg:"bg-sky-100",     accent:"#0EA5E9", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",      ageMin:24, ageMax:72,  subject:"Science" },
  { id:"ws13", title:"Fruits & Vegetables Match",  emoji:"🍎", bg:"bg-lime-100",    accent:"#84CC16", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",    ageMin:24, ageMax:72,  subject:"GK" },
  { id:"ws14", title:"Weather Chart Worksheet",    emoji:"🌤️", bg:"bg-cyan-100",    accent:"#06B6D4", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",   ageMin:48, ageMax:96,  subject:"Science" },
  { id:"ws15", title:"Multiplication Table 2–5",   emoji:"✖️", bg:"bg-violet-100",  accent:"#7C3AED", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",  ageMin:72, ageMax:96,  subject:"Math" },
  { id:"ws16", title:"Story Sequencing Cards",     emoji:"📖", bg:"bg-fuchsia-100", accent:"#D946EF", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",     ageMin:60, ageMax:96,  subject:"Literacy" },
  { id:"ws17", title:"Map of India Fill-in",       emoji:"🗺️", bg:"bg-orange-100",  accent:"#EA580C", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",       ageMin:72, ageMax:96,  subject:"GK" },
  { id:"ws18", title:"Colour the Rangoli",         emoji:"🪔", bg:"bg-red-100",     accent:"#DC2626", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",   ageMin:36, ageMax:96,  subject:"Art" },
  { id:"ws19", title:"Opposite Words Match",       emoji:"🔄", bg:"bg-blue-100",    accent:"#2563EB", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link", ageMin:48, ageMax:84,  subject:"Literacy" },
  { id:"ws20", title:"Clock Reading Practice",     emoji:"⏰", bg:"bg-stone-100",   accent:"#78716C", fileUrl:"https://drive.google.com/drive/folders/1vT-SG778TlLbgb64aCbZUO1y1hGq1Wyr?usp=drive_link",     ageMin:60, ageMax:96,  subject:"Math" },
];

const REELS: Reel[] = [
  { id:"r1",  title:"Easy Paper Butterfly Craft",     emoji:"🦋", bg:"bg-pink-100",    accent:"#EC4899", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"4 min", ageMin:24, ageMax:96 },
  { id:"r2",  title:"Rainbow Umbrella Painting",      emoji:"🌈", bg:"bg-yellow-100",  accent:"#F59E0B", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"6 min", ageMin:24, ageMax:84 },
  { id:"r3",  title:"Clay Fruits – Mango & Apple",    emoji:"🥭", bg:"bg-orange-100",  accent:"#F97316", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"8 min", ageMin:36, ageMax:96 },
  { id:"r4",  title:"DIY Paper Crown for Kids",       emoji:"👑", bg:"bg-amber-100",   accent:"#D97706", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"5 min", ageMin:24, ageMax:84 },
  { id:"r5",  title:"Vegetable Stamp Art",            emoji:"🥦", bg:"bg-green-100",   accent:"#10B981", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"7 min", ageMin:24, ageMax:72 },
  { id:"r6",  title:"How to Draw a Lion – Easy",      emoji:"🦁", bg:"bg-amber-100",   accent:"#B45309", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"6 min", ageMin:36, ageMax:96 },
  { id:"r7",  title:"Sock Puppet Show Craft",         emoji:"🧦", bg:"bg-purple-100",  accent:"#7C3AED", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"9 min", ageMin:36, ageMax:84 },
  { id:"r8",  title:"Nature Collage with Leaves",     emoji:"🍃", bg:"bg-teal-100",    accent:"#0D9488", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"7 min", ageMin:24, ageMax:96 },
  { id:"r9",  title:"Marble Run Paper Craft",         emoji:"⚙️", bg:"bg-blue-100",    accent:"#3B82F6", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"10 min", ageMin:60, ageMax:96 },
  { id:"r10", title:"Diwali Diya Decoration",         emoji:"🪔", bg:"bg-red-100",     accent:"#DC2626", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"8 min", ageMin:36, ageMax:96 },
  { id:"r11", title:"Paper Plate Fish Mobile",        emoji:"🐠", bg:"bg-sky-100",     accent:"#0284C7", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"5 min", ageMin:24, ageMax:72 },
  { id:"r12", title:"Finger Printing Art – Flowers",  emoji:"🌸", bg:"bg-rose-100",    accent:"#F43F5E", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"6 min", ageMin:24, ageMax:72 },
  { id:"r13", title:"Create a Paper Zoo",             emoji:"🦒", bg:"bg-lime-100",    accent:"#65A30D", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"12 min", ageMin:48, ageMax:96 },
  { id:"r14", title:"Sand Art Greeting Cards",        emoji:"🏖️", bg:"bg-yellow-100",  accent:"#CA8A04", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"8 min", ageMin:48, ageMax:96 },
  { id:"r15", title:"Recycled Robot Craft",           emoji:"🤖", bg:"bg-slate-100",   accent:"#475569", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"11 min", ageMin:60, ageMax:96 },
  { id:"r16", title:"Paper Bag Puppet Animals",       emoji:"🐸", bg:"bg-emerald-100", accent:"#059669", videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration:"7 min", ageMin:24, ageMax:84 },
];

const ORIGAMI: Origami[] = [
  { id:"og1",  title:"Learn to make a Paper Boat",         emoji:"⛵", bg:"bg-sky-100",     accent:"#0284C7", difficulty:"Easy",   steps:5,  ageMin:24, ageMax:96 },
  { id:"og2",  title:"Fold a Flying Paper Airplane",       emoji:"✈️", bg:"bg-blue-100",    accent:"#3B82F6", difficulty:"Easy",   steps:6,  ageMin:36, ageMax:96 },
  { id:"og3",  title:"Make a Jumping Paper Frog",          emoji:"🐸", bg:"bg-green-100",   accent:"#16A34A", difficulty:"Medium", steps:8,  ageMin:48, ageMax:96 },
  { id:"og4",  title:"Create a Paper Butterfly",           emoji:"🦋", bg:"bg-pink-100",    accent:"#DB2777", difficulty:"Easy",   steps:5,  ageMin:24, ageMax:96 },
  { id:"og5",  title:"Fold a Paper Tulip Flower",          emoji:"🌷", bg:"bg-rose-100",    accent:"#E11D48", difficulty:"Medium", steps:7,  ageMin:48, ageMax:96 },
  { id:"og6",  title:"Make a Paper Crane (Tsuru)",         emoji:"🦢", bg:"bg-purple-100",  accent:"#9333EA", difficulty:"Fun",    steps:12, ageMin:72, ageMax:96 },
  { id:"og7",  title:"Fold a Paper Bunny",                 emoji:"🐰", bg:"bg-amber-100",   accent:"#D97706", difficulty:"Easy",   steps:6,  ageMin:24, ageMax:84 },
  { id:"og8",  title:"Simple Paper Star",                  emoji:"⭐", bg:"bg-yellow-100",  accent:"#CA8A04", difficulty:"Easy",   steps:4,  ageMin:24, ageMax:96 },
  { id:"og9",  title:"Paper Heart for Mom",                emoji:"❤️", bg:"bg-red-100",     accent:"#DC2626", difficulty:"Easy",   steps:5,  ageMin:36, ageMax:96 },
  { id:"og10", title:"Fold a Sailboat Card",               emoji:"🏄", bg:"bg-teal-100",    accent:"#0F766E", difficulty:"Medium", steps:7,  ageMin:48, ageMax:96 },
  { id:"og11", title:"Make a Paper Peacock",               emoji:"🦚", bg:"bg-emerald-100", accent:"#059669", difficulty:"Fun",    steps:10, ageMin:60, ageMax:96 },
  { id:"og12", title:"Paper Pinwheel Spinner",             emoji:"🌀", bg:"bg-indigo-100",  accent:"#4F46E5", difficulty:"Easy",   steps:5,  ageMin:24, ageMax:84 },
  { id:"og13", title:"Fold a Cute Paper Fox",              emoji:"🦊", bg:"bg-orange-100",  accent:"#EA580C", difficulty:"Medium", steps:8,  ageMin:48, ageMax:96 },
  { id:"og14", title:"Origami Elephant",                   emoji:"🐘", bg:"bg-slate-100",   accent:"#475569", difficulty:"Fun",    steps:9,  ageMin:60, ageMax:96 },
  { id:"og15", title:"Paper Fortune Teller",               emoji:"🔮", bg:"bg-violet-100",  accent:"#7C3AED", difficulty:"Easy",   steps:6,  ageMin:36, ageMax:96 },
  { id:"og16", title:"Mini Paper Basket",                  emoji:"🧺", bg:"bg-lime-100",    accent:"#65A30D", difficulty:"Medium", steps:8,  ageMin:48, ageMax:96 },
];

// ─── Seeded shuffle ───────────────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0x7fffffff; };
}

function pickN<T extends { id: string }>(arr: T[], n: number, seed: number): T[] {
  const rng = seededRandom(seed);
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function dateSeed(childName: string): number {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
  let h = 0;
  for (const c of childName + dateStr) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function todayKey(childName: string) {
  const d = new Date();
  return `amynest_activity_${childName}_${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DailyKidsActivity({ childName, ageMonths }: { childName: string; ageMonths: number }) {
  // Only render for ages 24–95 months (2–7.9 years)
  if (ageMonths < 24 || ageMonths >= 96) return null;

  const seed = useMemo(() => dateSeed(childName), [childName]);
  const key  = useMemo(() => todayKey(childName), [childName]);

  const filtered = useMemo(() => ({
    worksheets: WORKSHEETS.filter(w => ageMonths >= w.ageMin && ageMonths <= w.ageMax),
    reels:      REELS.filter(r => ageMonths >= r.ageMin && ageMonths <= r.ageMax),
    origami:    ORIGAMI.filter(o => ageMonths >= o.ageMin && ageMonths <= o.ageMax),
  }), [ageMonths]);

  const daily = useMemo(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const p = JSON.parse(saved) as ActivityState;
        const ws = filtered.worksheets.filter(w => p.worksheetIds.includes(w.id));
        const rs = filtered.reels.filter(r => p.reelIds.includes(r.id));
        const og = filtered.origami.filter(o => p.origamiIds.includes(o.id));
        if (ws.length >= 3 && rs.length >= 3 && og.length >= 3) return { ws, rs, og };
      } catch { /* fallthrough */ }
    }
    const ws = pickN(filtered.worksheets, 4, seed);
    const rs = pickN(filtered.reels, 4, seed + 1);
    const og = pickN(filtered.origami, 4, seed + 2);
    localStorage.setItem(key, JSON.stringify({
      worksheetIds: ws.map(w => w.id),
      reelIds: rs.map(r => r.id),
      origamiIds: og.map(o => o.id),
      doneIds: [], savedIds: [],
    }));
    return { ws, rs, og };
  }, [filtered, key, seed]);

  const [done,  setDone]  = useState<Set<string>>(() => {
    try { const p = JSON.parse(localStorage.getItem(key) || "{}"); return new Set(p.doneIds ?? []); } catch { return new Set(); }
  });
  const [saved, setSaved] = useState<Set<string>>(() => {
    try { const p = JSON.parse(localStorage.getItem(key) || "{}"); return new Set(p.savedIds ?? []); } catch { return new Set(); }
  });

  const persist = (d: Set<string>, s: Set<string>) => {
    try {
      const p = JSON.parse(localStorage.getItem(key) || "{}") as ActivityState;
      localStorage.setItem(key, JSON.stringify({ ...p, doneIds: [...d], savedIds: [...s] }));
    } catch { /* ignore */ }
  };

  const toggleDone = (id: string) => {
    setDone(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      persist(next, saved);
      return next;
    });
  };
  const toggleSaved = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      persist(done, next);
      return next;
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Section Header ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 p-4 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-8 translate-x-8 blur-sm" />
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-widest text-white/80 mb-0.5">Today's Special</p>
          <h2 className="text-xl font-black">🎨 Today's Kids Activity</h2>
          <p className="text-sm text-white/90 mt-0.5">Personalised for {childName} · Daily rotation</p>
        </div>
      </div>

      {/* ── Parent Guidance ────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
        <span className="text-2xl">❤️</span>
        <p className="text-sm font-semibold text-amber-800">
          Spend 20–30 minutes doing this activity with your child
        </p>
      </div>

      {/* ── Worksheets ─────────────────────────────────────────── */}
      <SectionBlock emoji="📄" title="Printable Worksheets" subtitle="Download, print & practise">
        <div className="grid grid-cols-2 gap-3">
          {daily.ws.map(w => (
            <WorksheetCard key={w.id} item={w} done={done.has(w.id)} saved={saved.has(w.id)}
              onDone={() => toggleDone(w.id)} onSave={() => toggleSaved(w.id)} />
          ))}
        </div>
      </SectionBlock>

      {/* ── Art & Craft Reels ──────────────────────────────────── */}
      <SectionBlock emoji="🎥" title="Art & Craft Reels" subtitle="Watch · Create · Have fun">
        <div className="grid grid-cols-2 gap-3">
          {daily.rs.map(r => (
            <ReelCard key={r.id} item={r} done={done.has(r.id)} saved={saved.has(r.id)}
              onDone={() => toggleDone(r.id)} onSave={() => toggleSaved(r.id)} />
          ))}
        </div>
      </SectionBlock>

      {/* ── Origami ────────────────────────────────────────────── */}
      <SectionBlock emoji="🧩" title="Origami Activity" subtitle="Paper folding — zero mess, max fun!">
        <div className="grid grid-cols-2 gap-3">
          {daily.og.map(o => (
            <OrigamiCard key={o.id} item={o} done={done.has(o.id)} saved={saved.has(o.id)}
              onDone={() => toggleDone(o.id)} onSave={() => toggleSaved(o.id)} />
          ))}
        </div>
      </SectionBlock>

    </div>
  );
}

// ─── Section Block ─────────────────────────────────────────────────────────────
function SectionBlock({ emoji, title, subtitle, children }: {
  emoji: string; title: string; subtitle: string; children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <div>
          <p className="font-bold text-sm text-foreground leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// ─── Worksheet Card ───────────────────────────────────────────────────────────
function WorksheetCard({ item, done, saved, onDone, onSave }: {
  item: Worksheet; done: boolean; saved: boolean; onDone(): void; onSave(): void;
}) {
  return (
    <div className={`rounded-xl border overflow-hidden flex flex-col transition-all ${done ? "opacity-70" : ""}`}>
      {/* Preview area */}
      <div className={`relative ${item.bg} flex flex-col items-center justify-center p-3 h-28`}>
        {/* Done overlay */}
        {done && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-t-xl">
            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">✓</div>
          </div>
        )}
        <span className="text-3xl mb-1">{item.emoji}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-foreground">{item.subject}</span>
        {/* Save button */}
        <button onClick={onSave}
          className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full transition-all ${saved ? "bg-rose-500 text-white" : "bg-white/60 text-muted-foreground hover:bg-white"}`}
          title={saved ? "Unsave" : "Save for later"}
        >
          <span className="text-xs">{saved ? "♥" : "♡"}</span>
        </button>
      </div>
      {/* Info + actions */}
      <div className="p-2 flex-1 flex flex-col justify-between bg-card">
        <p className="text-xs font-bold text-foreground leading-snug mb-2">{item.title}</p>
        <div className="flex gap-1.5">
          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-[10px] font-bold py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
            ⬇ Download
          </a>
          <button onClick={onDone}
            className={`flex-1 text-[10px] font-bold py-1 rounded-lg transition-colors ${done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700"}`}>
            {done ? "✓ Done" : "Mark Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reel Card ────────────────────────────────────────────────────────────────
function ReelCard({ item, done, saved, onDone, onSave }: {
  item: Reel; done: boolean; saved: boolean; onDone(): void; onSave(): void;
}) {
  return (
    <div className={`rounded-xl border overflow-hidden flex flex-col transition-all ${done ? "opacity-70" : ""}`}>
      {/* Thumbnail area */}
      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer"
        className={`relative ${item.bg} flex flex-col items-center justify-center h-28 cursor-pointer group`}>
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
        <span className="text-3xl">{item.emoji}</span>
        <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-foreground">{item.duration}</span>
        {done && (
          <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">✓</div>
        )}
        <button onClick={(e) => { e.preventDefault(); onSave(); }}
          className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full transition-all ${saved ? "bg-rose-500 text-white" : "bg-white/60 text-muted-foreground hover:bg-white"}`}>
          <span className="text-xs">{saved ? "♥" : "♡"}</span>
        </button>
      </a>
      {/* Info */}
      <div className="p-2 flex-1 flex flex-col justify-between bg-card">
        <p className="text-xs font-bold text-foreground leading-snug mb-2">{item.title}</p>
        <button onClick={onDone}
          className={`w-full text-[10px] font-bold py-1 rounded-lg transition-colors ${done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700"}`}>
          {done ? "✓ Watched" : "Mark Done"}
        </button>
      </div>
    </div>
  );
}

// ─── Origami Card ─────────────────────────────────────────────────────────────
const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Fun:    "bg-purple-100 text-purple-700",
};

function OrigamiCard({ item, done, saved, onDone, onSave }: {
  item: Origami; done: boolean; saved: boolean; onDone(): void; onSave(): void;
}) {
  return (
    <div className={`rounded-xl border overflow-hidden flex flex-col transition-all ${done ? "opacity-70" : ""}`}>
      {/* Preview */}
      <div className={`relative ${item.bg} flex flex-col items-center justify-center h-28 p-2`}>
        {done && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-t-xl">
            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">✓</div>
          </div>
        )}
        <span className="text-3xl mb-1">{item.emoji}</span>
        {/* Steps indicator */}
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: Math.min(item.steps, 8) }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />
          ))}
          {item.steps > 8 && <span className="text-[8px] text-white/70 font-bold">+{item.steps - 8}</span>}
        </div>
        <span className="mt-1 text-[9px] text-white/80 font-semibold">{item.steps} steps</span>
        <button onClick={onSave}
          className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full transition-all ${saved ? "bg-rose-500 text-white" : "bg-white/60 text-muted-foreground hover:bg-white"}`}>
          <span className="text-xs">{saved ? "♥" : "♡"}</span>
        </button>
      </div>
      {/* Info */}
      <div className="p-2 flex-1 flex flex-col justify-between bg-card">
        <div className="mb-1.5">
          <p className="text-xs font-bold text-foreground leading-snug">{item.title}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[item.difficulty]}`}>
            {item.difficulty}
          </span>
        </div>
        <button onClick={onDone}
          className={`w-full text-[10px] font-bold py-1 rounded-lg transition-colors ${done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700"}`}>
          {done ? "✓ Done" : "Mark Done"}
        </button>
      </div>
    </div>
  );
}
