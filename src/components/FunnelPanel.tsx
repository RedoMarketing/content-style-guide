"use client";

import { useEffect } from "react";
import { STAGE_ORDER, STAGES } from "@/lib/stages";

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

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FunnelPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="funnel-page" role="dialog" aria-modal="true" aria-label="How the funnel works">
      <div className="funnel-topbar">
        <button className="back-btn" onClick={onClose}>
          <BackArrow /> Back to board
        </button>
      </div>

      <div className="funnel-hscroll">
        <div className="funnel-intro">
          <h1 className="fpage-title">How the funnel works</h1>
          <p className="funnel-lede">
            Every asset on this board does one of three jobs. Together they walk a
            stranger from &ldquo;who&rsquo;s this?&rdquo; to &ldquo;take my
            money,&rdquo; getting more direct as intent rises.
          </p>
          <p className="funnel-flow">
            Entertaining <span aria-hidden>&rarr;</span> educational{" "}
            <span aria-hidden>&rarr;</span> <strong>direct</strong>
          </p>
        </div>

        {STAGE_ORDER.map((id, i) => {
          const s = STAGES[id];
          return (
            <div className="fstep" key={id}>
              <div className="fstep-eyebrow">
                Step {i + 1} of {STAGE_ORDER.length}
              </div>
              <h2 className="fstep-title">{s.label}</h2>
              <div className="fstep-level">{s.level}</div>
              <p className="fstep-job">{JOB[id]}</p>

              <div className="fstep-block">
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

              <div className="fstep-block">
                <span className="fstage-label">Why</span>
                <p className="fstage-why">{WHY[id]}</p>
              </div>
            </div>
          );
        })}

        <div className="fstep">
          <div className="fstep-eyebrow">The takeaway</div>
          <h2 className="fstep-title">How they work together</h2>
          <p className="fstep-close-p" style={{ marginTop: 16 }}>
            Think of it as one journey, not three buckets. Someone might catch an
            Awareness film today, a Consideration explainer next week, and a
            Decision offer once they are ready. The tone shifts from entertaining
            to educational to direct as intent rises, so match every asset to
            where its viewer&rsquo;s head is at.
          </p>
        </div>
      </div>
    </div>
  );
}
