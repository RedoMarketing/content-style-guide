export type Stage = "awareness" | "consideration" | "decision";

export type Kind = "inspiration" | "actual";

export const KINDS: { id: Kind; label: string }[] = [
  { id: "inspiration", label: "Inspiration" },
  { id: "actual", label: "Actuals" },
];

export type Format =
  | "short-film"
  | "ugc"
  | "case-study"
  | "meme"
  | "static";

export interface StageMeta {
  id: Stage;
  label: string;
  level: string;
  tagline: string;
  formats: string[];
  extra: string;
  color: string;
}

export const STAGES: Record<Stage, StageMeta> = {
  awareness: {
    id: "awareness",
    label: "Awareness",
    level: "Brand",
    tagline:
      'Everything here follows the theme "Win with Redo." Storytelling that captures interest across your whole ICP, not just buyers.',
    formats: ["Short film", "UGC / explainer", "Case study / podcast", "Meme / trend"],
    extra: "+ static edits of each",
    color: "var(--stage-awareness)",
  },
  consideration: {
    id: "consideration",
    label: "Consideration",
    level: "Cloud/Product",
    tagline:
      "Educational. Start pushing pain points and begin teaching about what problems we solve.",
    formats: ["Short film", "UGC / explainer", "Case study / podcast"],
    extra: "+ static variants & screen grabs",
    color: "var(--stage-consideration)",
  },
  decision: {
    id: "decision",
    label: "Decision",
    level: "Feature",
    tagline:
      "Direct. Drive the decision with clear CTAs and high-value offers, showing exactly why they need this product.",
    formats: ["UGC / explainer, very direct"],
    extra: "+ feature & benefit statics",
    color: "var(--stage-decision)",
  },
};

export const STAGE_ORDER: Stage[] = ["awareness", "consideration", "decision"];

export const FORMATS: { id: Format; label: string }[] = [
  { id: "short-film", label: "Short film" },
  { id: "ugc", label: "UGC / explainer" },
  { id: "case-study", label: "Case study / podcast" },
  { id: "meme", label: "Meme / trend" },
  { id: "static", label: "Static edit" },
];

export type Media = "video" | "image";

export const MEDIA: { id: Media; label: string }[] = [
  { id: "video", label: "Video" },
  { id: "image", label: "Image" },
];

export function formatLabel(id: string): string {
  return FORMATS.find((f) => f.id === id)?.label ?? id;
}

export function stageColor(stage: Stage): string {
  return STAGES[stage].color;
}
