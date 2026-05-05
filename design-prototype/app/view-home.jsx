// view-home.jsx — audit setup form

function HomeView({ onSubmit, onPickRecent }) {
  const recent = [
    { domain: "northstar-outdoor.com", score: 72, audits: 7, last: "2026-05-04" },
    { domain: "claude.ai",             score: 88, audits: 3, last: "2026-04-22" },
    { domain: "about-us.be",           score: 94, audits: 12, last: "2026-04-18" },
    { domain: "lemonade.com",          score: 64, audits: 5, last: "2026-04-12" },
  ];
  const [urls, setUrls] = useState("https://www.northstar-outdoor.com\nhttps://www.northstar-outdoor.com/products\nhttps://www.northstar-outdoor.com/checkout");
  const [sitemapName, setSitemapName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [notify, setNotify] = useState(true);

  const [company, setCompany] = useState({
    name: "Northstar Outdoor Co.",
    legal: "Northstar Outdoor Holdings B.V.",
    website: "https://www.northstar-outdoor.com",
    email: "[email protected]",
    phone: "+32 2 555 04 21",
    address: "Rue de la Loi 24, 1040 Brussels, Belgium",
    coordinator: "Eline Janssens",
    lastAudit: "2025-11-04",
    responseTime: "5",
  });
  const [notifyEmail, setNotifyEmail] = useState("[email protected]");

  const fileRef = useRef(null);

  const handleFile = (f) => { if (f) setSitemapName(f.name); };

  const submit = (e) => {
    e?.preventDefault?.();
    onSubmit({ urls, sitemapName, company, notify, notifyEmail });
  };

  const urlCount = urls.split("\n").map(s => s.trim()).filter(Boolean).length;

  return (
    <div data-screen-label="01 Home — Audit setup" style={{ position: "relative", overflow: "hidden" }}>
      {/* Decorative orbs in the hero */}
      <div aria-hidden="true" style={{
        position: "absolute", top: -120, right: -100, width: 460, height: 460,
        borderRadius: "50%", background: "var(--us-grad-iridescent)",
        opacity: 0.5, filter: "blur(40px)", pointerEvents: "none",
        animation: "drift 22s ease-in-out infinite",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", top: 200, left: -80, width: 260, height: 260,
        borderRadius: "50%", background: "var(--us-grad-cool)",
        opacity: 0.45, filter: "blur(30px)", pointerEvents: "none",
        animation: "drift 18s ease-in-out infinite reverse",
      }} />

      <div className="container-narrow" style={{ position: "relative", padding: "56px 32px 96px" }}>
        {/* Hero */}
        <div className="fade-up" style={{ textAlign: "left", marginBottom: 40 }}>
          <span className="eyebrow"><span className="dot"></span>WCAG 2.2 · AA · EN 301 549</span>
          <h1 style={{ fontSize: "clamp(40px, 5.4vw, 68px)", marginTop: 14, marginBottom: 12 }}>
            Audit a site for accessibility — <em style={{ fontStyle: "normal", background: "var(--us-grad-iridescent)", WebkitBackgroundClip: "text", color: "transparent" }}>in plain English.</em>
          </h1>
          <p className="p-large muted" style={{ maxWidth: 620 }}>
            Drop in URLs or a sitemap. We'll crawl the pages, grade against WCAG 2.2 AA,
            and hand back three reports — for sales, for compliance, and for the developers
            who'll fix it.
          </p>
        </div>

        <form onSubmit={submit} className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Section 1 — what to scan */}
          <FormSection
            number="01"
            title="What should we scan?"
            subtitle="Paste a list of URLs, or upload an XML sitemap. You can do both."
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "stretch" }}>
              <div className="field">
                <label className="field-label" htmlFor="urls">URLs to scan</label>
                <textarea
                  id="urls"
                  className="textarea"
                  placeholder="https://example.com&#10;https://example.com/about"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  style={{ minHeight: 168 }}
                />
                <div className="field-hint">{urlCount} URL{urlCount === 1 ? "" : "s"} · one per line</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", gap: 4 }}>
                <div style={{ width: 1, flex: 1, background: "var(--border-default)" }}></div>
                <div className="tag tag-outline" style={{ background: "white", textTransform: "uppercase", fontSize: 11, letterSpacing: ".1em" }}>or</div>
                <div style={{ width: 1, flex: 1, background: "var(--border-default)" }}></div>
              </div>

              <div className="field">
                <label className="field-label">XML sitemap</label>
                <div
                  className={`drop ${dragging ? "dragging" : ""} ${sitemapName ? "has-file" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragging(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  style={{ minHeight: 168 }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: sitemapName ? "var(--us-mint-text)" : "var(--fg-3)" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {sitemapName ? (
                    <>
                      <div style={{ fontWeight: 500, color: "var(--us-mint-text)" }}>{sitemapName}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Click to replace</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 500 }}>Drop sitemap.xml here</div>
                      <div className="muted" style={{ fontSize: 12 }}>or click to browse · max 5 MB</div>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept=".xml" hidden
                    onChange={(e) => handleFile(e.target.files?.[0])} />
                </div>
              </div>
            </div>
          </FormSection>

          <div className="hr" style={{ margin: 0 }}></div>

          {/* Section 2 — company details */}
          <FormSection
            number="02"
            title="Company details"
            subtitle="Used to auto-generate the accessibility statement. None of this leaves the audit."
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Company name"        value={company.name}        onChange={v => setCompany({ ...company, name: v })} />
              <Field label="Legal entity name"   value={company.legal}       onChange={v => setCompany({ ...company, legal: v })} />
              <Field label="Website URL"         value={company.website}     onChange={v => setCompany({ ...company, website: v })} />
              <Field label="Contact email"       value={company.email}       onChange={v => setCompany({ ...company, email: v })} type="email" />
              <Field label="Contact phone"       value={company.phone}       onChange={v => setCompany({ ...company, phone: v })} />
              <Field label="Accessibility coordinator" value={company.coordinator} onChange={v => setCompany({ ...company, coordinator: v })} />
              <Field label="Physical address"    value={company.address}     onChange={v => setCompany({ ...company, address: v })} span={2} />
              <Field label="Last audit date"     value={company.lastAudit}   onChange={v => setCompany({ ...company, lastAudit: v })} type="date" />
              <Field label="Response time (business days)" value={company.responseTime} onChange={v => setCompany({ ...company, responseTime: v })} type="number" suffix="days" />
            </div>
          </FormSection>

          <div className="hr" style={{ margin: 0 }}></div>

          {/* Section 3 — notification */}
          <FormSection
            number="03"
            title="Notify me when it's done"
            subtitle="Audits typically finish in 4–9 minutes for sites under 200 pages."
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "end" }}>
              <Field label="Email address" value={notifyEmail} onChange={setNotifyEmail} type="email" />
              <label className="check" style={{ paddingBottom: 14 }}>
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                <span className="box"></span>
                <span>Email me when the audit finishes</span>
              </label>
            </div>
          </FormSection>

          {/* CTA */}
          <div style={{
            background: "var(--us-ink)", color: "var(--us-cream)",
            padding: "28px 32px", display: "flex",
            alignItems: "center", justifyContent: "space-between", gap: 24,
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
                Ready to audit {urlCount || "—"} page{urlCount === 1 ? "" : "s"}
              </div>
              <div style={{ opacity: 0.7, fontSize: 13, marginTop: 4 }}>
                Estimated runtime: ~{Math.max(2, Math.round(urlCount * 0.6))} min · 78 WCAG 2.2 AA rules per page
              </div>
            </div>
            <button type="submit" className="btn btn-grad btn-lg" style={{ minWidth: 220 }}>
              Start audit
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </button>
          </div>
        </form>

        <p className="muted" style={{ fontSize: 12, marginTop: 14, textAlign: "center" }}>
          By starting an audit you agree to our <a className="link">data processing policy</a>. Audits are stored for 90 days.
        </p>

        {/* Recent audits */}
        <div style={{ marginTop: 56 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <h3 style={{ fontSize: 18 }}>Recent domains</h3>
            <span className="muted" style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>wcag.about-us.be/<span style={{ color: "var(--fg-1)" }}>&lt;domain&gt;</span></span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {recent.map(r => (
              <button key={r.domain} onClick={() => onPickRecent?.(r.domain)} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center",
                padding: "14px 18px", background: "var(--us-white)", border: "1px solid var(--border-subtle)",
                borderRadius: "var(--r-md)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)",
              }}>
                <ScoreDonut score={r.score} size={42} stroke={5} showLabel={false} threshold={80} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{r.domain}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{r.audits} audits · last {r.last}</div>
                </div>
                <span className={`tag ${r.score >= 80 ? "tag-success" : "tag-warning"}`}>{r.score}</span>
                <span className="muted">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ number, title, subtitle, children }) {
  return (
    <div style={{ padding: "32px 32px 36px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)",
          letterSpacing: "0.04em",
        }}>{number}</span>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      <p className="muted" style={{ fontSize: 14, marginBottom: 22, marginLeft: 32 }}>{subtitle}</p>
      <div style={{ marginLeft: 32 }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", span = 1, suffix }) {
  return (
    <div className="field" style={{ gridColumn: `span ${span}` }}>
      <label className="field-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          className="input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={suffix ? { paddingRight: 60 } : null}
        />
        {suffix && (
          <span style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--fg-3)", fontSize: 13,
          }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { HomeView });
