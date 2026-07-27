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
      title={video.title}
    >
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
