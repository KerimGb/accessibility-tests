// view-sales.jsx — sales/client-facing slide deck

function SalesView({ setRoute }) {
  const data = window.AUDIT_DATA;
  const m = data.meta;
  const passing = data.score.current >= 80;
  const [slideIdx, setSlideIdx] = useState(0);
  const [totalSlides, setTotalSlides] = useState(8);

  // Listen to deck-stage slide changes
  useEffect(() => {
    const stage = document.querySelector("deck-stage");
    if (!stage) return;
    stage.goTo?.(0);
    const onChange = (e) => {
      setSlideIdx(e.detail.index);
      setTotalSlides(e.detail.total);
    };
    stage.addEventListener("slidechange", onChange);
    return () => stage.removeEventListener("slidechange", onChange);
  }, []);

  const goPrev = () => document.querySelector("deck-stage")?.goTo?.(Math.max(0, slideIdx - 1));
  const goNext = () => document.querySelector("deck-stage")?.goTo?.(Math.min(totalSlides - 1, slideIdx + 1));

  const principles = data.principles;

  return (
    <div data-screen-label="04 Sales — Client deck" style={{ background: "var(--us-ink)", minHeight: "calc(100vh - 65px)", padding: "32px 32px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, color: "var(--us-cream)" }}>
          <div>
            <span className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}><span className="dot"></span>For the client</span>
            <h2 style={{ color: "var(--us-cream)", fontSize: 28, marginTop: 6 }}>Sales-ready report · {m.company}</h2>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--us-cream)", border: "1px solid rgba(255,255,255,0.2)" }} onClick={goPrev} aria-label="Previous slide">←</button>
            <span style={{ color: "var(--us-cream)", fontFamily: "var(--font-mono)", fontSize: 13, opacity: 0.7, minWidth: 60, textAlign: "center" }}>
              {String(slideIdx + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
            </span>
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--us-cream)", border: "1px solid rgba(255,255,255,0.2)" }} onClick={goNext} aria-label="Next slide">→</button>
            <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.2)", margin: "0 6px" }}></span>
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--us-cream)", border: "1px solid rgba(255,255,255,0.2)" }} onClick={() => window.print()}>Print / PDF</button>
            <button className="btn btn-cream btn-sm" onClick={() => setRoute("statement")}>Open statement →</button>
          </div>
        </div>

        <div style={{ position: "relative", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-pop)", background: "var(--us-cream)", aspectRatio: "16 / 9" }}>
          {/* Floating side nav arrows */}
          <button onClick={goPrev} aria-label="Previous slide" style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            width: 48, height: 48, borderRadius: "50%", border: 0, cursor: "pointer", zIndex: 10,
            background: "rgba(25,25,27,0.6)", color: "white", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            opacity: slideIdx > 0 ? 1 : 0.3,
          }}>‹</button>
          <button onClick={goNext} aria-label="Next slide" style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            width: 48, height: 48, borderRadius: "50%", border: 0, cursor: "pointer", zIndex: 10,
            background: "rgba(25,25,27,0.6)", color: "white", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            opacity: slideIdx < totalSlides - 1 ? 1 : 0.3,
          }}>›</button>
          <deck-stage style={{ width: "100%", height: "100%", display: "block" }}>
            {/* SLIDE 1 — Title */}
            <section data-screen-label="Slide 01 — Cover" style={slideBase("var(--us-ink)", "var(--us-cream)")}>
              <div aria-hidden="true" style={{ position: "absolute", top: -80, right: -60, width: 480, height: 480, borderRadius: "50%", background: "var(--us-grad-iridescent)", opacity: 0.5, filter: "blur(40px)" }} />
              <div aria-hidden="true" style={{ position: "absolute", bottom: -100, left: -80, width: 360, height: 360, borderRadius: "50%", background: "var(--us-grad-cool)", opacity: 0.4, filter: "blur(50px)" }} />
              <div style={{ position: "relative", padding: 96, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--us-cream)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                    <span className="brand-dot" style={{ width: 32, height: 32 }}></span>
                    <span style={{ fontSize: 18 }}>Us · Accessibility</span>
                  </span>
                  <span style={{ opacity: 0.5, fontSize: 14 }}>{m.auditDate}</span>
                </div>
                <div>
                  <span className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}><span className="dot"></span>Accessibility audit · WCAG 2.2 AA</span>
                  <h1 style={{ color: "var(--us-cream)", fontSize: 96, lineHeight: 0.95, marginTop: 18, marginBottom: 20 }}>
                    A clear-eyed look at <em style={{ fontStyle: "normal", background: "var(--us-grad-iridescent)", WebkitBackgroundClip: "text", color: "transparent" }}>{m.company}</em>
                  </h1>
                  <p style={{ fontSize: 24, opacity: 0.75, maxWidth: 760, lineHeight: 1.4 }}>
                    What's working, what's blocking real users, and what we'd change first.
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", color: "var(--us-cream)" }}>
                  <div style={{ fontSize: 14, opacity: 0.6 }}>Prepared for {m.legal}</div>
                  <div style={{ fontSize: 14, opacity: 0.6 }}>{m.pagesScanned} pages · {m.rulesChecked} rules</div>
                </div>
              </div>
            </section>

            {/* SLIDE 2 — The score */}
            <section data-screen-label="Slide 02 — Score" style={slideBase("var(--us-cream)")}>
              <div style={{ padding: 96, height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
                <div>
                  <span className="eyebrow"><span className="dot"></span>The bottom line</span>
                  <h2 style={{ fontSize: 80, marginTop: 14, marginBottom: 22, lineHeight: 0.98 }}>Your site scores <span style={{ background: "var(--us-grad-iridescent)", WebkitBackgroundClip: "text", color: "transparent" }}>{data.score.current}/100</span>.</h2>
                  <p style={{ fontSize: 22, color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 26 }}>
                    That's {data.score.current - data.score.previous} points up from your last audit — solid progress, but
                    {passing ? " safely above" : " short of"} the {80}-point compliance target.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span className="tag tag-success" style={{ fontSize: 14, padding: "8px 14px" }}>↑ +{data.score.current - data.score.previous} since last audit</span>
                    <span className="tag tag-outline" style={{ fontSize: 14, padding: "8px 14px" }}>WCAG 2.2 AA</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ScoreDonut score={data.score.current} size={380} stroke={32} threshold={80} label="Compliance" />
                </div>
              </div>
            </section>

            {/* SLIDE 3 — In plain English */}
            <section data-screen-label="Slide 03 — Plain english" style={slideBase("var(--us-white)")}>
              <div style={{ padding: 96, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span className="eyebrow"><span className="dot"></span>What this means in plain English</span>
                <h2 style={{ fontSize: 64, marginTop: 14, marginBottom: 40, maxWidth: 1100 }}>
                  Roughly <em style={{ fontStyle: "normal", background: "var(--us-peach)", padding: "0 12px", borderRadius: 12 }}>1 in 4 visitors</em> hits a real obstacle on your site.
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                  <PlainCard
                    big="92%"
                    label="of screen-reader users"
                    body="encounter at least one missing alt text or unlabelled form field per session."
                    color="var(--us-lilac)"
                    textColor="var(--us-lilac-text)"
                  />
                  <PlainCard
                    big="78%"
                    label="of low-vision users"
                    body="hit unreadable text — body copy on cream backgrounds drops below WCAG contrast."
                    color="var(--us-mint)"
                    textColor="var(--us-mint-text)"
                  />
                  <PlainCard
                    big="64%"
                    label="of keyboard-only users"
                    body="get stuck on the size selector at checkout — they can't add to cart."
                    color="var(--us-sky)"
                    textColor="var(--us-sky-text)"
                  />
                </div>
              </div>
            </section>

            {/* SLIDE 4 — POUR */}
            <section data-screen-label="Slide 04 — Principles" style={slideBase("var(--us-cream)")}>
              <div style={{ padding: 96, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span className="eyebrow"><span className="dot"></span>The four pillars · WCAG POUR</span>
                <h2 style={{ fontSize: 64, marginTop: 14, marginBottom: 40 }}>How you score on each pillar</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                  {principles.map(p => {
                    const total = p.errors + p.warnings + p.passed;
                    const pct = Math.round(p.passed / total * 100);
                    return (
                      <div key={p.key} style={{ background: p.color, padding: 28, borderRadius: 20, color: p.textColor, minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 700, lineHeight: 1 }}>{pct}%</div>
                          <div style={{ fontSize: 13, marginTop: 6, opacity: 0.7, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>pass rate</div>
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{p.label}</div>
                          <div style={{ fontSize: 14, opacity: 0.85 }}>{p.errors} errors · {p.warnings} warnings</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SLIDE 5 — Top 3 fixes */}
            <section data-screen-label="Slide 05 — Top fixes" style={slideBase("var(--us-white)")}>
              <div style={{ padding: 96, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span className="eyebrow"><span className="dot"></span>Where to start</span>
                <h2 style={{ fontSize: 64, marginTop: 14, marginBottom: 40 }}>Three fixes for 60% of the impact</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {[
                    { rank: "01", title: "Add alt text to product imagery", impact: "Unlocks 23 product pages for screen-reader users.", points: 5, color: "var(--us-peach)" },
                    { rank: "02", title: "Restore visible focus rings", impact: "Keyboard users can finally see where they are.", points: 3, color: "var(--us-lilac)" },
                    { rank: "03", title: "Rebuild the size-selector dropdown", impact: "Removes the biggest checkout blocker for motor-impaired users.", points: 8, color: "var(--us-mint)" },
                  ].map(f => (
                    <div key={f.rank} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 28, padding: "20px 28px", background: "var(--us-cream)", borderRadius: 18, alignItems: "center" }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: 16, background: f.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24,
                      }}>{f.rank}</div>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26 }}>{f.title}</div>
                        <div style={{ fontSize: 16, color: "var(--fg-2)", marginTop: 4 }}>{f.impact}</div>
                      </div>
                      <span className="tag tag-ink" style={{ fontSize: 14, padding: "8px 14px" }}>{f.points} story points</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SLIDE 6 — Trend */}
            <section data-screen-label="Slide 06 — Trend" style={slideBase("var(--us-cream)")}>
              <div style={{ padding: 96, height: "100%", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 60, alignItems: "center" }}>
                <div>
                  <span className="eyebrow"><span className="dot"></span>Six-month trend</span>
                  <h2 style={{ fontSize: 64, marginTop: 14, marginBottom: 22 }}>You're trending up — let's keep going.</h2>
                  <p style={{ fontSize: 22, color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 28 }}>
                    Score improved from <strong>41 → {data.score.current}</strong> over six months.
                    Closing the next sprint gets you to a projected <strong>{data.score.current + 18}</strong> — comfortably above legal threshold.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span className="tag tag-success" style={{ fontSize: 14, padding: "8px 14px" }}>+31 pts in 6 months</span>
                    <span className="tag tag-lilac" style={{ fontSize: 14, padding: "8px 14px" }}>Projected +18 next sprint</span>
                  </div>
                </div>
                <div style={{ background: "var(--us-white)", padding: 32, borderRadius: 24, boxShadow: "var(--shadow-card)" }}>
                  <TrendChart data={data.score.trend} width={620} height={320} />
                </div>
              </div>
            </section>

            {/* SLIDE 7 — Next steps */}
            <section data-screen-label="Slide 07 — Next steps" style={slideBase("var(--us-ink)", "var(--us-cream)")}>
              <div aria-hidden="true" style={{ position: "absolute", top: -100, left: "30%", width: 520, height: 520, borderRadius: "50%", background: "var(--us-grad-iridescent)", opacity: 0.35, filter: "blur(50px)" }} />
              <div style={{ position: "relative", padding: 96, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}><span className="dot"></span>What's next</span>
                <h2 style={{ color: "var(--us-cream)", fontSize: 80, marginTop: 14, marginBottom: 40, maxWidth: 1100 }}>
                  A two-week sprint, eight tickets, one big leap forward.
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 1000 }}>
                  <NextCard num="01" title="This week" body="Sign off the sprint and assign tickets." />
                  <NextCard num="02" title="Weeks 1–2" body="Frontend ships fixes, design audits color tokens." />
                  <NextCard num="03" title="Week 3" body="Re-audit and publish the updated statement." />
                </div>
                <div style={{ marginTop: 60, display: "flex", gap: 14, alignItems: "center" }}>
                  <span className="btn btn-grad btn-lg">Approve sprint →</span>
                  <span style={{ opacity: 0.6, fontSize: 14 }}>Or contact <strong style={{ color: "var(--us-cream)" }}>{m.coordinator}</strong> · {m.email}</span>
                </div>
              </div>
            </section>

            {/* SLIDE 8 — Closing */}
            <section data-screen-label="Slide 08 — Closing" style={slideBase("var(--us-cream)")}>
              <div style={{ padding: 96, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <div className="brand-dot" style={{ width: 80, height: 80, marginBottom: 32 }}></div>
                <h2 style={{ fontSize: 96, lineHeight: 0.95, marginBottom: 24, maxWidth: 1100 }}>
                  Let's make it work for <em style={{ fontStyle: "normal", background: "var(--us-grad-iridescent)", WebkitBackgroundClip: "text", color: "transparent" }}>everyone.</em>
                </h2>
                <p style={{ fontSize: 22, color: "var(--fg-2)", maxWidth: 780, lineHeight: 1.5 }}>
                  Questions? Reach out — we'll walk through the report with your team.
                </p>
                <div style={{ marginTop: 40, fontSize: 14, color: "var(--fg-3)" }}>
                  Us Agency · Accessibility practice · 2026
                </div>
              </div>
            </section>
          </deck-stage>
        </div>
      </div>
    </div>
  );
}

function slideBase(bg, color) {
  return {
    width: "100%", height: "100%", background: bg, color: color || "var(--fg-1)",
    position: "relative", overflow: "hidden",
    fontFamily: "var(--font-body)",
  };
}

function PlainCard({ big, label, body, color, textColor }) {
  return (
    <div style={{ padding: 28, borderRadius: 20, background: color, color: textColor, display: "flex", flexDirection: "column", gap: 14, minHeight: 240 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 72, fontWeight: 700, lineHeight: 1 }}>{big}</div>
      <div style={{ fontWeight: 600, fontSize: 18 }}>{label}</div>
      <div style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.4 }}>{body}</div>
    </div>
  );
}

function NextCard({ num, title, body }) {
  return (
    <div style={{ padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)", color: "var(--us-cream)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, opacity: 0.5, letterSpacing: ".08em" }}>{num}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, marginTop: 6, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.4 }}>{body}</div>
    </div>
  );
}

Object.assign(window, { SalesView });
