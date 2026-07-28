"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, publicUrl, type VideoRow } from "@/lib/supabase";
import { transcribe } from "@/lib/transcribe";
import Board from "./Board";
import UploadDialog from "./UploadDialog";
import FunnelPanel from "./FunnelPanel";
import BrandPanel from "./BrandPanel";
import { InfoIcon, BrandIcon, UploadIcon } from "./icons";

export default function Library() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setVideos(data as VideoRow[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Backfill helper (run from console): window.__backfillTranscripts(limit?)
  useEffect(() => {
    (window as unknown as { __backfillTranscripts: (limit?: number) => Promise<void> }).__backfillTranscripts =
      async (limit?: number) => {
        const missing = videos.filter(
          (v) => v.media_type === "video" && (!v.transcript || v.transcript.length === 0)
        );
        const todo = typeof limit === "number" ? missing.slice(0, limit) : missing;
        console.log(`[transcribe] ${todo.length} video(s) to process`);
        for (const v of todo) {
          try {
            console.log(`[transcribe] start ${v.id} (${v.title})`);
            const segs = await transcribe(publicUrl(v.video_path));
            await supabase.from("videos").update({ transcript: segs }).eq("id", v.id);
            console.log(`[transcribe] done ${v.id}: ${segs.length} segments`);
          } catch (e) {
            console.warn(`[transcribe] failed ${v.id}`, e);
          }
        }
        await load();
        console.log("[transcribe] backfill complete");
      };
  }, [videos, load]);

  return (
    <main className="page">
      <header className="shell board-head">
        <h1 className="board-title">Content Style Guide</h1>
        <div className="head-actions">
          <button className="learn-btn" onClick={() => setFunnelOpen(true)}>
            <InfoIcon /> Tone & Funnel
          </button>
          <button className="learn-btn" onClick={() => setBrandOpen(true)}>
            <BrandIcon /> Brand
          </button>
          <button
            className="icon-round"
            onClick={() => setUploadOpen(true)}
            aria-label="Upload"
            title="Upload"
          >
            <UploadIcon size={20} />
          </button>
        </div>
      </header>

      <Board videos={videos} onRefresh={load} />

      {uploadOpen && (
        <UploadDialog onClose={() => setUploadOpen(false)} onDone={load} />
      )}

      {funnelOpen && <FunnelPanel onClose={() => setFunnelOpen(false)} />}

      {brandOpen && <BrandPanel onClose={() => setBrandOpen(false)} />}
    </main>
  );
}
