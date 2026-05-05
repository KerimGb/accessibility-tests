<script>
  /** @type {{ severity: 'error' | 'warning' | 'passed' | 'notice' }} */
  let { severity } = $props();

  const map = {
    error: { cls: 'tag-error', label: 'Error', dot: 'error' },
    warning: { cls: 'tag-warning', label: 'Warning', dot: 'warning' },
    passed: { cls: 'tag-success', label: 'Passed', dot: 'success' },
    notice: { cls: 'tag-info', label: 'Notice', dot: 'notice' },
  };
  const m = $derived(map[severity] || map.notice);
</script>

<span class="tag {m.cls}"><span class="dot dot-{m.dot}"></span>{m.label}</span>
