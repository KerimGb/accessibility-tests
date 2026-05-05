// view-results.jsx — tabbed results dashboard

function ResultsView({ tweaks, setRoute }) {
  const data = window.AUDIT_DATA;
  const [tab, setTab] = useState("overview");
  const [variant, setVariant] = useState("dashboard"); // dashboard | report | compact
  const [filter, setFilter] = useState({ error: true, warning: true, passed: false });
  const [selected, setSelected] = useState(null);

  const passing = data.score.current >= tweaks.threshold;

  const tabs = [
    { key: "overview",     label: "Overview" },
    { key: "issues",       label: "Issues",        count: data.severity.errors + data.severity.warnings },
    { key: "principles",   label: "WCAG principles" },
    { key: "disability",   label: "By disability" },
    { key: "pages",        label: "By page",       count: data.pages.length },
    { key: "rules",        label: "Rules" },
  ];

  const variants = [
    { key: "dashboard", label: "Dashboard" },
    { key: "report",    label: "Report" },
    { key: "compact",   label: "Compact" },
  ];

  return (
    <div data-screen-label="03 Results — Dashboard" style={{ background: "var(--us-cream)" }}>
      {/* Hero strip */}
      <div style={{
        background: "var(--us-ink)", color: "var(--us-cream)",
        padding: "32px 0", position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", top: -120, right: -80, width: 380, height: 380,
          borderRadius: "50%", background: "var(--us-grad-iridescent)",
          opacity: 0.3, filter: "blur(50px)",
        }} />
        <div className="container" style={{ position: "relative", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 32, alignItems: "center" }}>
          <ScoreDonut score={data.score.current} size={130} stroke={12} threshold={tweaks.threshold} label="" />
          <div>
            <span className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="dot" style={{ background: passing ? "#8DFFB7" : "#FFB985" }}></span>
              {passing ? "Passing" : "Below threshold"} · audited {data.meta.auditDate}
            </span>
            <h1 style={{ color: "var(--us-cream)", fontSize: 38, marginTop: 10, marginBottom: 6 }}>
              {data.meta.company} · {data.score.current}/100
            </h1>
            <div style={{ opacity: 0.7, fontSize: 14, display: "flex", gap: 18, flexWrap: "wrap" }}>
              <span><strong style={{ color: "#FFB985" }}>{data.severity.errors}</strong> errors</span>
              <span><strong style={{ color: "#F3AAFF" }}>{data.severity.warnings}</strong> warnings</span>
              <span><strong style={{ color: "#8DFFB7" }}>{data.severity.passed}</strong> passed</span>
              <span>·</span>
              <span>{data.meta.pagesScanned} pages · {data.meta.rulesChecked} rules · WCAG 2.2 AA</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--us-cream)", borderColor: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <DownloadIcon />Export PDF
            </button>
            <button className="btn btn-cream btn-sm" onClick={() => setRoute("sales")}>
              Open sales report →
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: "32px 32px 80px" }}>
        {/* Tabs + variant switcher */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
          <div className="tabs" style={{ marginBottom: 0, border: 0 }}>
            {tabs.map(t => (
              <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                {t.label}
                {t.count != null && <span className="count">{t.count}</span>}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--us-white)", borderRadius: 999, border: "1px solid var(--border-subtle)" }}>
            {variants.map(v => (
              <button key={v.key}
                onClick={() => setVariant(v.key)}
                className="btn btn-sm"
                style={{
                  padding: "6px 14px", fontSize: 12,
                  background: variant === v.key ? "var(--us-ink)" : "transparent",
                  color: variant === v.key ? "var(--us-cream)" : "var(--fg-2)",
                  border: 0,
                }}
              >{v.label}</button>
            ))}
          </div>
        </div>
        <div className="hr" style={{ marginTop: 0 }}></div>

        {/* Tab content */}
        <div className="fade-up" key={tab + variant}>
          {tab === "overview"   && <OverviewTab variant={variant} data={data} threshold={tweaks.threshold} />}
          {tab === "issues"     && <IssuesTab variant={variant} data={data} filter={filter} setFilter={setFilter} tweaks={tweaks} setSelected={setSelected} />}
          {tab === "principles" && <PrinciplesTab data={data} />}
          {tab === "disability" && <DisabilityTab data={data} />}
          {tab === "pages"      && <PagesTab data={data} />}
          {tab === "rules"      && <RulesTab data={data} />}
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: 64, padding: "32px 36px",
          background: "var(--us-ink)", color: "var(--us-cream)",
          borderRadius: "var(--r-lg)", display: "grid",
          gridTemplateColumns: "1fr auto auto auto", gap: 12, alignItems: "center",
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>Three deliverables, ready.</div>
            <div style={{ opacity: 0.65, fontSize: 14, marginTop: 4 }}>One link to share with each audience.</div>
          </div>
          <button className="btn btn-cream" onClick={() => setRoute("sales")}>Sales report</button>
          <button className="btn btn-cream" onClick={() => setRoute("statement")}>A11y statement</button>
          <button className="btn btn-grad" onClick={() => setRoute("developer")}>Developer next-steps</button>
        </div>
      </div>

      {selected && <IssueDetail issue={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────
function OverviewTab({ variant, data, threshold }) {
  const total = data.severity.errors + data.severity.warnings + data.severity.passed;
  const pctPassed = Math.round(data.severity.passed / total * 100);

  return (
    <div>
      {/* Top stat strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: variant === "compact" ? "repeat(6, 1fr)" : "repeat(4, 1fr)",
        gap: 12, marginBottom: 24,
      }}>
        <BigStat label="Compliance score"   value={data.score.current} suffix="/100" delta={`+${data.score.current - data.score.previous}`} tone="lilac" />
        <BigStat label="Errors"              value={data.severity.errors}   tone="error" />
        <BigStat label="Warnings"            value={data.severity.warnings} tone="warning" />
        <BigStat label="Passed checks"       value={data.severity.passed.toLocaleString()} tone="success" />
        {variant === "compact" && (
          <>
            <BigStat label="Pages scanned"   value={data.meta.pagesScanned} tone="info" />
            <BigStat label="Est. dev effort" value={`${data.sprint.points} pts`} tone="info" />
          </>
        )}
      </div>

      {/* Two-column main */}
      <div style={{ display: "grid", gridTemplateColumns: variant === "report" ? "1fr" : "2fr 1fr", gap: 24 }}>
        {/* Trend */}
        <div className="card-flat">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 2 }}>Score trend</h3>
              <div className="muted" style={{ fontSize: 13 }}>Last 6 months · {data.score.current - data.score.previous > 0 ? "↑" : "↓"} {Math.abs(data.score.current - data.score.previous)} pts since last audit</div>
            </div>
            <span className="tag tag-success">↑ Improving</span>
          </div>
          <TrendChart data={data.score.trend} width={760} height={180} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Severity pie */}
          <div className="card-flat">
            <h3 style={{ fontSize: 16, marginBottom: 14 }}>Issue distribution</h3>
            <SeverityPie data={data.severity} />
          </div>
        </div>
      </div>

      {/* Bottom: principles preview + most-affected pages */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <div className="card-flat">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>WCAG principles (POUR)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.principles.map(p => {
              const total = p.errors + p.warnings + p.passed;
              const pct = Math.round(p.passed / total * 100);
              return (
                <div key={p.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{p.label}</span>
                    <span className="muted">{pct}% · {p.errors} errors</span>
                  </div>
                  <div className="grade-bar">
                    <div className="fill" style={{ width: `${pct}%`, background: p.color }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card-flat">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Most-affected pages</h3>
          <div>
            {[...data.pages].sort((a, b) => b.errors - a.errors).slice(0, 5).map((p, i) => (
              <div key={p.url} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--border-subtle)" : 0, alignItems: "center" }}>
                <span className="mono muted" style={{ fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.title}</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>{p.url}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="tag tag-error">{p.errors}</span>
                  <span className="tag tag-warning">{p.warnings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, suffix, delta, tone = "ink" }) {
  const colors = {
    error:   { bg: "#FCE8E5", fg: "var(--us-peach-text)" },
    warning: { bg: "var(--us-peach)", fg: "var(--us-peach-text)" },
    success: { bg: "var(--us-mint)", fg: "var(--us-mint-text)" },
    lilac:   { bg: "var(--us-lilac)", fg: "var(--us-lilac-text)" },
    info:    { bg: "var(--us-sky)", fg: "var(--us-sky-text)" },
    ink:     { bg: "var(--us-ink)", fg: "var(--us-cream)" },
  };
  const c = colors[tone] || colors.ink;
  return (
    <div className="stat" style={{ background: c.bg, border: "1px solid transparent" }}>
      <div className="stat-label" style={{ color: c.fg, opacity: 0.7 }}>{label}</div>
      <div className="stat-value" style={{ color: c.fg }}>
        {value}<span style={{ fontSize: 18, marginLeft: 2, opacity: 0.6 }}>{suffix}</span>
      </div>
      {delta && <div className="stat-sub" style={{ color: c.fg, opacity: 0.7 }}>{delta} since last audit</div>}
    </div>
  );
}

function SeverityPie({ data }) {
  const segs = [
    { key: "errors",   value: data.errors,   color: "#872012", label: "Errors" },
    { key: "warnings", value: data.warnings, color: "#FFB985", label: "Warnings" },
    { key: "passed",   value: data.passed,   color: "#8DFFB7", label: "Passed" },
    { key: "notice",   value: data.notice,   color: "#A7F0FB", label: "Notice" },
  ];
  const total = segs.reduce((s, x) => s + x.value, 0);
  let cum = 0;
  const r = 60, c = 70;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={c} cy={c} r={r} fill="var(--us-n-30)" />
        {segs.map(s => {
          const slice = s.value / total;
          const start = cum * Math.PI * 2 - Math.PI / 2;
          cum += slice;
          const end = cum * Math.PI * 2 - Math.PI / 2;
          const large = slice > 0.5 ? 1 : 0;
          const x1 = c + Math.cos(start) * r, y1 = c + Math.sin(start) * r;
          const x2 = c + Math.cos(end) * r, y2 = c + Math.sin(end) * r;
          return (
            <path key={s.key} d={`M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={s.color} />
          );
        })}
        <circle cx={c} cy={c} r={32} fill="white" />
        <text x={c} y={c - 2} textAnchor="middle" fontSize="20" fontFamily="var(--font-display)" fontWeight="700">{total}</text>
        <text x={c} y={c + 14} textAnchor="middle" fontSize="9" fill="var(--fg-3)" letterSpacing="0.08em">CHECKS</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
        {segs.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color }}></span>
            <span style={{ minWidth: 70 }}>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Issues tab ───────────────────────────────────────────────────────
function IssuesTab({ variant, data, filter, setFilter, tweaks, setSelected }) {
  const filtered = data.issues.filter(i => {
    if (i.severity === "error" && !filter.error) return false;
    if (i.severity === "warning" && !filter.warning) return false;
    if (i.severity === "passed" && !filter.passed) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span className="muted" style={{ fontSize: 13 }}>Show:</span>
        <FilterChip active={filter.error}   onClick={() => setFilter({ ...filter, error: !filter.error })} tone="error">
          {data.severity.errors} errors
        </FilterChip>
        <FilterChip active={filter.warning} onClick={() => setFilter({ ...filter, warning: !filter.warning })} tone="warning">
          {data.severity.warnings} warnings
        </FilterChip>
        <FilterChip active={filter.passed}  onClick={() => setFilter({ ...filter, passed: !filter.passed })} tone="success">
          {data.severity.passed} passed
        </FilterChip>
        <span style={{ flex: 1 }}></span>
        <span className="muted" style={{ fontSize: 13 }}>{filtered.length} shown</span>
      </div>

      {/* Issues list */}
      <div className="card-flat" style={{ padding: 0 }}>
        {filtered.map(issue => (
          <IssueRow key={issue.id} issue={issue} variant={variant} onSelect={() => setSelected(issue)} />
        ))}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, tone, children }) {
  const bg = tone === "error" ? "#FCE8E5" : tone === "warning" ? "var(--us-peach)" : "var(--us-mint)";
  const fg = tone === "error" ? "var(--us-peach-text)" : tone === "warning" ? "var(--us-peach-text)" : "var(--us-mint-text)";
  return (
    <button onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: 999,
        background: active ? bg : "transparent",
        color: active ? fg : "var(--fg-3)",
        border: `1px solid ${active ? "transparent" : "var(--border-default)"}`,
        fontSize: 13, fontWeight: 500, cursor: "pointer",
        fontFamily: "var(--font-body)",
      }}
    >
      <span className={`dot dot-${tone === "success" ? "success" : tone}`} style={{ marginRight: 6, opacity: active ? 1 : 0.5 }}></span>
      {children}
    </button>
  );
}

function IssueRow({ issue, variant, onSelect }) {
  const principle = window.AUDIT_DATA.principles.find(p => p.key === issue.principle);
  return (
    <div className="list-row" style={{ gridTemplateColumns: variant === "compact" ? "auto 1fr auto auto" : "auto 1fr auto auto auto", cursor: "pointer" }} onClick={onSelect}>
      <SeverityBadge severity={issue.severity} />
      <div>
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 2 }}>{issue.title}</div>
        <div className="muted" style={{ fontSize: 12 }}>
          WCAG {issue.criterion} · <span className="mono">{issue.rule}</span> · {principle?.label}
        </div>
      </div>
      {variant !== "compact" && (
        <span className="tag tag-outline" style={{ fontSize: 11 }}>{issue.occurrences}× across {issue.pages?.length || 0} page{issue.pages?.length === 1 ? "" : "s"}</span>
      )}
      {issue.effort != null && <span className="tag tag-lilac" style={{ fontSize: 11 }}>{issue.effort} pts</span>}
      <span style={{ color: "var(--fg-3)" }}>›</span>
    </div>
  );
}

function IssueDetail({ issue, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(25,25,27,0.4)",
      backdropFilter: "blur(8px)", zIndex: 100,
      display: "flex", justifyContent: "flex-end",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 600, maxWidth: "90vw", height: "100vh", background: "var(--us-cream)",
        overflowY: "auto", boxShadow: "var(--shadow-pop)",
      }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SeverityBadge severity={issue.severity} />
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close ✕</button>
        </div>
        <div style={{ padding: "24px 32px" }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>WCAG {issue.criterion} · <span className="mono">{issue.rule}</span></div>
          <h2 style={{ fontSize: 28, marginBottom: 14 }}>{issue.title}</h2>
          <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.6, marginBottom: 24 }}>{issue.description}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            <MiniStat label="Occurrences" value={issue.occurrences} />
            <MiniStat label="Pages affected" value={issue.pages?.length || 0} />
            {issue.effort != null && <MiniStat label="Dev effort" value={`${issue.effort} pts`} />}
          </div>

          {issue.example && (
            <>
              <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", marginBottom: 8 }}>Current</h4>
              <CodeBlock code={issue.example} label="bad" />
            </>
          )}
          {issue.fix && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", marginBottom: 8 }}>Suggested fix</h4>
              <CodeBlock code={issue.fix} label="good" />
            </div>
          )}

          {issue.pages && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", marginBottom: 8 }}>Found on</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {issue.pages.map(p => (
                  <div key={p} className="mono" style={{ fontSize: 13, padding: "8px 12px", background: "var(--us-white)", borderRadius: 6 }}>{p}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ padding: "12px 14px", background: "var(--us-white)", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// ─── Principles tab ───────────────────────────────────────────────────
function PrinciplesTab({ data }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
      {data.principles.map(p => {
        const total = p.errors + p.warnings + p.passed;
        const pct = Math.round(p.passed / total * 100);
        return (
          <div key={p.key} className="card-flat" style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: p.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26,
                  color: p.textColor, marginBottom: 14,
                }}>{p.label[0]}</div>
                <h3 style={{ fontSize: 24, marginBottom: 4 }}>{p.label}</h3>
                <div className="muted" style={{ fontSize: 13 }}>{total} checks across all pages</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{pct}<span style={{ fontSize: 20 }}>%</span></div>
                <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>pass rate</div>
              </div>
            </div>
            <div className="grade-bar"><div className="fill" style={{ width: `${pct}%`, background: p.color }}></div></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 13 }}>
              <span><span className="dot dot-error"></span> {p.errors} errors</span>
              <span><span className="dot dot-warning"></span> {p.warnings} warnings</span>
              <span><span className="dot dot-success"></span> {p.passed} passed</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Disability tab ───────────────────────────────────────────────────
function DisabilityTab({ data }) {
  return (
    <div>
      <p className="muted" style={{ fontSize: 14, marginBottom: 20, maxWidth: 720 }}>
        Each issue is mapped to the disability groups it most directly affects. A higher percentage means more of the user journey is blocked for that group.
      </p>
      <div className="card-flat" style={{ padding: 0 }}>
        {data.disabilities.map((d, i) => (
          <div key={d.key} style={{
            display: "grid", gridTemplateColumns: "60px 1fr auto auto",
            gap: 20, alignItems: "center", padding: "20px 24px",
            borderBottom: i < data.disabilities.length - 1 ? "1px solid var(--border-subtle)" : 0,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--us-grad-iridescent)", opacity: 0.85,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>{d.icon}</div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 16 }}>{d.label}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{d.issues} relevant issues</div>
              <div className="grade-bar" style={{ marginTop: 8, maxWidth: 460 }}>
                <div className="fill" style={{ width: `${d.percent}%`, background: d.percent > 70 ? "var(--us-peach-text)" : d.percent > 40 ? "var(--us-peach)" : "var(--us-mint)" }}></div>
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d.percent}<span style={{ fontSize: 14 }}>%</span></div>
            <span className="tag tag-outline">{d.percent > 70 ? "Severely impacted" : d.percent > 40 ? "Impacted" : "Mildly impacted"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pages tab ────────────────────────────────────────────────────────
function PagesTab({ data }) {
  return (
    <div className="card-flat" style={{ padding: 0 }}>
      <div className="list-row" style={{ gridTemplateColumns: "auto 1fr auto auto auto auto", background: "var(--us-n-20)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", fontWeight: 600 }}>
        <span>#</span><span>Page</span><span>Errors</span><span>Warnings</span><span>Passed</span><span>Score</span>
      </div>
      {data.pages.map((p, i) => {
        const total = p.errors + p.warnings + p.passed;
        const pct = Math.round(p.passed / total * 100);
        return (
          <div key={p.url} className="list-row" style={{ gridTemplateColumns: "auto 1fr auto auto auto auto", alignItems: "center" }}>
            <span className="mono muted" style={{ fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{p.title}</div>
              <div className="mono muted" style={{ fontSize: 11 }}>{p.url}</div>
            </div>
            <span className="tag tag-error">{p.errors}</span>
            <span className="tag tag-warning">{p.warnings}</span>
            <span className="muted mono" style={{ fontSize: 12 }}>{p.passed}</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, fontVariantNumeric: "tabular-nums", minWidth: 48, textAlign: "right" }}>{pct}<span style={{ fontSize: 12, opacity: 0.5 }}>%</span></span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rules tab (grouped by rule name) ─────────────────────────────────
function RulesTab({ data }) {
  return (
    <div className="card-flat" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>78 rules checked · 12 with violations</h3>
      <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>WCAG 2.2 AA success criteria evaluated automatically and via heuristics.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {data.issues.map(i => (
          <div key={i.id} style={{ padding: "10px 14px", border: "1px solid var(--border-subtle)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{i.rule}</div>
              <div className="muted" style={{ fontSize: 11 }}>WCAG {i.criterion}</div>
            </div>
            <SeverityBadge severity={i.severity} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

Object.assign(window, { ResultsView });
