import { useEffect, useRef, useState, useCallback } from "react";
import "./style.css";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = BASE.replace(/^\/reels/, "");

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
  const url = `${API_BASE}/api/reels/videos?offset=${offset}&batch=5`;
  const res = await fetch(url);
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

function ReelItem({
  video,
  globalMuted,
  onToggleMute,
  isActive,
  onError: onVideoError,
}: {
  video: Video;
  globalMuted: boolean;
  onToggleMute: () => void;
  isActive: boolean;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showMuteHint, setShowMuteHint] = useState(false);
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
    setShowMuteHint(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowMuteHint(false), 1200);
  };

  const displayName = video.name.replace(/\.[^.]+$/, "").replace(/_/g, " ");

  return (
    <div className="reel" onClick={handleTap}>
      {!loaded && !error && (
        <div className="reel-loader">
          <div className="spinner" />
        </div>
      )}
      {error && (
        <div className="reel-error">
          <span className="error-icon">⚠</span>
          <p>Video unavailable</p>
          <small>{displayName}</small>
        </div>
      )}
      <video
        ref={videoRef}
        src={`${API_BASE}${video.streamUrl}`}
        muted={globalMuted}
        loop
        playsInline
        preload="metadata"
        onCanPlay={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
          if (onVideoError) {
            setTimeout(onVideoError, 800);
          }
        }}
        style={{ display: error ? "none" : "block" }}
      />
      {showMuteHint && (
        <div className="mute-hint">
          {globalMuted ? (
            <svg viewBox="0 0 24 24" fill="white" width="40" height="40">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              <path d="M19 12c0-1.77-.77-3.29-2-4.38v8.76A5.983 5.983 0 0019 12z"/>
              <line x1="1" y1="1" x2="23" y2="23" stroke="white" strokeWidth="2"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="white" width="40" height="40">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </div>
      )}
      <div className="reel-overlay">
        <div className="reel-info">
          <p className="reel-title">{displayName}</p>
        </div>
        <div className="reel-actions">
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); onToggleMute(); }}>
            {globalMuted ? (
              <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
                <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18l2.27 2.27L21 18.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
            <span>{globalMuted ? "Unmute" : "Mute"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const reelObserverRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);

  const loadMore = useCallback(async (currentOffset: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBatch(currentOffset);
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.id));
        const fresh = data.videos.filter((v) => !existingIds.has(v.id));
        return [...prev, ...fresh];
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
        if (entries[0]?.isIntersecting && !loadingRef.current && hasMore && initializedRef.current) {
          loadMore(offset);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(sentinel);
    observerRef.current = obs;
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

  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = reelObserverRef.current;
    if (!obs) return;
    reelRefs.current.forEach((el) => {
      if (el) obs.observe(el);
    });
    return () => {
      reelRefs.current.forEach((el) => {
        if (el) obs.unobserve(el);
      });
    };
  }, [videos.length]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const advanceFromError = useCallback((idx: number) => {
    const feed = feedRef.current;
    if (!feed) return;
    const reelEl = reelRefs.current[idx + 1];
    if (reelEl) {
      reelEl.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">▶ Reels</span>
        <button className="mute-toggle" onClick={toggleMute}>
          {muted ? "🔇" : "🔊"}
        </button>
      </header>

      <div className="feed" ref={feedRef}>
        {videos.map((video, i) => (
          <div
            key={video.id}
            data-index={i}
            ref={(el) => { reelRefs.current[i] = el; }}
            style={{ height: "100dvh", scrollSnapAlign: "start", flexShrink: 0 }}
          >
            <ReelItem
              video={video}
              globalMuted={muted}
              onToggleMute={toggleMute}
              isActive={i === activeIndex}
              onError={() => advanceFromError(i)}
            />
          </div>
        ))}

        {loading && (
          <div className="loading-indicator">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="error-banner">
            <p>⚠ {error}</p>
            <button onClick={() => loadMore(offset)}>Retry</button>
          </div>
        )}

        {!loading && !hasMore && videos.length > 0 && (
          <div className="end-banner">
            <p>You've seen all {videos.length} videos!</p>
            <button onClick={() => { setVideos([]); setOffset(0); setHasMore(true); loadMore(0); }}>
              Watch again
            </button>
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>

      {videos.length === 0 && !loading && error && (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h2>Couldn't load videos</h2>
          <p>{error}</p>
          <button onClick={() => loadMore(0)}>Try again</button>
        </div>
      )}
    </div>
  );
}
