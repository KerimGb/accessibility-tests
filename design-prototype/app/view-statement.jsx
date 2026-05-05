// view-statement.jsx — auto-generated accessibility statement

function StatementView({ setRoute }) {
  const data = window.AUDIT_DATA;
  const m = data.meta;
  const passing = data.score.current >= 80;
  const conformance = passing ? "Partial conformance" : "Partial conformance";

  return (
    <div data-screen-label="05 Accessibility statement" style={{ background: "var(--us-cream)", minHeight: "calc(100vh - 65px)" }}>
      <div className="container-narrow" style={{ padding: "56px 32px 96px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <span className="eyebrow"><span className="dot"></span>Auto-generated · ready to publish</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm">Copy HTML</button>
            <button className="btn btn-primary btn-sm">Download .md</button>
          </div>
        </div>

        {/* The statement document */}
        <article style={{
          background: "var(--us-white)", borderRadius: "var(--r-lg)",
          padding: "56px 64px", boxShadow: "var(--shadow-card)",
          fontFamily: "var(--font-body)", fontWeight: 300,
          lineHeight: 1.7, color: "var(--fg-1)",
        }}>
          <header style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: 28, marginBottom: 32 }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Accessibility statement</div>
            <h1 style={{ fontSize: 44, marginBottom: 14 }}>{m.company}</h1>
            <div style={{ display: "flex", gap: 18, fontSize: 14, color: "var(--fg-2)", flexWrap: "wrap" }}>
              <span>Last updated <strong>{m.auditDate}</strong></span>
              <span>·</span>
              <span>{m.legal}</span>
              <span>·</span>
              <a className="link" href={m.website}>{m.website}</a>
            </div>
          </header>

          <Section title="1. Commitment">
            <p>
              <strong>{m.legal}</strong> is committed to making its website accessible
              in accordance with <em>WCAG 2.2 AA</em> and the EU Web Accessibility
              Directive (transposed in Belgium). We aim to enable as many people as
              possible to use our digital services, regardless of ability or technology.
            </p>
          </Section>

          <Section title="2. Conformance status">
            <div style={{
              padding: 18, background: "var(--us-cream)", borderRadius: 12,
              display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center", margin: "12px 0",
            }}>
              <ScoreDonut score={data.score.current} size={84} stroke={8} showLabel={false} />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, marginBottom: 2 }}>{conformance}</div>
                <div style={{ fontSize: 14, color: "var(--fg-2)" }}>
                  This site is <strong>partially compliant</strong> with WCAG 2.2 level AA.
                  Compliance score: {data.score.current}/100.
                </div>
              </div>
            </div>
            <p>
              "Partially compliant" means some content does not yet fully conform to
              the standard. The non-compliant content is listed below, with the
              remediation timeline for each.
            </p>
          </Section>

          <Section title="3. Non-accessible content">
            <p style={{ marginBottom: 12 }}>The following items are known to fall short of WCAG 2.2 AA:</p>
            <ol style={{ paddingLeft: 22, display: "flex", flexDirection: "column", gap: 8 }}>
              {data.issues.filter(i => i.severity === "error").map(i => (
                <li key={i.id} style={{ fontSize: 14 }}>
                  <strong>{i.title}</strong> <span className="muted">(WCAG {i.criterion})</span> — {i.description}
                </li>
              ))}
            </ol>
            <p style={{ marginTop: 14, fontSize: 14 }} className="muted">
              A full technical report is maintained internally; this list is updated after each audit.
            </p>
          </Section>

          <Section title="4. Preparation of this statement">
            <p>
              This statement was prepared on <strong>{m.auditDate}</strong>, following an
              accessibility audit conducted by <em>Us Agency</em> using a combination of
              automated scanning ({m.rulesChecked} WCAG 2.2 AA rules across {m.pagesScanned} pages)
              and manual heuristic review. The next review is scheduled for {nextYear(m.auditDate)}.
            </p>
            <p>The previous audit was conducted on <strong>{m.lastAudit}</strong>.</p>
          </Section>

          <Section title="5. Feedback and contact">
            <p>If you encounter a barrier, please tell us — we want to fix it.</p>
            <div style={{
              padding: 20, border: "1px solid var(--border-subtle)", borderRadius: 12,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12, fontSize: 14,
            }}>
              <KV label="Accessibility coordinator" value={m.coordinator} />
              <KV label="Email" value={<a className="link" href={`mailto:${m.email}`}>{m.email}</a>} />
              <KV label="Phone" value={m.phone} />
              <KV label="Address" value={m.address} />
              <KV label="Response time" value={`Within ${m.responseTime}`} />
              <KV label="Languages" value="EN · NL · FR" />
            </div>
          </Section>

          <Section title="6. Enforcement procedure">
            <p>
              If we don't respond satisfactorily within <strong>{m.responseTime}</strong>, you
              can escalate to the Belgian Federal Public Service Policy and Support
              (BOSA) — the body responsible for monitoring web accessibility compliance
              in Belgium.
            </p>
          </Section>

          <footer style={{
            marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border-subtle)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12, color: "var(--fg-3)",
          }}>
            <span>Generated automatically · audit ID AUD-2026-05-04-NSO</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Generated with <span className="brand-dot" style={{ width: 16, height: 16 }}></span><strong style={{ color: "var(--fg-1)" }}>Us</strong>
            </span>
          </footer>
        </article>

        <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={() => setRoute("results")}>← Back to results</button>
          <button className="btn btn-primary" onClick={() => setRoute("developer")}>Developer next-steps →</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 22, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid var(--border-subtle)" }}>{title}</h2>
      {children}
    </section>
  );
}

function KV({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function nextYear(d) {
  const date = new Date(d);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

Object.assign(window, { StatementView });
