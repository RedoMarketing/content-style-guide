"use client";

import { useEffect } from "react";
import { STAGE_ORDER, STAGES } from "@/lib/stages";
import { CloseIcon } from "./icons";

const JOB: Record<string, string> = {
  awareness:
    "Pure storytelling, no features. It works for anyone in your ICP, not just people ready to buy.",
  consideration:
    'Educational content that leans on the pain points and helps the viewer self-select: "are you my person?"',
  decision:
    'Direct CTAs and high-value offers. The "why you MUST be on this product" moment.',
};

const WHY: Record<string, string> = {
  awareness:
    'Top of the funnel, where you are earning attention, not pitching. Lead with the "Win with Redo" theme and make people feel something. No demos, no jargon. The goal is reach and brand affinity so you are the name they remember later.',
  consideration:
    "They know who you are now, so start teaching. Name the problem you solve and prove you understand it better than anyone. This is where you filter: the right people lean in, the wrong ones drop off, and that is the point.",
  decision:
    "Bottom of the funnel, for people ready to act. Be explicit about features, benefits, offers, and a clear call to action. Less story, more reasons to say yes right now.",
};

export default function FunnelPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="funnel-scrim"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside
        className="funnel-panel"
        role="dialog"
        aria-modal="true"
        aria-label="How the funnel works"
      >
        <div className="funnel-head">
          <span className="drawer-eyebrow">The content system</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <h2 className="funnel-title">How the funnel works</h2>
        <p className="funnel-lede">
          Every asset on this board does one of three jobs. Together they walk a
          stranger from &ldquo;who&rsquo;s this?&rdquo; to &ldquo;take my
          money,&rdquo; getting more direct as intent rises.
        </p>
        <p className="funnel-flow">
          Entertaining <span aria-hidden>&rarr;</span> educational{" "}
          <span aria-hidden>&rarr;</span> <strong>direct</strong>
        </p>

        {STAGE_ORDER.map((id) => {
          const s = STAGES[id];
          return (
            <section className="fstage" key={id}>
              <div className="fstage-top">
                <h3>{s.label}</h3>
                <span className="fstage-level">{s.level}</span>
              </div>
              <p className="fstage-job">{JOB[id]}</p>

              <div className="fstage-sub">
                <span className="fstage-label">What goes here</span>
                <div className="fstage-chips">
                  {s.formats.map((f) => (
                    <span className="fstage-chip" key={f}>
                      {f}
                    </span>
                  ))}
                  <span className="fstage-note">{s.extra}</span>
                </div>
              </div>

              <div className="fstage-sub">
                <span className="fstage-label">Why</span>
                <p className="fstage-why">{WHY[id]}</p>
              </div>
            </section>
          );
        })}

        <div className="fstage-together">
          <span className="fstage-label">How they work together</span>
          <p>
            Think of it as one journey, not three buckets. Someone might catch an
            Awareness film today, a Consideration explainer next week, and a
            Decision offer once they are ready. The tone shifts from entertaining
            to educational to direct as intent rises, so match every asset to
            where its viewer&rsquo;s head is at.
          </p>
        </div>
      </aside>
    </div>
  );
}
