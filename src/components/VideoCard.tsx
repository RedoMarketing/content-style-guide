"use client";

import { useRef } from "react";
import { publicUrl, type VideoRow } from "@/lib/supabase";
import { PlayIcon } from "./icons";

export default function VideoCard({
  video,
  onOpen,
}: {
  video: VideoRow;
  onOpen: (v: VideoRow) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const src = publicUrl(video.video_path);
  const poster = video.poster_path ? publicUrl(video.poster_path) : undefined;
  const isImage = video.media_type === "image";
  const slideCount = video.slides?.length ?? 0;

  function hoverPlay() {
    const el = ref.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  }
  function hoverStop() {
    ref.current?.pause();
  }

  return (
    <div
      className="tile"
      onMouseEnter={isImage ? undefined : hoverPlay}
      onMouseLeave={isImage ? undefined : hoverStop}
      onClick={() => onOpen(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(video);
        }
      }}
      aria-label={`Open ${video.title}`}
    >
      {slideCount > 1 && (
        <span className="tile-stack" aria-hidden>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="7" y="3" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <path d="M3 7v12a2 2 0 0 0 2 2h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {slideCount}
        </span>
      )}
      {isImage ? (
        <img src={src} alt={video.title} />
      ) : (
        <>
          <video
            ref={ref}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
          />
          <span className="tile-play" aria-hidden>
            <span>
              <PlayIcon size={18} />
            </span>
          </span>
        </>
      )}
    </div>
  );
}
