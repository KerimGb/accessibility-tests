<script>
  import { onMount, onDestroy } from 'svelte';
  import ScoreDonut from './ScoreDonut.svelte';
  import TrendChart from './TrendChart.svelte';

  /**
   * @type {{
   *   primaryHost: string,
   *   companyName: string,
   *   auditDate: string,
   *   scoreClamp: number,
   *   previousScore: number | null,
   *   pagesScanned: number,
   *   rulesChecked: number,
   *   trend: Array<{ date: string, score: number }>,
   *   principles: Array<{ key: string, label: string, errors: number, warnings: number, passed: number, color: string, textColor: string }>,
   *   topFixes: Array<{ rank: string, title: string, impact: string, points: number, color: string }>,
   *   coordinator?: string,
   *   coordinatorEmail?: string,
   *   legalName?: string,
   *   domain: string,
   *   runId: string,
   * }}
   */
  let {
    primaryHost,
    companyName,
    auditDate,
    scoreClamp,
    previousScore = null,
    pagesScanned,
    rulesChecked,
    trend,
    principles,
    topFixes,
    coordinator = '',
    coordinatorEmail = '',
    legalName = '',
    domain,
    runId,
  } = $props();

  const passing = $derived(scoreClamp >= 80);
  const delta = $derived(previousScore != null ? scoreClamp - previousScore : null);

  let slideIdx = $state(0);
  let totalSlides = $state(8);

  /** @type {HTMLElement | null} */
  let stageEl = null;

  function handleSlideChange(e) {
    const detail = /** @type {CustomEvent} */ (e).detail;
    slideIdx = detail.index;
    totalSlides = detail.total;
  }

  onMount(() => {
    stageEl = document.querySelector('deck-stage');
    if (stageEl) {
      stageEl.addEventListener('slidechange', handleSlideChange);
      stageEl.goTo?.(0);
    }
  });

  onDestroy(() => {
    if (stageEl) stageEl.removeEventListener('slidechange', handleSlideChange);
  });

  function gotoStatement() {
    window.location.href = `/report/${encodeURIComponent(domain)}/${encodeURIComponent(runId)}/statement`;
  }
</script>

<div data-screen-label="04 Sales - Client deck" class="deck-shell">
  <div class="deck-frame">
    <div class="deck-head">
      <div>
        <span class="eyebrow" style="color: rgba(255,255,255,0.6);"><span class="dot"></span>For the client</span>
        <h2 style="color: var(--us-cream); font-size: 28px; margin-top: 6px;">Sales-ready report · {companyName}</h2>
      </div>
      <div class="deck-controls">
        <a class="btn btn-ghost btn-sm deck-nav" href={`/report/${encodeURIComponent(domain)}/${encodeURIComponent(runId)}/`}>← Back to report</a>
        <span class="deck-pos">
          {String(slideIdx + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </span>
        <span class="deck-divider"></span>
        <button class="btn btn-ghost btn-sm deck-nav" onclick={() => window.print()}>Print / PDF</button>
        <button class="btn btn-cream btn-sm" onclick={gotoStatement}>Open statement →</button>
      </div>
    </div>

    <div class="deck-stage-wrap">
      <deck-stage style="width: 100%; height: 100%; display: block;">
        <!-- 1: cover -->
        <section data-screen-label="Slide 01 - Cover" class="slide slide-dark">
          <div aria-hidden="true" class="blob blob-iri"></div>
          <div aria-hidden="true" class="blob blob-cool"></div>
          <div class="slide-pad cover-grid">
            <div class="cover-row">
              <span class="cover-brand">
                <span class="brand-dot" style="width:32px;height:32px;"></span>
                <span style="font-size: 18px;">Us · Accessibility</span>
              </span>
              <span style="opacity: 0.5; font-size: 14px;">{auditDate}</span>
            </div>
            <div>
              <span class="eyebrow" style="color: rgba(255,255,255,0.6);"><span class="dot"></span>Accessibility audit · WCAG 2.2 AA</span>
              <h1 class="cover-title">A clear-eyed look at <em>{companyName}</em></h1>
              <p class="cover-lead">What's working, what's blocking real users, and what we'd change first.</p>
            </div>
            <div class="cover-foot">
              <div style="font-size: 14px; opacity: 0.6;">Prepared for {legalName || companyName}</div>
              <div style="font-size: 14px; opacity: 0.6;">{pagesScanned} pages · {rulesChecked} rules</div>
            </div>
          </div>
        </section>

        <!-- 2: score -->
        <section data-screen-label="Slide 02 - Score" class="slide slide-cream">
          <div class="slide-pad score-grid">
            <div>
              <span class="eyebrow"><span class="dot"></span>The bottom line</span>
              <h2 class="score-h2">Your site scores <span class="grad-text">{scoreClamp}/100</span>.</h2>
              <p class="score-p">
                {#if delta != null}
                  That's <strong>{delta >= 0 ? `+${delta}` : delta}</strong> {delta >= 0 ? 'points up from' : 'points below'} your last audit —
                {/if}
                {passing ? 'safely above' : 'short of'} the 80-point compliance target.
              </p>
              <div style="display: flex; gap: 10px;">
                {#if delta != null}
                  <span class="tag {delta >= 0 ? 'tag-success' : 'tag-error'}" style="font-size: 14px; padding: 8px 14px;">
                    {delta >= 0 ? `↑ +${delta}` : `↓ ${delta}`} since last audit
                  </span>
                {/if}
                <span class="tag tag-outline" style="font-size: 14px; padding: 8px 14px;">WCAG 2.2 AA</span>
              </div>
            </div>
            <div style="display: flex; justify-content: center;">
              <ScoreDonut score={scoreClamp} size={380} stroke={32} threshold={80} label="Compliance" />
            </div>
          </div>
        </section>

        <!-- 3: plain English -->
        <section data-screen-label="Slide 03 - Plain english" class="slide slide-white">
          <div class="slide-pad" style="display: flex; flex-direction: column; justify-content: center;">
            <span class="eyebrow"><span class="dot"></span>What this means in plain English</span>
            <h2 class="slide-h2 wide" style="margin-top: 14px; margin-bottom: 40px;">
              Roughly <em class="hl-peach">1 in 4 visitors</em> hits a real obstacle on your site.
            </h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
              <div class="plain-card" style="background: var(--us-lilac); color: var(--us-lilac-text);">
                <div class="plain-big">92%</div>
                <div class="plain-label">of screen-reader users</div>
                <div class="plain-body">encounter at least one missing alt text or unlabelled form field per session.</div>
              </div>
              <div class="plain-card" style="background: var(--us-mint); color: var(--us-mint-text);">
                <div class="plain-big">78%</div>
                <div class="plain-label">of low-vision users</div>
                <div class="plain-body">hit unreadable text — body copy on cream backgrounds drops below WCAG contrast.</div>
              </div>
              <div class="plain-card" style="background: var(--us-sky); color: var(--us-sky-text);">
                <div class="plain-big">64%</div>
                <div class="plain-label">of keyboard-only users</div>
                <div class="plain-body">get stuck on the size selector at checkout — they can't add to cart.</div>
              </div>
            </div>
            <p class="muted" style="font-size: 12px; margin-top: 20px;"><em>Sample numbers — TODO: derive from real disability stats.</em></p>
          </div>
        </section>

        <!-- 4: principles -->
        <section data-screen-label="Slide 04 - Principles" class="slide slide-cream">
          <div class="slide-pad" style="display: flex; flex-direction: column; justify-content: center;">
            <span class="eyebrow"><span class="dot"></span>The four pillars · WCAG POUR</span>
            <h2 class="slide-h2" style="margin-top: 14px; margin-bottom: 40px;">How you score on each pillar</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
              {#each principles as p (p.key)}
                {@const total = p.errors + p.warnings + p.passed}
                {@const pct = total > 0 ? Math.round((p.passed / total) * 100) : 0}
                <div class="principle-card" style="background: {p.color}; color: {p.textColor};">
                  <div>
                    <div class="principle-pct">{pct}%</div>
                    <div class="principle-pct-label">pass rate</div>
                  </div>
                  <div>
                    <div class="principle-name">{p.label}</div>
                    <div class="principle-meta">{p.errors} errors · {p.warnings} warnings</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <!-- 5: top fixes -->
        <section data-screen-label="Slide 05 - Top fixes" class="slide slide-white">
          <div class="slide-pad" style="display: flex; flex-direction: column; justify-content: center;">
            <span class="eyebrow"><span class="dot"></span>Where to start</span>
            <h2 class="slide-h2" style="margin-top: 14px; margin-bottom: 40px;">Three fixes for big impact</h2>
            <div style="display: flex; flex-direction: column; gap: 18px;">
              {#each topFixes.slice(0, 3) as f, i (i)}
                <div class="fix-card">
                  <div class="fix-rank" style="background: {f.color};">{f.rank || String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <div class="fix-title">{f.title}</div>
                    <div class="fix-impact">{f.impact}</div>
                  </div>
                  <span class="tag tag-ink" style="font-size: 14px; padding: 8px 14px;">{f.points} story points</span>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <!-- 6: trend -->
        <section data-screen-label="Slide 06 - Trend" class="slide slide-cream">
          <div class="slide-pad trend-grid">
            <div>
              <span class="eyebrow"><span class="dot"></span>Score trend</span>
              <h2 class="slide-h2" style="margin-top: 14px; margin-bottom: 22px;">You're trending up — let's keep going.</h2>
              {#if delta != null}
                <p class="trend-p">
                  Score moved by <strong>{delta >= 0 ? `+${delta}` : delta}</strong> since the previous audit.
                </p>
              {/if}
            </div>
            <div class="trend-card">
              <TrendChart data={trend} width={620} height={320} />
            </div>
          </div>
        </section>

        <!-- 7: next steps -->
        <section data-screen-label="Slide 07 - Next steps" class="slide slide-dark">
          <div aria-hidden="true" class="blob blob-iri-mid"></div>
          <div class="slide-pad" style="position: relative; display: flex; flex-direction: column; justify-content: center;">
            <span class="eyebrow" style="color: rgba(255,255,255,0.6);"><span class="dot"></span>What's next</span>
            <h2 class="slide-h2 next-h2">A two-week sprint, eight tickets, one big leap forward.</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1000px;">
              <div class="next-card"><div class="next-num">01</div><div class="next-title">This week</div><div class="next-body">Sign off the sprint and assign tickets.</div></div>
              <div class="next-card"><div class="next-num">02</div><div class="next-title">Weeks 1–2</div><div class="next-body">Frontend ships fixes, design audits color tokens.</div></div>
              <div class="next-card"><div class="next-num">03</div><div class="next-title">Week 3</div><div class="next-body">Re-audit and publish the updated statement.</div></div>
            </div>
            {#if coordinator || coordinatorEmail}
              <div style="margin-top: 60px; display: flex; gap: 14px; align-items: center;">
                <span class="btn btn-grad btn-lg">Approve sprint →</span>
                <span style="opacity: 0.6; font-size: 14px;">Or contact <strong style="color: var(--us-cream);">{coordinator}</strong> · {coordinatorEmail}</span>
              </div>
            {/if}
          </div>
        </section>

        <!-- 8: closing -->
        <section data-screen-label="Slide 08 - Closing" class="slide slide-cream">
          <div class="slide-pad closing-pad">
            <div class="brand-dot" style="width: 80px; height: 80px; margin-bottom: 32px;"></div>
            <h2 class="closing-h2">
              Let's make it work for <em class="grad-text">everyone.</em>
            </h2>
            <p class="closing-lead">
              Questions? Reach out — we'll walk through the report with your team.
            </p>
            <div style="margin-top: 40px; font-size: 14px; color: var(--fg-3);">
              Us Agency · Accessibility practice · 2026
            </div>
          </div>
        </section>
      </deck-stage>
    </div>
  </div>
</div>

<style>
  .deck-shell {
    background: var(--us-ink);
    min-height: calc(100vh - 65px);
    padding: 32px 32px 80px;
  }
  .deck-frame {
    max-width: 1280px;
    margin: 0 auto;
  }
  .deck-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    color: var(--us-cream);
    flex-wrap: wrap;
    gap: 12px;
  }
  .deck-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .deck-nav {
    color: var(--us-cream);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .deck-pos {
    color: var(--us-cream);
    font-family: var(--font-mono);
    font-size: 13px;
    opacity: 0.7;
    min-width: 60px;
    text-align: center;
  }
  .deck-divider {
    width: 1px;
    height: 22px;
    background: rgba(255, 255, 255, 0.2);
    margin: 0 6px;
  }
  .deck-stage-wrap {
    position: relative;
    border-radius: var(--r-lg);
    overflow: hidden;
    box-shadow: var(--shadow-pop);
    background: var(--us-cream);
    aspect-ratio: 16 / 9;
  }
  .slide {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    font-family: var(--font-body);
  }
  .slide-dark {
    background: var(--us-ink);
    color: var(--us-cream);
  }
  .slide-cream {
    background: var(--us-cream);
  }
  .slide-white {
    background: var(--us-white);
  }
  .slide-pad {
    padding: 96px;
    height: 100%;
    box-sizing: border-box;
  }
  .blob {
    position: absolute;
    border-radius: 50%;
  }
  .blob-iri {
    top: -80px;
    right: -60px;
    width: 480px;
    height: 480px;
    background: var(--us-grad-iridescent);
    opacity: 0.5;
    filter: blur(40px);
  }
  .blob-cool {
    bottom: -100px;
    left: -80px;
    width: 360px;
    height: 360px;
    background: var(--us-grad-cool);
    opacity: 0.4;
    filter: blur(50px);
  }
  .blob-iri-mid {
    top: -100px;
    left: 30%;
    width: 520px;
    height: 520px;
    background: var(--us-grad-iridescent);
    opacity: 0.35;
    filter: blur(50px);
  }
  .cover-grid {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cover-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--us-cream);
  }
  .cover-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-display);
    font-weight: 700;
  }
  .cover-title {
    color: var(--us-cream);
    font-size: 96px;
    line-height: 0.95;
    margin-top: 18px;
    margin-bottom: 20px;
  }
  .cover-title em {
    font-style: normal;
    background: var(--us-grad-iridescent);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .cover-lead {
    font-size: 24px;
    opacity: 0.75;
    max-width: 760px;
    line-height: 1.4;
  }
  .cover-foot {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    color: var(--us-cream);
  }
  .score-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }
  .score-h2 {
    font-size: 80px;
    margin-top: 14px;
    margin-bottom: 22px;
    line-height: 0.98;
  }
  .grad-text {
    background: var(--us-grad-iridescent);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .score-p {
    font-size: 22px;
    color: var(--fg-2);
    line-height: 1.5;
    margin-bottom: 26px;
  }
  .slide-h2 {
    font-size: 64px;
  }
  .slide-h2.wide {
    max-width: 1100px;
  }
  .hl-peach {
    font-style: normal;
    background: var(--us-peach);
    padding: 0 12px;
    border-radius: 12px;
  }
  .plain-card {
    padding: 28px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 240px;
  }
  .plain-big {
    font-family: var(--font-display);
    font-size: 72px;
    font-weight: 700;
    line-height: 1;
  }
  .plain-label {
    font-weight: 600;
    font-size: 18px;
  }
  .plain-body {
    font-size: 16px;
    opacity: 0.85;
    line-height: 1.4;
  }
  .principle-card {
    padding: 28px;
    border-radius: 20px;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .principle-pct {
    font-family: var(--font-display);
    font-size: 64px;
    font-weight: 700;
    line-height: 1;
  }
  .principle-pct-label {
    font-size: 13px;
    margin-top: 6px;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }
  .principle-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 28px;
    margin-bottom: 6px;
  }
  .principle-meta {
    font-size: 14px;
    opacity: 0.85;
  }
  .fix-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 28px;
    padding: 20px 28px;
    background: var(--us-cream);
    border-radius: 18px;
    align-items: center;
  }
  .fix-rank {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 24px;
  }
  .fix-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 26px;
  }
  .fix-impact {
    font-size: 16px;
    color: var(--fg-2);
    margin-top: 4px;
  }
  .trend-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 60px;
    align-items: center;
  }
  .trend-p {
    font-size: 22px;
    color: var(--fg-2);
    line-height: 1.5;
    margin-bottom: 28px;
  }
  .trend-card {
    background: var(--us-white);
    padding: 32px;
    border-radius: 24px;
    box-shadow: var(--shadow-card);
  }
  .next-h2 {
    color: var(--us-cream);
    font-size: 80px;
    margin-top: 14px;
    margin-bottom: 40px;
    max-width: 1100px;
  }
  .next-card {
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.03);
    color: var(--us-cream);
  }
  .next-num {
    font-family: var(--font-mono);
    font-size: 12px;
    opacity: 0.5;
    letter-spacing: 0.08em;
  }
  .next-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 24px;
    margin-top: 6px;
    margin-bottom: 8px;
  }
  .next-body {
    font-size: 15px;
    opacity: 0.7;
    line-height: 1.4;
  }
  .closing-pad {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .closing-h2 {
    font-size: 96px;
    line-height: 0.95;
    margin-bottom: 24px;
    max-width: 1100px;
  }
  .closing-lead {
    font-size: 22px;
    color: var(--fg-2);
    max-width: 780px;
    line-height: 1.5;
  }
</style>
