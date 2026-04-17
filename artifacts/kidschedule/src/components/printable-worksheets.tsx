import { useEffect, useRef, useState, useCallback } from "react";

type Category = "all" | "coloring" | "math" | "tracing" | "alphabet" | "numbers" | "general";

interface Worksheet {
  id: string;
  name: string;
  mimeType: string;
  category: string;
  downloadUrl: string;
  previewUrl: string;
}

const DAILY_LIMIT = 5;
const PAGE_SIZE = 12;

const STORAGE_KEYS = {
  downloaded: "ws_downloaded_ids",
  daily: "ws_daily",
} as const;

interface DailyRecord {
  date: string;
  count: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDownloadedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.downloaded);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveDownloadedId(id: string): void {
  const ids = getDownloadedIds();
  ids.add(id);
  localStorage.setItem(STORAGE_KEYS.downloaded, JSON.stringify([...ids]));
}

function getDailyCount(): DailyRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.daily);
    if (raw) {
      const rec: DailyRecord = JSON.parse(raw);
      if (rec.date === todayStr()) return rec;
    }
  } catch {}
  return { date: todayStr(), count: 0 };
}

function incrementDailyCount(): DailyRecord {
  const rec = getDailyCount();
  const next = { date: todayStr(), count: rec.count + 1 };
  localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify(next));
  return next;
}

const CATEGORIES: { key: Category; label: string; emoji: string; color: string; bg: string }[] = [
  { key: "all",      label: "All",      emoji: "📚", color: "#6366f1", bg: "#eef2ff" },
  { key: "coloring", label: "Coloring", emoji: "🎨", color: "#f97316", bg: "#fff7ed" },
  { key: "math",     label: "Math",     emoji: "🔢", color: "#2563eb", bg: "#eff6ff" },
  { key: "tracing",  label: "Tracing",  emoji: "✏️", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "alphabet", label: "Alphabet", emoji: "🔡", color: "#059669", bg: "#ecfdf5" },
  { key: "numbers",  label: "Numbers",  emoji: "🔟", color: "#0891b2", bg: "#ecfeff" },
  { key: "general",  label: "General",  emoji: "📄", color: "#78716c", bg: "#f5f5f4" },
];

function catInfo(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='16' fill='%23f0f4ff'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='36'%3E📄%3C/text%3E%3C/svg%3E";

export function PrintableWorksheets({ childAgeMonths }: { childAgeMonths?: number }) {
  const [all, setAll] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [dailyRec, setDailyRec] = useState<DailyRecord>({ date: todayStr(), count: 0 });
  const initRef = useRef(false);

  useEffect(() => {
    setDownloadedIds(getDownloadedIds());
    setDailyRec(getDailyCount());
  }, []);

  const loadWorksheets = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/worksheets")
      .then((r) => {
        if (!r.ok) return r.json().then((b: any) => { throw new Error(b.error || `HTTP ${r.status}`); });
        return r.json();
      })
      .then((data) => setAll(data.worksheets || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadWorksheets();
  }, [loadWorksheets]);

  const handleDownload = useCallback((ws: Worksheet) => {
    if (dailyRec.count >= DAILY_LIMIT) return;
    const link = document.createElement("a");
    link.href = ws.downloadUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = ws.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    saveDownloadedId(ws.id);
    const next = incrementDailyCount();
    setDownloadedIds(getDownloadedIds());
    setDailyRec(next);
  }, [dailyRec]);

  const isLimitReached = dailyRec.count >= DAILY_LIMIT;
  const remaining = Math.max(0, DAILY_LIMIT - dailyRec.count);

  const filtered = all
    .filter((w) => !downloadedIds.has(w.id))
    .filter((w) => category === "all" || w.category === category)
    .filter((w) => !query || w.name.toLowerCase().includes(query.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeCategory = (cat: Category) => { setCategory(cat); setPage(1); };
  const changeQuery = (val: string) => { setQuery(val); setPage(1); };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0" }}>
        <WsSpinner />
        <span style={{ fontSize: 14, color: "#888" }}>Loading worksheets…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 12 }}>⚠ {error}</p>
        <button
          style={btnStyle("#1e293b", "#fff")}
          onClick={() => { initRef.current = false; loadWorksheets(); }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ws-spin { to { transform: rotate(360deg); } }
        .ws-card:hover { border-color: #6366f1 !important; box-shadow: 0 4px 16px rgba(99,102,241,0.14) !important; }
        .ws-dl-btn:hover { opacity: 0.88 !important; }
      `}</style>

      {/* Daily limit banner */}
      <div style={{
        borderRadius: 12, padding: "10px 14px",
        background: isLimitReached ? "#fef2f2" : "#f0fdf4",
        border: `1.5px solid ${isLimitReached ? "#fca5a5" : "#86efac"}`,
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
      }}>
        <span style={{ fontSize: 20 }}>{isLimitReached ? "🚫" : "✅"}</span>
        <div>
          {isLimitReached ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: 0 }}>
                Daily limit reached
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                You've downloaded {DAILY_LIMIT} files today. Come back tomorrow!
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", margin: 0 }}>
                {remaining} download{remaining !== 1 ? "s" : ""} remaining today
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                {dailyRec.count > 0
                  ? `${dailyRec.count} of ${DAILY_LIMIT} used · Resets tomorrow`
                  : `Up to ${DAILY_LIMIT} free downloads per day`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{
          position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
          color: "#aaa", pointerEvents: "none", fontSize: 15,
        }}>🔍</span>
        <input
          type="text"
          placeholder="Search worksheets…"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10,
            border: "1.5px solid #e5e7eb", fontSize: 14,
            background: "var(--background, #fff)", color: "var(--foreground, #111)",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category filter */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
        scrollbarWidth: "none", marginBottom: 12,
      }}>
        {CATEGORIES.map((cat) => {
          const active = category === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => changeCategory(cat.key)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: "pointer", transition: "all 0.15s",
                border: active ? `1.5px solid ${cat.color}` : "1.5px solid #e5e7eb",
                background: active ? cat.bg : "var(--card, #fff)",
                color: active ? cat.color : "#6b7280",
              }}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Count info */}
      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 10px 0" }}>
        {filtered.length} worksheet{filtered.length !== 1 ? "s" : ""}
        {downloadedIds.size > 0 ? ` · ${downloadedIds.size} already downloaded` : ""}
      </p>

      {/* Empty states */}
      {all.filter((w) => !downloadedIds.has(w.id)).length === 0 && all.length > 0 ? (
        <EmptyState
          emoji="🎉"
          title="You've downloaded all worksheets!"
          subtitle="You've gone through the whole collection. Check back later for new ones."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🔎"
          title="No worksheets found"
          subtitle={query ? `No results for "${query}"` : `No worksheets in this category yet.`}
        />
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 10,
          }}>
            {paginated.map((ws) => (
              <WorksheetCard
                key={ws.id}
                worksheet={ws}
                isLimitReached={isLimitReached}
                onDownload={() => handleDownload(ws)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, marginTop: 16,
            }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                style={btnStyle(currentPage === 1 ? "#e5e7eb" : "#1e293b", currentPage === 1 ? "#9ca3af" : "#fff")}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: "#6b7280", minWidth: 60, textAlign: "center" }}>
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                style={btnStyle(currentPage === totalPages ? "#e5e7eb" : "#1e293b", currentPage === totalPages ? "#9ca3af" : "#fff")}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function WorksheetCard({
  worksheet,
  isLimitReached,
  onDownload,
}: {
  worksheet: Worksheet;
  isLimitReached: boolean;
  onDownload: () => void;
}) {
  const displayName = worksheet.name.replace(/\.[^.]+$/, "").replace(/_/g, " ");
  const [imgFailed, setImgFailed] = useState(false);
  const cat = catInfo(worksheet.category);
  const isPdf = worksheet.mimeType === "application/pdf";

  return (
    <div
      className="ws-card"
      style={{
        borderRadius: 14, border: "1.5px solid #e5e7eb",
        background: "var(--card, #fff)",
        display: "flex", flexDirection: "column",
        overflow: "hidden", transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Preview area */}
      <div style={{
        width: "100%", height: 110, overflow: "hidden",
        background: "#f8fafc", position: "relative", flexShrink: 0,
      }}>
        {!imgFailed ? (
          <img
            src={worksheet.previewUrl}
            alt={displayName}
            onError={() => setImgFailed(true)}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            background: cat.bg, flexDirection: "column", gap: 4,
          }}>
            <span style={{ fontSize: 32 }}>{isPdf ? "📕" : "🖼️"}</span>
            <span style={{ fontSize: 10, color: cat.color, fontWeight: 700 }}>
              {isPdf ? "PDF" : "IMAGE"}
            </span>
          </div>
        )}
        {/* Category badge */}
        <span style={{
          position: "absolute", top: 6, left: 6,
          background: cat.bg, color: cat.color,
          fontSize: 10, fontWeight: 700, padding: "2px 7px",
          borderRadius: 20, border: `1px solid ${cat.color}33`,
        }}>
          {cat.emoji} {cat.label}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "10px 10px 12px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <p style={{
          fontSize: 12, fontWeight: 600, lineHeight: 1.4,
          color: "var(--foreground, #111)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", margin: 0, flex: 1,
        }}>
          {displayName}
        </p>

        {/* Download button */}
        <button
          className="ws-dl-btn"
          disabled={isLimitReached}
          onClick={onDownload}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: isLimitReached ? "#94a3b8" : "#1e293b",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 10px", fontSize: 12, fontWeight: 700,
            cursor: isLimitReached ? "not-allowed" : "pointer",
            transition: "opacity 0.15s", width: "100%",
            opacity: isLimitReached ? 0.6 : 1,
          }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
          </svg>
          {isLimitReached ? "Limit reached" : "Download"}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div style={{
      textAlign: "center", padding: "32px 16px", display: "flex",
      flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize: 44 }}>{emoji}</span>
      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground, #111)", margin: 0 }}>{title}</p>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, maxWidth: 240, lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  );
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: "none", borderRadius: 8,
    padding: "7px 16px", fontSize: 12, fontWeight: 700,
    cursor: "pointer", transition: "opacity 0.15s",
  };
}

function WsSpinner() {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: "50%",
      border: "2.5px solid #e5e7eb", borderTopColor: "#1e293b",
      animation: "ws-spin 0.7s linear infinite",
    }}>
      <style>{`@keyframes ws-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
