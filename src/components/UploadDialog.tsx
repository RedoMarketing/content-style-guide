"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, BUCKET } from "@/lib/supabase";
import {
  STAGE_ORDER,
  STAGES,
  FORMATS,
  KINDS,
  type Stage,
  type Kind,
  type Media,
} from "@/lib/stages";
import { CloseIcon } from "./icons";

interface Analyzed {
  poster: Blob | null;
  width: number;
  height: number;
  duration: number;
  previewUrl: string;
}

function analyze(file: File): Promise<Analyzed> {
  const previewUrl = URL.createObjectURL(file);

  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () =>
        resolve({
          poster: null,
          width: img.naturalWidth,
          height: img.naturalHeight,
          duration: 0,
          previewUrl,
        });
      img.onerror = () =>
        resolve({ poster: null, width: 0, height: 0, duration: 0, previewUrl });
      img.src = previewUrl;
    });
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = previewUrl;
    const bail = () =>
      resolve({ poster: null, width: 0, height: 0, duration: 0, previewUrl });
    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = video.duration;
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve({ poster: null, width, height, duration, previewUrl });
          ctx.drawImage(video, 0, 0, width, height);
          canvas.toBlob(
            (blob) => resolve({ poster: blob, width, height, duration, previewUrl }),
            "image/jpeg",
            0.82
          );
        } catch {
          resolve({ poster: null, width, height, duration, previewUrl });
        }
      };
      video.currentTime = Math.min(0.5, (duration || 1) * 0.1);
    };
    video.onerror = bail;
  });
}

const MAX_MB = 100;

interface Slide {
  file: File;
  meta: Analyzed;
  mediaType: Media;
}

export default function UploadDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Kind>("actual");
  const [stage, setStage] = useState<Stage>("awareness");
  const [format, setFormat] = useState<string>("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      slides.forEach((s) => URL.revokeObjectURL(s.meta.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function addFiles(list: FileList | null) {
    setError("");
    if (!list || !list.length) return;
    const incoming: Slide[] = [];
    for (const f of Array.from(list)) {
      const isImage = f.type.startsWith("image/");
      if (!f.type.startsWith("video/") && !isImage) {
        setError("Only video or image files.");
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" is over ${MAX_MB}MB.`);
        continue;
      }
      setStatus("Reading…");
      const meta = await analyze(f);
      incoming.push({ file: f, meta, mediaType: isImage ? "image" : "video" });
    }
    setStatus("");
    if (!incoming.length) return;
    setSlides((prev) => [...prev, ...incoming]);
    if (!title) {
      const n = incoming[0].file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      setTitle(n);
    }
  }

  function removeSlide(idx: number) {
    setSlides((prev) => {
      const s = prev[idx];
      if (s) URL.revokeObjectURL(s.meta.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function submit() {
    if (!slides.length) return setError("Add at least one file.");
    if (!title.trim()) return setError("Give it a title.");
    setBusy(true);
    setError("");
    try {
      const uploaded: { path: string; media_type: Media }[] = [];
      let posterPath: string | null = null;

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        setStatus(`Uploading ${i + 1} / ${slides.length}…`);
        setPct(Math.round(((i + 0.5) / slides.length) * 90));
        const id = crypto.randomUUID();
        const ext = (s.file.name.split(".").pop() || (s.mediaType === "video" ? "mp4" : "jpg")).toLowerCase();
        const path = `clips/${id}.${ext}`;
        const up = await supabase.storage
          .from(BUCKET)
          .upload(path, s.file, { contentType: s.file.type });
        if (up.error) throw up.error;
        uploaded.push({ path, media_type: s.mediaType });

        // Poster from the first slide if it's a video.
        if (i === 0 && s.meta.poster) {
          const pPath = `posters/${id}.jpg`;
          const pp = await supabase.storage
            .from(BUCKET)
            .upload(pPath, s.meta.poster, { contentType: "image/jpeg" });
          if (!pp.error) posterPath = pPath;
        }
      }

      setStatus("Saving…");
      setPct(95);
      const cover = slides[0];
      const ins = await supabase.from("videos").insert({
        title: title.trim(),
        kind,
        media_type: cover.mediaType,
        stage,
        format: format || null,
        video_path: uploaded[0].path,
        poster_path: posterPath,
        width: cover.meta.width || null,
        height: cover.meta.height || null,
        duration: cover.meta.duration || null,
        slides: uploaded.length > 1 ? uploaded : null,
      });
      if (ins.error) throw ins.error;

      setPct(100);
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setBusy(false);
      setStatus("");
      setPct(0);
    }
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Add media">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <h2>Add media</h2>
          <button className="icon-btn" onClick={() => !busy && onClose()} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="field">
          {slides.length === 0 ? (
            <div
              className="dropzone"
              data-drag={drag}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
            >
              <strong>Drop files</strong> or click to browse
              <span className="dz-hint">Multiple files become a carousel</span>
            </div>
          ) : (
            <div className="slide-strip">
              {slides.map((s, i) => (
                <div className="slide-thumb" key={s.meta.previewUrl}>
                  {s.mediaType === "image" ? (
                    <img src={s.meta.previewUrl} alt="" />
                  ) : (
                    <video src={s.meta.previewUrl} muted playsInline />
                  )}
                  {!busy && (
                    <button
                      className="slide-remove"
                      onClick={() => removeSlide(i)}
                      aria-label="Remove"
                    >
                      <CloseIcon size={12} />
                    </button>
                  )}
                  <span className="slide-num">{i + 1}</span>
                </div>
              ))}
              {!busy && (
                <button
                  className="slide-add"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Add more"
                >
                  +
                </button>
              )}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/*,image/*"
            multiple
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        <div className="field">
          <label>Collection</label>
          <div className="seg">
            {KINDS.map((k) => (
              <button key={k.id} type="button" data-on={kind === k.id} onClick={() => setKind(k.id)}>
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="v-title">Title</label>
          <input
            id="v-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Founder story — the 2am shipping panic"
          />
        </div>

        <div className="field">
          <label>Funnel stage</label>
          <div className="seg">
            {STAGE_ORDER.map((id) => (
              <button key={id} type="button" data-on={stage === id} onClick={() => setStage(id)}>
                {STAGES[id].label}
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
                onClick={() => setFormat(format === f.id ? "" : f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        {busy && (
          <>
            <div style={{ fontSize: 14, color: "var(--fog)", marginTop: 6 }}>{status}</div>
            <div className="progress">
              <span style={{ width: `${pct}%` }} />
            </div>
          </>
        )}

        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={() => !busy && onClose()} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-dark" onClick={submit} disabled={busy}>
            {busy ? "Working…" : slides.length > 1 ? `Add carousel (${slides.length})` : "Add to board"}
          </button>
        </div>
      </div>
    </div>
  );
}
