/**
 * Sample data shapes for screens whose grouping isn't yet derived from the real audit JSON.
 * Used by the results / sales / developer screens so the prototype design works end-to-end.
 *
 * TODO: replace each function with a real derivation from the audit results.
 *  - principles: bucket fail/warn/pass counts per WCAG POUR principle.
 *  - disabilities: percent-of-pages-affected per disability bucket.
 *  - sprint: real ticket grouping from fix-order items + remediation effort.
 */

export interface PrincipleBucket {
  key: 'perceivable' | 'operable' | 'understandable' | 'robust';
  label: string;
  errors: number;
  warnings: number;
  passed: number;
  color: string;
  textColor: string;
}

export interface DisabilityBucket {
  key: string;
  label: string;
  issues: number;
  percent: number;
  icon: string;
}

export interface SprintTicket {
  id: string;
  title: string;
  points: number;
  severity: 'error' | 'warning' | 'passed' | 'notice';
  assignee: string;
}

export interface SprintBucket {
  name: string;
  duration: string;
  points: number;
  tickets: SprintTicket[];
}

/**
 * Roughly proportional split of the supplied severity counts across the four POUR principles.
 * The split is fixed (perceivable 40%, operable 30%, understandable 18%, robust 12%) until we
 * derive real groupings from the chapter / WCAG criterion mapping.
 */
export function getSamplePrinciples({
  errors,
  warnings,
  passed,
}: { errors: number; warnings: number; passed: number }): PrincipleBucket[] {
  const split = [
    { key: 'perceivable' as const, label: 'Perceivable', share: 0.4, color: 'var(--us-lilac)', textColor: 'var(--us-lilac-text)' },
    { key: 'operable' as const, label: 'Operable', share: 0.3, color: 'var(--us-mint)', textColor: 'var(--us-mint-text)' },
    { key: 'understandable' as const, label: 'Understandable', share: 0.18, color: 'var(--us-sky)', textColor: 'var(--us-sky-text)' },
    { key: 'robust' as const, label: 'Robust', share: 0.12, color: 'var(--us-pink)', textColor: 'var(--us-pink-text)' },
  ];
  return split.map((p) => ({
    key: p.key,
    label: p.label,
    errors: Math.round(errors * p.share),
    warnings: Math.round(warnings * p.share),
    passed: Math.round(passed * p.share),
    color: p.color,
    textColor: p.textColor,
  }));
}

/**
 * Sample disability impact breakdown derived from the existing disabilityStats payload (real data
 * in absolute terms) but with a static "percent-of-pages-affected" estimate.
 *
 * TODO: derive percent from per-page issue counts.
 */
export function getSampleDisabilities(disabilityStats: Record<string, number>): DisabilityBucket[] {
  const map: Array<{ key: string; label: string; icon: string; statsKey: string }> = [
    { key: 'blind', label: 'Blind / screen reader', icon: 'eye', statsKey: 'Blindness' },
    { key: 'lowvision', label: 'Low vision', icon: 'low-vision', statsKey: 'Low Vision' },
    { key: 'deaf', label: 'Deaf / hard of hearing', icon: 'audio', statsKey: 'Deafness and Hard-of-Hearing' },
    { key: 'motor', label: 'Motor / dexterity', icon: 'hand', statsKey: 'Dexterity/Motor Disabilities' },
    { key: 'cognitive', label: 'Cognitive / learning', icon: 'brain', statsKey: 'Cognitive Disabilities' },
    { key: 'seizure', label: 'Seizure / vestibular', icon: 'warning', statsKey: 'Seizure Disorders' },
  ];
  const max = Math.max(1, ...map.map((m) => disabilityStats[m.statsKey] || 0));
  return map.map((m) => {
    const issues = disabilityStats[m.statsKey] || 0;
    return {
      key: m.key,
      label: m.label,
      issues,
      percent: Math.round((issues / max) * 100),
      icon: m.icon,
    };
  });
}

/**
 * Build a sample sprint by grouping fix-order items into rough story-point bands based on the
 * remediation `effort` value. Real data → real ticket titles, but the team / point math is static.
 *
 * TODO: pull assignees from a config or the team roster API.
 */
export function getSampleSprint(
  fixOrderItems: Array<{ rule: string; status: string; effort?: number }>,
  topN = 8
): SprintBucket {
  const tickets: SprintTicket[] = fixOrderItems.slice(0, topN).map((item, idx) => {
    const points = Math.max(1, Math.min(8, item.effort ? Number(item.effort) : 3));
    const severity: SprintTicket['severity'] = item.status === 'violation' || item.status === 'fail' ? 'error' : 'warning';
    return {
      id: `ACC-${100 + idx}`,
      title: item.rule || `Fix #${idx + 1}`,
      points,
      severity,
      assignee: ['Frontend team', 'Content team', 'Design team'][idx % 3],
    };
  });
  return {
    name: 'A11y sprint',
    duration: '2 weeks',
    points: tickets.reduce((sum, t) => sum + t.points, 0),
    tickets,
  };
}
