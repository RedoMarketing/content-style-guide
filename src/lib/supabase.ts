import { createClient } from "@supabase/supabase-js";
import type { Stage } from "./stages";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);

export const BUCKET = "videos";

export interface VideoRow {
  id: string;
  created_at: string;
  title: string;
  kind: "inspiration" | "actual";
  media_type: "image" | "video";
  stage: Stage | null;
  format: string | null;
  description: string | null;
  video_path: string;
  poster_path: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  slides: { path: string; media_type: "image" | "video" }[] | null;
  transcript: { start: number; text: string }[] | null;
}

export function publicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
