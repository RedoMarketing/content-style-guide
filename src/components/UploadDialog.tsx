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
import { CloseIcon, UploadIcon } from "./icons";

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

export default function UploadDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Analyzed | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Kind>("actual");
  const [mediaType, setMediaType] = useState<Media>("video");
  const [stage, setStage] = useState<Stage>("awareness");
  const [format, setFormat] = useState<string>("");
  const [description, setDescription] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (meta?.previewUrl) URL.revokeObjectURL(meta.previewUrl);
    };
  }, [meta]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    if (!f.type.startsWith("video/") && !isImage) {
      setError("Add a video or image file.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File is over ${MAX_MB}MB. Trim or compress it first.`);
      return;
    }
    setMediaType(isImage ? "image" : "video");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    setStatus("Reading preview…");
    const analyzed = await analyze(f);
    setMeta(analyzed);
    setStatus("");
  }

  async function submit() {
    if (!file) return setError("Add a video first.");
    if (!title.trim()) return setError("Give it a title.");
    setBusy(true);
    setError("");
    try {
      const id = crypto.randomUUID();
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const videoPath = `clips/${id}.${ext}`;

      setStatus(mediaType === "image" ? "Uploading image…" : "Uploading video…");
      setPct(25);
      const up = await supabase.storage
        .from(BUCKET)
        .upload(videoPath, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;

      let posterPath: string | null = null;
      if (meta?.poster) {
        setStatus("Uploading thumbnail…");
        setPct(65);
        posterPath = `posters/${id}.jpg`;
        const pp = await supabase.storage
          .from(BUCKET)
          .upload(posterPath, meta.poster, { contentType: "image/jpeg" });
        if (pp.error) posterPath = null;
      }

      setStatus("Saving…");
      setPct(88);
      const ins = await supabase.from("videos").insert({
        title: title.trim(),
        kind,
        media_type: mediaType,
        stage,
        format: format || null,
        description: description.trim() || null,
        video_path: videoPath,
        poster_path: posterPath,
        width: meta?.width || null,
        height: meta?.height || null,
        duration: meta?.duration || null,
      });
      if (ins.error) throw ins.error;

      setPct(100);
      setStatus("Done");
      onDone();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      setError(msg);
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

        {/* Dropzone */}
        <div className="field">
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
              pick(e.dataTransfer.files?.[0]);
            }}
            onClick={() => !file && inputRef.current?.click()}
            style={file ? { cursor: "default" } : {}}
          >
            {meta?.previewUrl ? (
              <div className="dropzone-preview">
                {mediaType === "image" ? (
                  <img src={meta.previewUrl} alt="" />
                ) : (
                  <video src={meta.previewUrl} muted playsInline />
                )}
                <div>
                  <strong>{file?.name}</strong>
                  <div style={{ color: "var(--stone)", fontSize: 13, marginTop: 4 }}>
                    {meta.width}&times;{meta.height}
                    {meta.duration ? ` · ${meta.duration.toFixed(1)}s` : ""}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      setFile(null);
                      setMeta(null);
                    }}
                    disabled={busy}
                  >
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ color: "var(--stone)", marginBottom: 8 }}>
                  <UploadIcon size={26} />
                </div>
                <div>
                  <strong>Drop a video or image</strong> or click to browse
                </div>
                <div style={{ fontSize: 13, color: "var(--stone)", marginTop: 6 }}>
                  Video or image &middot; up to {MAX_MB}MB
                </div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="video/*,image/*"
              hidden
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>
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
              <button
                key={id}
                type="button"
                data-on={stage === id}
                onClick={() => setStage(id)}
              >
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
            {busy ? "Working…" : "Add to board"}
          </button>
        </div>
      </div>
    </div>
  );
}
