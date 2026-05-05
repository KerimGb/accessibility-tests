// main.jsx — app shell, domain-aware routing, tweaks

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "threshold": 80,
  "wcagVersion": "2.2 AA",
  "showSeverity": "all",
  "devView": true
}/*EDITMODE-END*/;

// Hash format:
//   #/                       → home (new audit form)
//   #/<domain>               → history landing for that domain
//   #/<domain>/<route>       → specific page within that domain's audit
const ROUTES = ["loading","results","sales","statement","developer"];

function parseHash() {
  const h = (window.location.hash || "").replace(/^#\/?/, "");
  if (!h) return { domain: null, route: "home" };
  const parts = h.split("/").filter(Boolean);
  if (parts.length === 1) return { domain: parts[0], route: "history" };
  return { domain: parts[0], route: ROUTES.includes(parts[1]) ? parts[1] : "history" };
}

function buildHash(domain, route) {
  if (!domain) return "#/";
  if (route === "history") return `#/${domain}`;
  return `#/${domain}/${route}`;
}

function App() {
  const initial = parseHash();
  const [domain, setDomain] = useState(initial.domain);
  const [route, setRoute] = useState(initial.route);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Sync URL hash both ways
  useEffect(() => {
    const onHash = () => {
      const p = parseHash();
      setDomain(p.domain); setRoute(p.route);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const target = buildHash(domain, route);
    if (window.location.hash !== target) window.location.hash = target;
  }, [domain, route]);

  // Helpers ──────────────────────────────────────────────
  const navTo = (r) => setRoute(r);
  const goHome = () => { setDomain(null); setRoute("home"); };
  const startAudit = ({ company }) => {
    // derive domain from website URL field
    let d = "northstar-outdoor.com";
    try {
      const u = new URL(company.website);
      d = u.hostname.replace(/^www\./, "");
    } catch (e) {}
    setDomain(d);
    setRoute("loading");
  };
  const completeAudit = () => setRoute("results");
  const openHistoryForDomain = (d) => { setDomain(d); setRoute("history"); };

  const hasAudit = !!domain;

  return (
    <div className="app-shell">
      <AppHeader
        route={route}
        setRoute={navTo}
        hasAudit={hasAudit}
        domain={domain}
        goHome={goHome}
      />
      <main className="app-main">
        {route === "home"      && <HomeView onSubmit={startAudit} onPickRecent={openHistoryForDomain} />}
        {route === "history"   && <HistoryView domain={domain} onOpenAudit={() => setRoute("results")} onNewAudit={() => setRoute("loading")} />}
        {route === "loading"   && <LoadingView onComplete={completeAudit} />}
        {route === "results"   && <ResultsView tweaks={tweaks} setRoute={navTo} domain={domain} />}
        {route === "sales"     && <SalesView setRoute={navTo} />}
        {route === "statement" && <StatementView setRoute={navTo} />}
        {route === "developer" && <DeveloperView setRoute={navTo} />}
      </main>

      <TweaksPanel>
        <TweakSection label="Compliance" />
        <TweakSlider label="Pass threshold" value={tweaks.threshold}
          min={50} max={100} step={5} unit="/100"
          onChange={(v) => setTweak("threshold", v)} />
        <TweakSelect label="WCAG version" value={tweaks.wcagVersion}
          options={["2.0 AA", "2.1 AA", "2.2 AA"]}
          onChange={(v) => setTweak("wcagVersion", v)} />

        <TweakSection label="Results display" />
        <TweakRadio label="Severity filter" value={tweaks.showSeverity}
          options={["all", "errors", "warnings"]}
          onChange={(v) => setTweak("showSeverity", v)} />
        <TweakToggle label="Show developer view" value={tweaks.devView}
          onChange={(v) => setTweak("devView", v)} />

        <TweakSection label="Jump to" />
        <TweakButton label="Audit setup" onClick={goHome} />
        <TweakButton label="Domain history" onClick={() => openHistoryForDomain("northstar-outdoor.com")} />
        <TweakButton label="Loading" onClick={() => { if (!domain) setDomain("northstar-outdoor.com"); setRoute("loading"); }} />
        <TweakButton label="Results" onClick={() => { if (!domain) setDomain("northstar-outdoor.com"); setRoute("results"); }} />
        <TweakButton label="Sales deck" onClick={() => { if (!domain) setDomain("northstar-outdoor.com"); setRoute("sales"); }} />
        <TweakButton label="A11y statement" onClick={() => { if (!domain) setDomain("northstar-outdoor.com"); setRoute("statement"); }} />
        <TweakButton label="Developer" onClick={() => { if (!domain) setDomain("northstar-outdoor.com"); setRoute("developer"); }} />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
