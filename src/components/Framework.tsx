import { STAGE_ORDER, STAGES } from "@/lib/stages";

export default function Framework() {
  return (
    <section className="shell band" id="framework">
      <div className="section-head">
        <div>
          <span className="eyebrow">The content system</span>
          <h2 style={{ marginTop: 12 }}>Three altitudes, one journey</h2>
          <p>
            Every asset we make lives at one of three altitudes. Together they
            walk a stranger from &ldquo;who&rsquo;s this?&rdquo; to
            &ldquo;take my money.&rdquo;
          </p>
        </div>
      </div>

      <div className="stage-grid">
        {STAGE_ORDER.map((id) => {
          const s = STAGES[id];
          return (
            <article
              key={id}
              className="stage-card"
              style={{ ["--stage" as string]: s.color }}
            >
              <div className="stage-top">
                <h3>{s.label}</h3>
                <span className="level-pill">{s.level}</span>
              </div>
              <p className="stage-desc">{s.tagline}</p>
              <div className="chip-row">
                {s.formats.map((f) => (
                  <span className="chip" key={f}>
                    {f}
                  </span>
                ))}
                <span className="chip-note">{s.extra}</span>
              </div>
            </article>
          );
        })}
      </div>

      <p className="flow-line">
        Entertaining <span aria-hidden>&rarr;</span> educational{" "}
        <span aria-hidden>&rarr;</span> <strong>direct</strong>
      </p>
    </section>
  );
}
