"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, type VideoRow } from "@/lib/supabase";
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
