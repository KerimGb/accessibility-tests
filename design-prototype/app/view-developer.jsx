// view-developer.jsx — developer next-steps + Jira project picker

function DeveloperView({ setRoute }) {
  const data = window.AUDIT_DATA;
  const sprint = data.sprint;
  const [picker, setPicker] = useState(false);
  const [project, setProject] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const groupedByPrinciple = data.principles.map(p => ({
    ...p,
    issues: data.issues.filter(i => i.principle === p.key && i.severity !== "passed"),
  }));

  return (
    <div data-screen-label="06 Developer next-steps" style={{ background: "var(--us-cream)", minHeight: "calc(100vh - 65px)" }}>
      <div className="container" style={{ padding: "48px 32px 96px" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center", marginBottom: 36 }}>
          <div>
            <span className="eyebrow"><span className="dot"></span>For the engineers</span>
            <h1 style={{ fontSize: "clamp(36px, 4.5vw, 56px)", marginTop: 12, marginBottom: 10 }}>
              Here's what to fix, in what order.
            </h1>
            <p className="p-large muted" style={{ maxWidth: 640 }}>
              {sprint.tickets.length} tickets · {sprint.points} story points · ~{sprint.duration}.
              Each ticket includes the rule, an example fix, and the WCAG criterion.
            </p>
          </div>
          <button className="btn btn-grad btn-lg" onClick={() => setPicker(true)}>
            <JiraIcon /> Add sprint to Jira
          </button>
        </div>

        {/* Sprint summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          <BigSprintStat label="Sprint" value={sprint.name} sub={sprint.duration} tone="ink" />
          <BigSprintStat label="Tickets" value={sprint.tickets.length} sub={`${sprint.tickets.filter(t => t.severity === "error").length} blockers`} tone="lilac" />
          <BigSprintStat label="Story points" value={sprint.points} sub="Estimated by issue impact" tone="mint" />
          <BigSprintStat label="Score uplift" value="+18" sub="Projected after sprint" suffix=" pts" tone="peach" />
        </div>

        {/* Tickets table */}
        <div className="card-flat" style={{ padding: 0, marginBottom: 40 }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 20 }}>Proposed tickets</h2>
            <span className="muted" style={{ fontSize: 13 }}>Sorted by severity → effort</span>
          </div>
          <div className="list-row" style={{ gridTemplateColumns: "100px 1fr 140px 80px 100px", background: "var(--us-n-20)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", fontWeight: 600 }}>
            <span>Key</span><span>Title</span><span>Assignee</span><span>Points</span><span>Severity</span>
          </div>
          {sprint.tickets.map(t => (
            <div key={t.id} className="list-row" style={{ gridTemplateColumns: "100px 1fr 140px 80px 100px" }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{t.id}</span>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</span>
              <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{t.assignee}</span>
              <span className="tag tag-lilac">{t.points}</span>
              <SeverityBadge severity={t.severity} />
            </div>
          ))}
        </div>

        {/* Issues by principle, with code */}
        <h2 style={{ fontSize: 28, marginBottom: 18 }}>Fixes by principle</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {groupedByPrinciple.filter(g => g.issues.length).map(g => (
            <div key={g.key} className="card-flat" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: g.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontWeight: 700, color: g.textColor,
                }}>{g.label[0]}</div>
                <h3 style={{ fontSize: 22 }}>{g.label}</h3>
                <span className="muted" style={{ fontSize: 13 }}>· {g.issues.length} issue{g.issues.length === 1 ? "" : "s"} to fix</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {g.issues.map(i => (
                  <details key={i.id} style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
                    <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", listStyle: "none" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <SeverityBadge severity={i.severity} />
                        <strong style={{ fontSize: 15 }}>{i.title}</strong>
                        <span className="muted mono" style={{ fontSize: 12 }}>WCAG {i.criterion} · {i.rule}</span>
                      </span>
                      <span className="muted" style={{ fontSize: 13 }}>{i.occurrences}× · {i.effort} pts</span>
                    </summary>
                    <p style={{ fontSize: 14, color: "var(--fg-2)", margin: "10px 0 14px", lineHeight: 1.6 }}>{i.description}</p>
                    {i.example && i.fix && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <CodeBlock code={i.example} label="before" />
                        <CodeBlock code={i.fix} label="after" />
                      </div>
                    )}
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {picker && !confirmed && (
        <JiraPicker
          tickets={sprint.tickets}
          sprint={sprint}
          project={project}
          setProject={setProject}
          onClose={() => setPicker(false)}
          onConfirm={() => setConfirmed(true)}
        />
      )}
      {confirmed && <JiraConfirm sprint={sprint} project={project} onClose={() => { setPicker(false); setConfirmed(false); }} />}
    </div>
  );
}

function BigSprintStat({ label, value, sub, suffix, tone }) {
  const map = {
    ink:    { bg: "var(--us-ink)",   fg: "var(--us-cream)" },
    lilac:  { bg: "var(--us-lilac)", fg: "var(--us-lilac-text)" },
    mint:   { bg: "var(--us-mint)",  fg: "var(--us-mint-text)" },
    peach:  { bg: "var(--us-peach)", fg: "var(--us-peach-text)" },
  };
  const c = map[tone] || map.ink;
  return (
    <div className="stat" style={{ background: c.bg, color: c.fg, border: "1px solid transparent" }}>
      <div className="stat-label" style={{ color: c.fg, opacity: 0.7 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: c.fg }}>
        {value}{suffix}
      </div>
      <div style={{ fontSize: 12, color: c.fg, opacity: 0.65 }}>{sub}</div>
    </div>
  );
}

function JiraPicker({ tickets, sprint, project, setProject, onClose, onConfirm }) {
  const projects = [
    { id: "NS", name: "Northstar Web",    key: "NS",  team: "Frontend platform", color: "#6257E8" },
    { id: "PD", name: "Product Catalog",  key: "PD",  team: "Catalog",           color: "#41BD73" },
    { id: "CK", name: "Checkout",         key: "CK",  team: "Commerce",          color: "#FFB985" },
    { id: "DS", name: "Design System",    key: "DS",  team: "Design",            color: "#F3AAFF" },
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(25,25,27,0.5)",
      backdropFilter: "blur(8px)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 640, maxWidth: "100%", maxHeight: "90vh", background: "var(--us-white)",
        borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-pop)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>
              <JiraIcon /> Jira · northstar-outdoor.atlassian.net
            </div>
            <h2 style={{ fontSize: 22, marginTop: 6 }}>Add sprint to Jira</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Pick a project</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {projects.map(p => (
              <button key={p.id} onClick={() => setProject(p)}
                style={{
                  padding: "14px 16px", border: `1.5px solid ${project?.id === p.id ? "var(--us-ink)" : "var(--border-default)"}`,
                  borderRadius: 12, background: project?.id === p.id ? "var(--us-cream)" : "var(--us-white)",
                  display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                  textAlign: "left", fontFamily: "var(--font-body)",
                }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: p.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{p.key}</span>
                <span>
                  <span style={{ display: "block", fontWeight: 500, fontSize: 14 }}>{p.name}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--fg-3)" }}>{p.team}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 28px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Tickets to create ({tickets.length})</div>
          {tickets.map(t => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, padding: "8px 0", fontSize: 13, alignItems: "center" }}>
              <span className="mono muted" style={{ fontSize: 11 }}>{project?.key || "??"}-{t.id.slice(-3)}</span>
              <span>{t.title}</span>
              <span className="tag tag-lilac" style={{ fontSize: 11 }}>{t.points} pts</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px 28px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--us-cream)" }}>
          <div className="muted" style={{ fontSize: 13 }}>
            Will create <strong>{tickets.length} issues</strong> in <strong>{project?.name || "—"}</strong> · {sprint.points} story points
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" disabled={!project} onClick={onConfirm} style={{ opacity: project ? 1 : 0.5 }}>
              Create {tickets.length} tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JiraConfirm({ sprint, project, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(25,25,27,0.5)",
      backdropFilter: "blur(8px)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, maxWidth: "100%", background: "var(--us-white)",
        borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-pop)",
        textAlign: "center", padding: "44px 36px", position: "relative",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", top: -100, left: -50, right: -50, height: 200,
          background: "var(--us-grad-iridescent)", opacity: 0.4, filter: "blur(40px)",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--us-mint)", margin: "0 auto 20px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--us-mint-text)" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 28, marginBottom: 10 }}>Sprint created in Jira</h2>
          <p className="muted" style={{ fontSize: 15, marginBottom: 24 }}>
            <strong>{sprint.tickets.length} tickets</strong> added to <strong>{project?.name}</strong> · sprint <strong>"{sprint.name}"</strong>.
            Your team should see them in their backlog now.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
            <a className="btn btn-primary btn-sm" href={`https://${project?.key?.toLowerCase()}.atlassian.net`}>Open in Jira ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function JiraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.5 2L2 11.5l3 3L11.5 8 18 14.5l-3 3 3 3 9.5-9.5L11.5 2z" opacity="0.95" />
    </svg>
  );
}

Object.assign(window, { DeveloperView });
