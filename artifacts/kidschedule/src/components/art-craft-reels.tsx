import { useEffect, useRef, useState, useCallback } from "react";

interface Video {
  id: string;
  name: string;
  mimeType: string;
  streamUrl: string;
}

interface ApiResponse {
  videos: Video[];
  total: number;
  offset: number;
  nextOffset: number | null;
}

async function fetchBatch(offset: number): Promise<ApiResponse> {
  const res = await fetch(`/api/reels/videos?offset=${offset}&batch=6`);
  if (!res.ok) {
    try {
      const body = await res.json();
      throw new Error(body.error || `HTTP ${res.status}`);
    } catch {
      throw new Error(`HTTP ${res.status}`);
    }
  }
  return res.json();
}

function ReelCard({
  video,
  globalMuted,
  onToggleMute,
  isActive,
  onError,
}: {
  video: Video;
  globalMuted: boolean;
  onToggleMute: () => void;
  isActive: boolean;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.muted = globalMuted;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isActive, globalMuted]);

  const handleTap = () => {
    onToggleMute();
    setShowHint(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHint(false), 1200);
  };

  const displayName = video.name.replace(/\.[^.]+$/, "").replace(/_/g, " ");

  return (
    <div
      onClick={handleTap}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#111",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        scrollSnapAlign: "start",
        flexShrink: 0,
      }}
    >
      {!loaded && !hasError && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center", background: "#111", zIndex: 2,
        }}>
          <AcSpinner />
        </div>
      )}
      {hasError && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#111", gap: 8, zIndex: 2,
        }}>
          <span style={{ fontSize: 36, opacity: 0.45 }}>⚠</span>
          <p style={{ color: "#fff", opacity: 0.6, fontSize: 14 }}>Video unavailable</p>
          <small style={{ color: "#fff", opacity: 0.35, fontSize: 12, textAlign: "center", maxWidth: 200 }}>{displayName}</small>
        </div>
      )}
      <video
        ref={videoRef}
        src={video.streamUrl}
        muted={globalMuted}
        loop
        playsInline
        preload="metadata"
        onCanPlay={() => setLoaded(true)}
        onError={() => {
          setHasError(true);
          setLoaded(true);
          if (onError) setTimeout(onError, 800);
        }}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", display: hasError ? "none" : "block",
        }}
      />
      {showHint && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 20,
          animation: "ac-hint-fade 1.2s ease forwards",
        }}>
          <div style={{
            background: "rgba(0,0,0,0.45)", borderRadius: "50%",
            padding: 16, width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {globalMuted ? (
              <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18l2.27 2.27L21 18.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </div>
        </div>
      )}
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "flex-end", justifyContent: "space-between",
        padding: "16px 14px",
        background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent 80%)",
        pointerEvents: "none", zIndex: 10,
      }}>
        <p style={{
          color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.4,
          textShadow: "0 1px 6px rgba(0,0,0,0.8)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", flex: 1, paddingRight: 10,
        }}>
          {displayName}
        </p>
        <button
          style={{
            pointerEvents: "auto", background: "none", border: "none",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, color: "#fff", padding: "4px 6px",
          }}
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
        >
          {globalMuted ? (
            <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
              <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18l2.27 2.27L21 18.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
          <span style={{ fontSize: 10, fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
            {globalMuted ? "Unmute" : "Mute"}
          </span>
        </button>
      </div>
    </div>
  );
}

function AcSpinner() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      border: "3px solid rgba(255,255,255,0.15)",
      borderTopColor: "#fff",
      animation: "ac-spin 0.7s linear infinite",
    }} />
  );
}

export function ArtCraftReels() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const feedRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reelObserverRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async (currentOffset: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBatch(currentOffset);
      setVideos((prev) => {
        const existing = new Set(prev.map((v) => v.id));
        return [...prev, ...data.videos.filter((v) => !existing.has(v.id))];
      });
      setHasMore(data.nextOffset !== null);
      setOffset(data.nextOffset ?? currentOffset);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadMore(0);
  }, [loadMore]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingRef.current && hasMore) {
          loadMore(offset);
        }
      },
      { root: feedRef.current, threshold: 0.1 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [hasMore, offset, loadMore]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt((entry.target as HTMLElement).dataset["index"] || "0", 10);
            setActiveIndex(idx);
          }
        });
      },
      { root: feed, threshold: 0.6 }
    );
    reelObserverRef.current = obs;
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const obs = reelObserverRef.current;
    if (!obs) return;
    reelRefs.current.forEach((el) => { if (el) obs.observe(el); });
    return () => { reelRefs.current.forEach((el) => { if (el) obs.unobserve(el); }); };
  }, [videos.length]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const advanceFromError = useCallback((idx: number) => {
    const next = reelRefs.current[idx + 1];
    if (next) next.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <style>{`
        @keyframes ac-spin { to { transform: rotate(360deg); } }
        @keyframes ac-hint-fade {
          0%   { opacity: 0; transform: scale(0.8); }
          20%  { opacity: 1; transform: scale(1); }
          70%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
      `}</style>

      <div style={{
        borderRadius: 16, overflow: "hidden", position: "relative",
        background: "#000", height: "82vh", maxHeight: 680,
      }}>
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
        }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: -0.5 }}>
            🎨 Art & Craft Videos
          </span>
          <button
            style={{
              pointerEvents: "auto", background: "rgba(255,255,255,0.15)",
              border: "none", borderRadius: "50%", width: 34, height: 34,
              fontSize: 16, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)", color: "#fff",
            }}
            onClick={toggleMute}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Feed */}
        <div
          ref={feedRef}
          style={{
            height: "100%", overflowY: "scroll", overflowX: "hidden",
            scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {videos.map((video, i) => (
            <div
              key={video.id}
              data-index={i}
              ref={(el) => { reelRefs.current[i] = el; }}
              style={{ height: "100%", flexShrink: 0 }}
            >
              <ReelCard
                video={video}
                globalMuted={muted}
                onToggleMute={toggleMute}
                isActive={i === activeIndex}
                onError={() => advanceFromError(i)}
              />
            </div>
          ))}

          {loading && (
            <div style={{
              height: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", scrollSnapAlign: "start", flexShrink: 0,
            }}>
              <AcSpinner />
            </div>
          )}

          {error && (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              scrollSnapAlign: "start", flexShrink: 0, padding: 24, textAlign: "center",
            }}>
              <p style={{ color: "#fff", opacity: 0.6, fontSize: 14 }}>⚠ {error}</p>
              <button
                style={{
                  background: "#fff", color: "#000", border: "none",
                  borderRadius: 24, padding: "8px 24px", fontSize: 14,
                  fontWeight: 600, cursor: "pointer",
                }}
                onClick={() => loadMore(offset)}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !hasMore && videos.length > 0 && (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16,
              scrollSnapAlign: "start", flexShrink: 0, padding: 24, textAlign: "center",
            }}>
              <p style={{ color: "#fff", opacity: 0.6, fontSize: 14 }}>
                You've watched all {videos.length} videos! 🎉
              </p>
              <button
                style={{
                  background: "#fff", color: "#000", border: "none",
                  borderRadius: 24, padding: "8px 24px", fontSize: 14,
                  fontWeight: 600, cursor: "pointer",
                }}
                onClick={() => { setVideos([]); setOffset(0); setHasMore(true); initializedRef.current = false; loadMore(0); }}
              >
                Watch again
              </button>
            </div>
          )}

          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>

        {videos.length === 0 && !loading && error && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 14,
            textAlign: "center", padding: 32, background: "#111", zIndex: 100,
          }}>
            <span style={{ fontSize: 48 }}>🎬</span>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Couldn't load videos</p>
            <p style={{ color: "#fff", opacity: 0.5, fontSize: 13, maxWidth: 220 }}>{error}</p>
            <button
              style={{
                background: "#fff", color: "#000", border: "none",
                borderRadius: 24, padding: "8px 24px", fontSize: 14,
                fontWeight: 600, cursor: "pointer",
              }}
              onClick={() => { initializedRef.current = false; loadMore(0); }}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p style={{
        fontSize: 12, color: "var(--muted-foreground, #888)",
        textAlign: "center", marginTop: 8,
      }}>
        Swipe up for next video · Tap to mute/unmute
      </p>
    </>
  );
}
