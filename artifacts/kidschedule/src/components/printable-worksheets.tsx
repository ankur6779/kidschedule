import { useEffect, useRef, useState } from "react";

interface Worksheet {
  name: string;
  mimeType: string;
  downloadUrl: string;
  fileId: string;
}

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="9" y1="13" x2="15" y2="13" strokeLinecap="round" />
        <line x1="9" y1="17" x2="13" y2="17" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function typeBadge(mimeType: string) {
  if (mimeType === "application/pdf") {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, color: "#dc2626",
        background: "#fee2e2", borderRadius: 4, padding: "2px 6px", letterSpacing: 0.5,
      }}>PDF</span>
    );
  }
  if (mimeType === "image/png") {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, color: "#2563eb",
        background: "#dbeafe", borderRadius: 4, padding: "2px 6px", letterSpacing: 0.5,
      }}>PNG</span>
    );
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: "#16a34a",
      background: "#dcfce7", borderRadius: 4, padding: "2px 6px", letterSpacing: 0.5,
    }}>JPG</span>
  );
}

const PAGE_SIZE = 20;

export function PrintableWorksheets() {
  const [all, setAll] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    fetch("/api/worksheets")
      .then((r) => {
        if (!r.ok) return r.json().then((b) => { throw new Error(b.error || `HTTP ${r.status}`); });
        return r.json();
      })
      .then((data) => setAll(data.worksheets || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = all.filter((w) =>
    w.name.toLowerCase().includes(query.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (val: string) => { setQuery(val); setPage(1); };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0" }}>
        <Spinner />
        <span style={{ fontSize: 14, color: "var(--muted-foreground, #888)" }}>
          Loading worksheets…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "16px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#dc2626" }}>⚠ {error}</p>
        <button
          style={{
            marginTop: 10, background: "var(--primary, #6366f1)", color: "#fff",
            border: "none", borderRadius: 20, padding: "7px 20px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
          onClick={() => { initRef.current = false; setLoading(true); setError(null); }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Search */}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
          color: "var(--muted-foreground, #999)", pointerEvents: "none", fontSize: 15,
        }}>🔍</span>
        <input
          type="text"
          placeholder="Search worksheets…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px 9px 34px",
            borderRadius: 10, border: "1.5px solid var(--border, #e5e7eb)",
            fontSize: 14, background: "var(--background, #fff)",
            color: "var(--foreground, #111)", outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Count */}
      <p style={{ fontSize: 12, color: "var(--muted-foreground, #888)", margin: 0 }}>
        {filtered.length === all.length
          ? `${all.length} worksheets`
          : `${filtered.length} of ${all.length} worksheets`}
      </p>

      {/* Grid */}
      {paginated.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--muted-foreground, #888)", textAlign: "center", padding: "24px 0" }}>
          No worksheets found{query ? ` for "${query}"` : ""}.
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 10,
        }}>
          {paginated.map((w) => (
            <WorksheetCard key={w.fileId} worksheet={w} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
          <PagBtn disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>← Prev</PagBtn>
          <span style={{ fontSize: 13, color: "var(--muted-foreground, #666)" }}>
            {currentPage} / {totalPages}
          </span>
          <PagBtn disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next →</PagBtn>
        </div>
      )}
    </div>
  );
}

function WorksheetCard({ worksheet }: { worksheet: Worksheet }) {
  const displayName = worksheet.name.replace(/\.[^.]+$/, "");
  const isPdf = worksheet.mimeType === "application/pdf";

  return (
    <div style={{
      borderRadius: 12,
      border: "1.5px solid var(--border, #e5e7eb)",
      background: "var(--card, #fff)",
      padding: "12px 10px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "border-color 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary, #6366f1)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(99,102,241,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border, #e5e7eb)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Icon row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: isPdf ? "#dc2626" : "#2563eb", opacity: 0.85 }}>
          {fileIcon(worksheet.mimeType)}
        </span>
        {typeBadge(worksheet.mimeType)}
      </div>

      {/* Name */}
      <p style={{
        fontSize: 12, fontWeight: 600, lineHeight: 1.35,
        color: "var(--foreground, #111)",
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        overflow: "hidden", flex: 1, margin: 0,
      }}>
        {displayName}
      </p>

      {/* Download button */}
      <a
        href={worksheet.downloadUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          background: "var(--primary, #6366f1)", color: "#fff",
          borderRadius: 8, padding: "7px 10px",
          fontSize: 12, fontWeight: 700, textDecoration: "none",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
        </svg>
        Download
      </a>
    </div>
  );
}

function PagBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled ? "var(--muted, #f3f4f6)" : "var(--primary, #6366f1)",
        color: disabled ? "var(--muted-foreground, #9ca3af)" : "#fff",
        border: "none", borderRadius: 8, padding: "6px 14px",
        fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: "50%",
      border: "2.5px solid var(--border, #e5e7eb)",
      borderTopColor: "var(--primary, #6366f1)",
      animation: "ws-spin 0.7s linear infinite",
    }}>
      <style>{`@keyframes ws-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
