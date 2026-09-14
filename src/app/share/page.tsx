"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, publicUrl, type VideoRow } from "@/lib/supabase";
import { wordmarkSvg } from "@/lib/brand";

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SharePage() {
  const [video, setVideo] = useState<VideoRow | null>(null);
  const [state, setState] = useState<"loading" | "notfound" | "ready">("loading");
  const [slideIdx, setSlideIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setState("notfound");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setState("notfound");
        return;
      }
      setVideo(data as VideoRow);
      setState("ready");
      document.title = `${data.title || "Video"} — Redo`;
    })();
  }, []);

  if (state === "loading") {
    return (
      <main className="share-page">
        <p className="share-msg">Loading…</p>
      </main>
    );
  }

  if (state === "notfound" || !video) {
    return (
      <main className="share-page">
        <div
          className="share-mark"
          dangerouslySetInnerHTML={{ __html: wordmarkSvg("#141414") }}
        />
        <p className="share-msg">This video isn’t available.</p>
      </main>
    );
  }

  const poster = video.poster_path ? publicUrl(video.poster_path) : undefined;
  const slides =
    video.slides && video.slides.length
      ? video.slides
      : [{ path: video.video_path, media_type: video.media_type }];
  const i = slideIdx % slides.length;
  const slide = slides[i];
  const slideSrc = publicUrl(slide.path);
  const transcript = video.transcript ?? [];

  function seek(t: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = t;
    el.play().catch(() => {});
  }

  return (
    <main className="share-page">
      <div
        className="share-mark"
        dangerouslySetInnerHTML={{ __html: wordmarkSvg("#141414") }}
      />

      <div className="share-card">
        <div className="drawer-media">
          {slide.media_type === "image" ? (
            <img src={slideSrc} alt="" />
          ) : (
            <video
              key={slide.path}
              ref={videoRef}
              src={slideSrc}
              poster={poster}
              controls
              playsInline
            />
          )}
          {slides.length > 1 && (
            <>
              <button
                className="carousel-arrow left"
                onClick={() => setSlideIdx((n) => (n - 1 + slides.length) % slides.length)}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="carousel-arrow right"
                onClick={() => setSlideIdx((n) => (n + 1) % slides.length)}
                aria-label="Next"
              >
                ›
              </button>
              <span className="carousel-count">
                {i + 1} / {slides.length}
              </span>
            </>
          )}
        </div>

        {transcript.length > 0 && (
          <div className="transcript" style={{ marginTop: 22 }}>
            <span className="fstage-label" style={{ display: "block", marginBottom: 8 }}>
              Transcript
            </span>
            {transcript.map((seg, idx) => (
              <button
                key={idx}
                className="tseg"
                onClick={() => seek(seg.start)}
                title="Jump to this moment"
              >
                <span className="tseg-time">{fmtTime(seg.start)}</span>
                <span className="tseg-text">{seg.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
