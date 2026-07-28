// In-browser speech-to-text with Whisper (transformers.js).
// No server, no API key, no third-party service — the app transcribes audio itself.

export interface Segment {
  start: number;
  text: string;
}

// Lazily create the ASR pipeline once and reuse it.
let asrPromise: Promise<unknown> | null = null;

async function getASR() {
  if (!asrPromise) {
    asrPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      // Allow remote model download (open-source Whisper weights from the HF hub).
      env.allowLocalModels = false;
      return pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-base.en",
        { dtype: "q8" }
      );
    })();
  }
  return asrPromise;
}

// Decode any audio/video blob to 16 kHz mono PCM for Whisper.
async function decodeAudio(blob: Blob): Promise<Float32Array> {
  const arrayBuf = await blob.arrayBuffer();
  const AC: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
  ctx.close();

  const target = 16000;
  const offline = new OfflineAudioContext(
    1,
    Math.max(1, Math.ceil(decoded.duration * target)),
    target
  );
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

// Transcribe a video/audio File or URL into timestamped segments.
export async function transcribe(source: Blob | string): Promise<Segment[]> {
  const blob =
    typeof source === "string" ? await (await fetch(source)).blob() : source;
  const audio = await decodeAudio(blob);

  const asr = (await getASR()) as (
    input: Float32Array,
    opts: Record<string, unknown>
  ) => Promise<{ text?: string; chunks?: { text?: string; timestamp?: [number, number] }[] }>;

  const out = await asr(audio, {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  const segs: Segment[] = (out.chunks ?? [])
    .map((c) => ({
      start: Number(c.timestamp?.[0] ?? 0),
      text: String(c.text ?? "").trim(),
    }))
    .filter((s) => s.text.length > 0);

  if (!segs.length && out.text) {
    return [{ start: 0, text: String(out.text).trim() }];
  }
  return segs;
}
