// view-loading.jsx — chrome holo audit progress

function LoadingView({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [pageIdx, setPageIdx] = useState(0);
  const [ruleIdx, setRuleIdx] = useState(0);

  const data = window.AUDIT_DATA;
  const pages = data.pages;
  const rules = [
    "image-alt", "color-contrast", "keyboard-trap", "focus-visible",
    "label", "aria-required-attr", "reflow", "link-name",
    "consistent-identification", "status-messages", "heading-order",
    "valid-html", "document-title", "html-has-lang", "skip-link",
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(t); return 100; }
        return p + 1.2;
      });
    }, 80);
    const tp = setInterval(() => setPageIdx(i => (i + 1) % pages.length), 700);
    const tr = setInterval(() => setRuleIdx(i => (i + 1) % rules.length), 240);
    return () => { clearInterval(t); clearInterval(tp); clearInterval(tr); };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [progress]);

  const stages = [
    { at: 10,  label: "Crawling sitemap" },
    { at: 30,  label: "Loading pages" },
    { at: 55,  label: "Running rules" },
    { at: 80,  label: "Cross-checking ARIA" },
    { at: 95,  label: "Compiling report" },
  ];
  const currentStage = stages.filter(s => progress >= s.at).at(-1) || stages[0];
  const issuesFound = Math.round((progress / 100) * 47);

  return (
    <div data-screen-label="02 Loading — Running audit" style={{
      minHeight: "calc(100vh - 65px)", position: "relative",
      background: "var(--us-cream)", color: "var(--fg-1)", overflow: "hidden",
    }}>
      {/* Soft holo gradient orbs in the background */}
      <div aria-hidden="true" style={{
        position: "absolute", top: "-20%", left: "5%", width: 580, height: 580,
        borderRadius: "50%", background: "var(--us-grad-warm)",
        opacity: 0.5, filter: "blur(70px)",
        animation: "drift 18s ease-in-out infinite",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: "-25%", right: "0%", width: 700, height: 700,
        borderRadius: "50%", background: "var(--us-grad-cool)",
        opacity: 0.55, filter: "blur(80px)",
        animation: "drift 22s ease-in-out infinite reverse",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", top: "20%", right: "15%", width: 320, height: 320,
        borderRadius: "50%", background: "var(--us-grad-iridescent)",
        opacity: 0.35, filter: "blur(40px)",
        animation: "drift 14s ease-in-out infinite",
      }} />

      {/* Chrome holo hero */}
      <div style={{
        position: "relative", maxWidth: 1280, margin: "0 auto",
        padding: "60px 32px 40px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
        minHeight: "calc(100vh - 65px)",
      }}>
        {/* Left: copy + status */}
        <div>
          <span className="eyebrow">
            <span className="dot" style={{ background: "var(--us-mint-text)" }}></span>
            Audit in progress · WCAG 2.2 AA
          </span>
          <h1 style={{ fontSize: "clamp(44px, 5.4vw, 72px)", marginTop: 14, marginBottom: 18 }}>
            Reading every <em style={{ fontStyle: "normal", background: "var(--us-grad-iridescent)", WebkitBackgroundClip: "text", color: "transparent" }}>pixel</em>, line, and aria.
          </h1>
          <p className="p-large muted" style={{ maxWidth: 480, marginBottom: 36 }}>
            We're scanning {pages.length} pages against {rules.length}+ WCAG 2.2 AA rules.
            Sit tight, or close this tab — we'll email when it's done.
          </p>

          {/* progress */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{currentStage.label}…</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "rgba(25,25,27,0.08)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: "var(--us-grad-iridescent)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3s linear infinite",
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>

          {/* live log */}
          <div style={{
            padding: 18, borderRadius: 14,
            background: "var(--us-white)", border: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.7,
            boxShadow: "var(--shadow-card)",
          }}>
            <div style={{ display: "flex", gap: 10, color: "var(--us-mint-text)" }}>
              <span>✓</span><span>fetched sitemap.xml — {pages.length} URLs discovered</span>
            </div>
            <div style={{ display: "flex", gap: 10, color: "var(--fg-1)", marginTop: 4 }}>
              <span style={{ color: "var(--us-lilac-deep)" }}>→</span>
              <span>scanning <strong>{pages[pageIdx].url}</strong> · rule <strong>{rules[ruleIdx]}</strong></span>
            </div>
            <div style={{ display: "flex", gap: 10, color: "var(--us-peach-text)", marginTop: 4 }}>
              <span>!</span><span><strong>{issuesFound}</strong> issues found across {Math.min(pages.length, Math.ceil(progress / 12))} pages so far</span>
            </div>
          </div>
        </div>

        {/* Right: chrome holo objects stage */}
        <div style={{ position: "relative", height: 560, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Soft halo behind */}
          <div aria-hidden="true" style={{
            position: "absolute", width: 480, height: 480, borderRadius: "50%",
            background: "var(--us-grad-iridescent)", opacity: 0.55, filter: "blur(45px)",
            animation: "pulse-soft 5s ease-in-out infinite",
          }} />

          {/* Big chrome torus, rotating */}
          <img src="assets/holo-ring-1.png" alt=""
            style={{
              position: "relative", width: 520, height: "auto",
              filter: "drop-shadow(0 30px 60px rgba(98, 87, 232, 0.35))",
              animation: "ring-spin 14s linear infinite, float-y 6s ease-in-out infinite",
              transformOrigin: "center",
            }}
          />

          {/* Smaller chrome torus, opposite spin */}
          <img src="assets/holo-ring-2.png" alt=""
            style={{
              position: "absolute", width: 220, height: "auto",
              top: "12%", right: "5%",
              filter: "drop-shadow(0 16px 32px rgba(243, 170, 255, 0.45))",
              animation: "ring-spin 9s linear infinite reverse, float-y 4.5s ease-in-out infinite",
            }}
          />

          {/* Chrome swirl, bobbing */}
          <img src="assets/holo-swirl.png" alt=""
            style={{
              position: "absolute", width: 200, height: "auto",
              bottom: "5%", left: "0%",
              filter: "drop-shadow(0 20px 40px rgba(141, 255, 183, 0.4))",
              animation: "float-y 5s ease-in-out infinite reverse, drift 12s ease-in-out infinite",
            }}
          />

          {/* Floating colored dots orbiting */}
          {[0,1,2,3,4,5].map(i => {
            const angle = (i / 6) * Math.PI * 2 + progress / 40;
            const r = 280 + Math.sin(progress / 20 + i) * 10;
            const colors = ["#FFB985","#F3AAFF","#BDB4FF","#A7F0FB","#8DFFB7","#6257E8"];
            const size = 12 + (i % 3) * 4;
            return (
              <div key={i} aria-hidden="true" style={{
                position: "absolute",
                width: size, height: size, borderRadius: "50%",
                background: colors[i],
                left: `calc(50% + ${Math.cos(angle) * r}px - ${size/2}px)`,
                top:  `calc(50% + ${Math.sin(angle) * r}px - ${size/2}px)`,
                boxShadow: `0 4px 16px ${colors[i]}`,
                transition: "all 0.4s ease",
              }} />
            );
          })}

          {/* Centered counter pill */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
            padding: "10px 22px", borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24,
            fontVariantNumeric: "tabular-nums",
          }}>{Math.round(progress)}%</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 24, left: 0, right: 0,
        textAlign: "center", fontSize: 13, color: "var(--fg-3)",
      }}>
        Audit ID: AUD-2026-05-04-NSO · You can safely close this tab.
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ring-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

Object.assign(window, { LoadingView });
