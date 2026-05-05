// components.jsx — shared UI bits

const { useState, useEffect, useRef, useMemo } = React;

// ─── App header (sticky) ───────────────────────────────────────────────
function AppHeader({ route, setRoute, hasAudit, domain, goHome }) {
  const steps = [
    { key: "history",   label: "History" },
    { key: "results",   label: "Results" },
    { key: "sales",     label: "Sales" },
    { key: "statement", label: "Statement" },
    { key: "developer", label: "Developer" },
  ];

  return (
    <header className="app-header" data-screen-label="App header">
      <div className="app-header-inner">
        <a className="brand" onClick={goHome}>
          <span className="brand-dot" aria-hidden="true"></span>
          <span>Accessibility audit <small>by Us</small></span>
        </a>
        {hasAudit && domain ? (
          <nav className="nav-crumbs" aria-label="Audit progress" style={{ fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--fg-3)" }}>wcag.about-us.be</span>
            <span className="sep">/</span>
            <a className={`step ${route === "history" ? "active" : ""}`} onClick={() => setRoute("history")} style={{ cursor: "pointer" }}>{domain}</a>
            {route !== "history" && route !== "loading" && (
              <>
                <span className="sep">/</span>
                <a className="step active" style={{ cursor: "pointer" }}>{steps.find(s => s.key === route)?.label || route}</a>
              </>
            )}
          </nav>
        ) : (
          <nav className="nav-crumbs" aria-label="Audit setup">
            <a className="step active">New audit</a>
          </nav>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>WCAG 2.2 AA</span>
        </div>
      </div>
    </header>
  );
}

// ─── Reusable score donut ──────────────────────────────────────────────
function ScoreDonut({ score, size = 160, stroke = 14, label = "Score", showLabel = true, threshold = 80 }) {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const offset = c - (score / 100) * c;
  const passing = score >= threshold;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`donut-grad-${size}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%"   stopColor="#FFB985" />
            <stop offset="50%"  stopColor="#F3AAFF" />
            <stop offset="100%" stopColor="#BDB4FF" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="var(--us-n-30)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={passing ? "#1E625A" : `url(#donut-grad-${size})`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.5,0,.2,1)" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: size * 0.32, lineHeight: 1, letterSpacing: "-0.02em",
        }}>{score}</div>
        {showLabel && (
          <div style={{ fontSize: 11, textTransform: "uppercase",
            letterSpacing: ".08em", color: "var(--fg-3)", marginTop: 6 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trend sparkline ───────────────────────────────────────────────────
function TrendChart({ data, width = 320, height = 100, showAxis = true }) {
  const min = 0, max = 100;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 30) + 22;
    const y = height - 18 - ((d.score - min) / (max - min)) * (height - 30);
    return { x, y, ...d };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${line} L ${pts.at(-1).x} ${height - 18} L ${pts[0].x} ${height - 18} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#BDB4FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#BDB4FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid */}
      {showAxis && [0, 25, 50, 75, 100].map(v => {
        const y = height - 18 - (v / 100) * (height - 30);
        return (
          <line key={v} x1="22" x2={width - 8} y1={y} y2={y}
            stroke="var(--us-n-40)" strokeDasharray="2 4" strokeWidth="1" />
        );
      })}
      <path d={area} fill="url(#trend-fill)" />
      <path d={line} fill="none" stroke="var(--us-lilac-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="var(--us-lilac-deep)" strokeWidth="2" />
      ))}
      {showAxis && pts.map((p, i) => (
        <text key={`l-${i}`} x={p.x} y={height - 4} textAnchor="middle"
          fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-body)">{p.date}</text>
      ))}
    </svg>
  );
}

// ─── Severity badge ────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    error:   { cls: "tag-error",   label: "Error" },
    warning: { cls: "tag-warning", label: "Warning" },
    passed:  { cls: "tag-success", label: "Passed" },
    notice:  { cls: "tag-info",    label: "Notice" },
  };
  const m = map[severity] || map.notice;
  return <span className={`tag ${m.cls}`}><span className={`dot dot-${severity === 'passed' ? 'success' : severity}`}></span>{m.label}</span>;
}

// ─── Holo orbs (decoration) ────────────────────────────────────────────
function HoloOrb({ size = 220, top, left, right, bottom, hue = "iridescent", drift = 14, blur = 0 }) {
  const grads = {
    iridescent: "var(--us-grad-iridescent)",
    warm: "var(--us-grad-warm)",
    cool: "var(--us-grad-cool)",
  };
  return (
    <div aria-hidden="true" style={{
      position: "absolute", top, left, right, bottom, width: size, height: size,
      borderRadius: "50%", background: grads[hue],
      filter: `blur(${blur}px)`, opacity: 0.85,
      animation: `drift ${drift}s ease-in-out infinite`,
      pointerEvents: "none",
    }} />
  );
}

// ─── Window-style code block ───────────────────────────────────────────
function CodeBlock({ code, language = "html", label }) {
  return (
    <div style={{
      background: "var(--us-ink)", color: "var(--us-cream)",
      borderRadius: "var(--r-md)", overflow: "hidden",
      fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.6,
    }}>
      <div style={{
        padding: "8px 14px", background: "rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 11, color: "var(--us-n-50)", textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        <span>{label || language}</span>
        <span style={{ display: "flex", gap: 4 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: ["#FFB985","#F3AAFF","#8DFFB7"][i], opacity: 0.7,
            }} />
          ))}
        </span>
      </div>
      <pre style={{
        margin: 0, padding: "14px 16px", whiteSpace: "pre-wrap",
        wordBreak: "break-word", overflow: "auto",
      }}><code>{code}</code></pre>
    </div>
  );
}

Object.assign(window, {
  AppHeader, ScoreDonut, TrendChart, SeverityBadge, HoloOrb, CodeBlock,
});
