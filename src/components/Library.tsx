"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, type VideoRow } from "@/lib/supabase";
import Board from "./Board";
import UploadDialog from "./UploadDialog";

export default function Library() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);

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
      </header>

      <Board
        videos={videos}
        onUpload={() => setUploadOpen(true)}
        onRefresh={load}
      />

      {uploadOpen && (
        <UploadDialog onClose={() => setUploadOpen(false)} onDone={load} />
      )}
    </main>
  );
}
