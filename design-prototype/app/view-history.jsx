// view-history.jsx — domain-based audit history landing

function HistoryView({ domain, onOpenAudit, onNewAudit }) {
  // Generate a fake history per domain — deterministic from domain name
  const seed = domain ? hashCode(domain) : 0;
  const audits = useMemo(() => buildHistory(domain, seed), [domain]);
  const latest = audits[0];

  return (
    <div data-screen-label="Domain history" style={{ background: "var(--us-cream)", minHeight: "calc(100vh - 65px)", position: "relative", overflow: "hidden" }}>
      {/* Decorative holo */}
      <div aria-hidden="true" style={{ position: "absolute", top: -140, right: -100, width: 480, height: 480, borderRadius: "50%", background: "var(--us-grad-iridescent)", opacity: 0.4, filter: "blur(50px)", animation: "drift 22s ease-in-out infinite", pointerEvents: "none" }} />

      <div className="container" style={{ padding: "56px 32px 96px", position: "relative" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "flex-end", marginBottom: 36 }}>
          <div>
            <span className="eyebrow"><span className="dot"></span>Audit history · wcag.about-us.be/{domain}</span>
            <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", marginTop: 14, marginBottom: 10 }}>
              {domain}
            </h1>
            <p className="p-large muted" style={{ maxWidth: 640 }}>
              {audits.length} audit{audits.length === 1 ? "" : "s"} on this domain ·
              latest score <strong style={{ color: "var(--fg-1)" }}>{latest.score}/100</strong>{" "}
              ({latest.delta >= 0 ? "↑" : "↓"} {Math.abs(latest.delta)} vs previous)
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={onNewAudit}>
            Run new audit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Trend */}
        <div className="card-flat" style={{ padding: 28, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <h3 style={{ fontSize: 18 }}>Score over time</h3>
            <span className="muted" style={{ fontSize: 13 }}>{audits.length} audits · {audits[audits.length-1].date} → {latest.date}</span>
          </div>
          <TrendChart data={audits.slice().reverse().map(a => ({ date: a.date.slice(5), score: a.score }))} width={1180} height={180} />
        </div>

        {/* Latest summary */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 24, alignItems: "center", padding: "24px 28px", background: "var(--us-ink)", color: "var(--us-cream)", borderRadius: "var(--r-lg)", marginBottom: 28 }}>
          <ScoreDonut score={latest.score} size={88} stroke={9} showLabel={false} />
          <div>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}><span className="dot" style={{ background: "#8DFFB7" }}></span>Latest audit</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginTop: 4 }}>{latest.date} · {latest.id}</div>
            <div style={{ opacity: 0.65, fontSize: 13, marginTop: 2 }}>{latest.errors} errors · {latest.warnings} warnings · {latest.passed} passed · {latest.pages} pages</div>
          </div>
          <span className={`tag ${latest.delta >= 0 ? "tag-success" : "tag-error"}`}>{latest.delta >= 0 ? "↑" : "↓"} {Math.abs(latest.delta)} pts</span>
          <button className="btn btn-cream btn-sm" onClick={() => onOpenAudit(latest)}>Open report →</button>
        </div>

        {/* History list */}
        <h2 style={{ fontSize: 22, marginBottom: 14 }}>All audits</h2>
        <div className="card-flat" style={{ padding: 0 }}>
          <div className="list-row" style={{ gridTemplateColumns: "120px 1fr 80px 80px 80px 100px 80px", background: "var(--us-n-20)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", fontWeight: 600 }}>
            <span>Date</span><span>Audit ID</span><span>Errors</span><span>Warns</span><span>Pages</span><span>Score</span><span></span>
          </div>
          {audits.map((a, i) => (
            <div key={a.id} className="list-row" style={{ gridTemplateColumns: "120px 1fr 80px 80px 80px 100px 80px", cursor: "pointer", alignItems: "center" }} onClick={() => onOpenAudit(a)}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{a.date}</span>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{a.id}</div>
                <div className="muted" style={{ fontSize: 12 }}>{a.trigger}</div>
              </div>
              <span className="tag tag-error">{a.errors}</span>
              <span className="tag tag-warning">{a.warnings}</span>
              <span className="muted mono" style={{ fontSize: 12 }}>{a.pages}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{a.score}</span>
                {i < audits.length - 1 && (
                  <span className="muted" style={{ fontSize: 11 }}>{a.delta >= 0 ? "↑" : "↓"}{Math.abs(a.delta)}</span>
                )}
              </div>
              <span style={{ color: "var(--fg-3)" }}>›</span>
            </div>
          ))}
        </div>

        <p className="muted" style={{ fontSize: 12, marginTop: 18, textAlign: "center" }}>
          Each domain has its own permanent URL. Share <span className="mono">wcag.about-us.be/{domain}</span> with your team to see this history anytime.
        </p>
      </div>
    </div>
  );
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildHistory(domain, seed) {
  const rng = mulberry32(seed || 1);
  const dates = [
    "2026-05-04", "2026-03-12", "2026-01-21", "2025-11-04",
    "2025-08-15", "2025-05-02", "2025-02-10",
  ];
  const triggers = [
    "Scheduled monthly audit",
    "Triggered by deploy", "Manual audit", "Pre-launch audit", "Quarterly review",
    "Triggered by deploy", "Initial audit",
  ];
  let prev = 38 + Math.floor(rng() * 10);
  const out = [];
  for (let i = dates.length - 1; i >= 0; i--) {
    const bump = Math.floor(rng() * 12) - 2;
    const score = Math.min(95, Math.max(28, prev + bump));
    const errors = Math.max(2, Math.round((100 - score) * 0.8));
    const warnings = Math.max(8, Math.round((100 - score) * 1.6));
    const pages = 80 + Math.floor(rng() * 100);
    const passed = pages * 9 + Math.floor(rng() * 50);
    out.push({
      id: `AUD-${dates[i].replace(/-/g, "")}-${(seed % 999).toString().padStart(3, "0")}`,
      date: dates[i],
      score, errors, warnings, passed, pages,
      trigger: triggers[i],
      delta: i === dates.length - 1 ? 0 : score - prev,
    });
    prev = score;
  }
  return out.reverse();
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

Object.assign(window, { HistoryView });
