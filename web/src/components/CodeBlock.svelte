<script>
  /** @type {{ code: string, language?: string, label?: string }} */
  let { code, language = 'html', label } = $props();
</script>

<div class="code-shell">
  <div class="code-bar">
    <span>{label || language}</span>
    <span class="dots">
      <span class="dot" style="background:#FFB985"></span>
      <span class="dot" style="background:#F3AAFF"></span>
      <span class="dot" style="background:#8DFFB7"></span>
    </span>
  </div>
  <pre><code>{code}</code></pre>
</div>

<style>
  .code-shell {
    background: var(--us-ink);
    color: var(--us-cream);
    border-radius: var(--r-md);
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: 12.5px;
    line-height: 1.6;
  }
  .code-bar {
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: var(--us-n-50);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .dots {
    display: flex;
    gap: 4px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    opacity: 0.7;
  }
  pre {
    margin: 0;
    padding: 14px 16px;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: auto;
  }
</style>
