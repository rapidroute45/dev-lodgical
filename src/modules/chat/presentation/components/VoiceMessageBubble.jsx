import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/shared/utils/mediaUrl.js";

function formatDuration(ms) {
  if (!ms || Number.isNaN(ms)) return "0:00";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VoiceMessageBubble({ audioUrl, durationMs, mine }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    const onTime = () => {
      if (el.duration) setProgress(el.currentTime / el.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };

  const accent = mine ? "var(--accent)" : "var(--text)";

  return (
    <div className="flex items-center gap-3" style={{ minWidth: 180 }}>
      <audio ref={audioRef} src={mediaUrl(audioUrl) ?? ""} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(34,211,238,0.18)", color: accent }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 5h3v10H6zM11 5h3v10h-3z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 4l10 6-10 6z" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(progress * 100)}%`, background: accent }}
          />
        </div>
        <p className="mt-1 text-[11px]" style={{ color: "var(--text-dim)" }}>
          {formatDuration(durationMs)}
        </p>
      </div>
    </div>
  );
}
