"use client";

import { useMemo, useState } from "react";
import { supabase, BUCKET, publicUrl, type VideoRow } from "@/lib/supabase";
import {
  STAGE_ORDER,
  STAGES,
  FORMATS,
  MEDIA,
  KINDS,
  formatLabel,
  type Stage,
  type Kind,
  type Media,
} from "@/lib/stages";
import VideoCard from "./VideoCard";
import FilterDropdown from "./FilterDropdown";
import { CloseIcon, UploadIcon } from "./icons";

export default function Board({
  videos,
  onUpload,
  onRefresh,
}: {
  videos: VideoRow[];
  onUpload: () => void;
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

        <button
          className="icon-round"
          onClick={onUpload}
          aria-label="Upload"
          title="Upload"
        >
          <UploadIcon size={20} />
        </button>
      </div>

      {stage && <StageNote stage={stage} />}

      {shown.length > 0 && (
        <div className="masonry">
          {shown.map((v) => (
            <VideoCard key={v.id} video={v} onOpen={setActive} />
          ))}
        </div>
      )}

      {active && (
        <DetailPanel
          video={active}
          onClose={() => setActive(null)}
          onDelete={handleDelete}
          onSaved={() => {
            setActive(null);
            onRefresh();
          }}
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
  const [title, setTitle] = useState(video.title);
  const [kind, setKind] = useState<Kind>(video.kind as Kind);
  const [stage, setStage] = useState<Stage | null>(video.stage);
  const [format, setFormat] = useState<string | null>(video.format);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [slideIdx, setSlideIdx] = useState(0);
  const poster = video.poster_path ? publicUrl(video.poster_path) : undefined;
  const slides =
    video.slides && video.slides.length
      ? video.slides
      : [{ path: video.video_path, media_type: video.media_type }];
  const i = slideIdx % slides.length;
  const slide = slides[i];
  const slideSrc = publicUrl(slide.path);

  const dirty =
    title.trim() !== video.title ||
    kind !== video.kind ||
    stage !== video.stage ||
    format !== video.format;

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("videos")
      .update({
        title: title.trim() || video.title,
        kind,
        stage,
        format,
      })
      .eq("id", video.id);
    setSaving(false);
    if (!error) onSaved();
  }

  return (
    <div
      className="drawer-scrim"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={video.title}>
        <div className="drawer-head">
          <span className="drawer-eyebrow">Edit details</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="drawer-media">
          {slide.media_type === "image" ? (
            <img src={slideSrc} alt={video.title} />
          ) : (
            <video key={slide.path} src={slideSrc} poster={poster} controls playsInline />
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

        <div className="field" style={{ marginTop: 18 }}>
          <label htmlFor="d-title">Title</label>
          <input
            id="d-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Collection</label>
          <div className="seg">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                data-on={kind === k.id}
                onClick={() => setKind(k.id)}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Funnel stage</label>
          <div className="seg">
            <button type="button" data-on={stage === null} onClick={() => setStage(null)}>
              Unassigned
            </button>
            {STAGE_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                data-on={stage === s}
                onClick={() => setStage(s)}
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
                onClick={() => setFormat(format === f.id ? null : f.id)}
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
            <>
              <button
                className="btn btn-danger-ghost btn-sm"
                onClick={() => setConfirming(true)}
              >
                Delete
              </button>
              <span style={{ flex: 1 }} />
              <button
                className="btn btn-dark btn-sm"
                onClick={save}
                disabled={!dirty || saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
