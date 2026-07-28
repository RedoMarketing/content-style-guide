"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, BUCKET, publicUrl, type VideoRow } from "@/lib/supabase";
import {
  STAGE_ORDER,
  STAGES,
  FORMATS,
  MEDIA,
  KINDS,
  type Stage,
  type Kind,
  type Media,
} from "@/lib/stages";
import VideoCard from "./VideoCard";
import FilterDropdown from "./FilterDropdown";
import { CloseIcon } from "./icons";

export default function Board({
  videos,
  onRefresh,
}: {
  videos: VideoRow[];
  onRefresh: () => void;
}) {
  const [kind, setKind] = useState<Kind>("inspiration");
  const [stage, setStage] = useState<Stage | null>(null);
  const [fmt, setFmt] = useState<string | null>(null);
  const [media, setMedia] = useState<Media | null>(null);
  const [active, setActive] = useState<VideoRow | null>(null);

  const kindCounts = useMemo(() => {
    const pool = videos.filter(
      (v) =>
        (!stage || v.stage === stage) &&
        (!fmt || v.format === fmt) &&
        (!media || v.media_type === media)
    );
    return {
      inspiration: pool.filter((v) => v.kind === "inspiration").length,
      actual: pool.filter((v) => v.kind === "actual").length,
    } as Record<Kind, number>;
  }, [videos, stage, fmt, media]);

  const shown = useMemo(
    () =>
      videos.filter(
        (v) =>
          v.kind === kind &&
          (!stage || v.stage === stage) &&
          (!fmt || v.format === fmt) &&
          (!media || v.media_type === media)
      ),
    [videos, kind, stage, fmt, media]
  );

  // Pinterest-style chunked loading: render a batch, load more on scroll.
  const PAGE = 24;
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => {
    setLimit(PAGE);
  }, [kind, stage, fmt, media]);
  const visible = shown.slice(0, limit);
  const hasMore = visible.length < shown.length;
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setLimit((l) => l + PAGE);
      },
      { rootMargin: "800px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, limit]);

  async function handleDelete(v: VideoRow) {
    const paths = [v.video_path, v.poster_path].filter(Boolean) as string[];
    await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from("videos").delete().eq("id", v.id);
    setActive(null);
    onRefresh();
  }

  return (
    <section className="shell board" id="board">
      <div className="kind-toggle" role="tablist" aria-label="Inspiration or actuals">
        {KINDS.map((k) => (
          <button
            key={k.id}
            role="tab"
            aria-selected={kind === k.id}
            data-on={kind === k.id}
            onClick={() => setKind(k.id)}
          >
            {k.label}
            <span className="kt-count">{kindCounts[k.id]}</span>
          </button>
        ))}
      </div>

      <div className="fbar">
        <div className="fbar-filters">
          <FilterDropdown
            label="Funnel stage"
            value={stage}
            options={STAGE_ORDER.map((s) => ({ id: s, label: STAGES[s].label }))}
            onChange={(v) => setStage(v as Stage | null)}
          />
          <FilterDropdown
            label="Style"
            value={fmt}
            options={FORMATS.map((f) => ({ id: f.id, label: f.label }))}
            onChange={setFmt}
          />
          <FilterDropdown
            label="Media"
            value={media}
            options={MEDIA.map((m) => ({ id: m.id, label: m.label }))}
            onChange={(v) => setMedia(v as Media | null)}
          />
        </div>
      </div>

      {stage && <StageNote stage={stage} />}

      {visible.length > 0 && (
        <div className="masonry">
          {visible.map((v) => (
            <VideoCard key={v.id} video={v} onOpen={setActive} />
          ))}
        </div>
      )}
      {hasMore && <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />}

      {active && (
        <DetailPanel
          video={active}
          onClose={() => setActive(null)}
          onDelete={handleDelete}
          onSaved={onRefresh}
        />
      )}
    </section>
  );
}

function StageNote({ stage }: { stage: Stage }) {
  const s = STAGES[stage];
  return (
    <p className="stage-hint">
      <strong>{s.level}:</strong> {s.tagline}
    </p>
  );
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function DetailPanel({
  video,
  onClose,
  onDelete,
  onSaved,
}: {
  video: VideoRow;
  onClose: () => void;
  onDelete: (v: VideoRow) => Promise<void>;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<Kind>(video.kind as Kind);
  const [stage, setStage] = useState<Stage | null>(video.stage);
  const [format, setFormat] = useState<string | null>(video.format);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const transcript = video.transcript ?? [];
  const hasTranscript = transcript.length > 0;
  const [tab, setTab] = useState<"details" | "transcript">("details");

  const [slideIdx, setSlideIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const poster = video.poster_path ? publicUrl(video.poster_path) : undefined;
  const slides =
    video.slides && video.slides.length
      ? video.slides
      : [{ path: video.video_path, media_type: video.media_type }];
  const i = slideIdx % slides.length;
  const slide = slides[i];
  const slideSrc = publicUrl(slide.path);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  async function patch(fields: Partial<VideoRow>) {
    const { error } = await supabase.from("videos").update(fields).eq("id", video.id);
    if (!error) {
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 1400);
      onSaved();
    }
  }

  function seek(t: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = t;
    el.play().catch(() => {});
  }

  async function copyTranscript() {
    const text = transcript.map((s) => s.text).join(" ");
    try {
      await navigator.clipboard.writeText(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="drawer-scrim"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={video.title}>
        <div className="drawer-head">
          <span className="drawer-eyebrow">
            {saved ? "Saved" : "Details"}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="drawer-media">
          {slide.media_type === "image" ? (
            <img src={slideSrc} alt={video.title} />
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

        {hasTranscript && (
          <div className="drawer-tabs">
            <button data-on={tab === "details"} onClick={() => setTab("details")}>
              Details
            </button>
            <button data-on={tab === "transcript"} onClick={() => setTab("transcript")}>
              Transcript
            </button>
          </div>
        )}

        {tab === "transcript" && hasTranscript ? (
          <div className="transcript">
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
            <button className="btn btn-ghost btn-sm tseg-copy" onClick={copyTranscript}>
              Copy transcript
            </button>
          </div>
        ) : (
          <>
            <div className="field">
              <label>Collection</label>
              <div className="seg">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    data-on={kind === k.id}
                    onClick={() => {
                      setKind(k.id);
                      patch({ kind: k.id });
                    }}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Funnel stage</label>
              <div className="seg">
                <button
                  type="button"
                  data-on={stage === null}
                  onClick={() => {
                    setStage(null);
                    patch({ stage: null });
                  }}
                >
                  Unassigned
                </button>
                {STAGE_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    data-on={stage === s}
                    onClick={() => {
                      setStage(s);
                      patch({ stage: s });
                    }}
                  >
                    {STAGES[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Style</label>
              <div className="seg">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    data-on={format === f.id}
                    onClick={() => {
                      const next = format === f.id ? null : f.id;
                      setFormat(next);
                      patch({ format: next });
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="drawer-actions">
              {confirming ? (
                <>
                  <span className="drawer-confirm">Delete permanently?</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={async () => {
                      setDeleting(true);
                      await onDelete(video);
                    }}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => setConfirming(true)}
                >
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
