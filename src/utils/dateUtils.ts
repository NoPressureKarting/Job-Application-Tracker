export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  let date: Date;
  if (parts.length === 3) {
    date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    date = new Date(dateStr);
  }
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRelativeDayDifference(targetDateStr: string): number {
  // Returns negative if past (overdue), 0 if today, positive if in future
  const todayStr = getTodayString();
  if (targetDateStr === todayStr) return 0;

  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const [dY, dM, dD] = targetDateStr.split('-').map(Number);

  const today = new Date(tY, tM - 1, tD);
  const target = new Date(dY, dM - 1, dD);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getUrgencyBadge(targetDateStr: string, completed: boolean = false): {
  label: string;
  colorClass: string;
  urgency: 'overdue' | 'today' | 'soon' | 'future' | 'done';
} {
  if (completed) {
    return {
      label: 'Completed',
      colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      urgency: 'done',
    };
  }

  const diff = getRelativeDayDifference(targetDateStr);

  if (diff < 0) {
    const daysAgo = Math.abs(diff);
    return {
      label: `${daysAgo}d Overdue`,
      colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold',
      urgency: 'overdue',
    };
  } else if (diff === 0) {
    return {
      label: 'Due Today',
      colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/40 font-semibold animate-pulse',
      urgency: 'today',
    };
  } else if (diff === 1) {
    return {
      label: 'Due Tomorrow',
      colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      urgency: 'soon',
    };
  } else if (diff <= 7) {
    return {
      label: `In ${diff} days`,
      colorClass: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
      urgency: 'soon',
    };
  } else {
    return {
      label: formatDate(targetDateStr),
      colorClass: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
      urgency: 'future',
    };
  }
}
