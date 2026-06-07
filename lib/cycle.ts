/**
 * Billing cycle windows — anchored to a fixed start or rolling from reset day.
 */

export interface CycleWindow {
  start: Date;
  end: Date;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
}

/** Mirror of SQL cycle_start_for_day — start of the current period for a reset day. */
export function getCycleStartForDay(cycleStartDay: number, now = new Date()): Date {
  const day = now.getDate();
  let startMonth = now.getMonth();
  let startYear = now.getFullYear();

  if (day < cycleStartDay) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  return new Date(startYear, startMonth, cycleStartDay, 0, 0, 0, 0);
}

/** Rolling window containing `now` (legacy / display helpers). */
export function getCycleWindow(cycleStartDay: number, now = new Date()): CycleWindow {
  const start = getCycleStartForDay(cycleStartDay, now);
  return windowFromStart(start, now, cycleStartDay);
}

/** Fixed cycle window from a stored start timestamp. */
export function getAnchoredCycleWindow(cycleStartAt: string | Date, cycleStartDay: number, now = new Date()): CycleWindow {
  const start = new Date(cycleStartAt);
  const end = getCycleEndFromStart(cycleStartAt, cycleStartDay);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysTotal = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1);
  const daysElapsed = Math.max(1, Math.round((now.getTime() - start.getTime()) / msPerDay) + 1);
  const daysRemaining = Math.max(0, daysTotal - daysElapsed + 1);

  return { start, end, daysTotal, daysElapsed, daysRemaining };
}

export function getCycleEndFromStart(cycleStartAt: string | Date, cycleStartDay: number): Date {
  const anchor = new Date(cycleStartAt);
  const endRaw = new Date(anchor.getFullYear(), anchor.getMonth() + 1, cycleStartDay, 0, 0, 0, 0);
  return new Date(endRaw.getTime() - 1);
}

export function isCycleNaturallyEnded(
  cycleStartAt: string | Date,
  cycleStartDay: number,
  now = new Date(),
): boolean {
  return now.getTime() > getCycleEndFromStart(cycleStartAt, cycleStartDay).getTime();
}

function windowFromStart(start: Date, now: Date, cycleStartDay?: number): CycleWindow {
  const day = cycleStartDay ?? start.getDate();
  const endRaw = new Date(start.getFullYear(), start.getMonth() + 1, day, 0, 0, 0, 0);
  const end = new Date(endRaw.getTime() - 1);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysTotal = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
  const daysElapsed = Math.max(1, Math.round((now.getTime() - start.getTime()) / msPerDay) + 1);
  const daysRemaining = Math.max(0, daysTotal - daysElapsed + 1);

  return { start, end, daysTotal, daysElapsed, daysRemaining };
}

/** True if occurred_at falls inside the given cycle window. */
export function inCycle(occurredAt: string | Date, window: CycleWindow): boolean {
  const d = new Date(occurredAt);
  return d >= window.start && d <= window.end;
}

/** Exclude transactions already counted in the most recently closed cycle. */
export function isAfterPreviousCycle(
  occurredAt: string | Date,
  previousCycleEndAt: string | null | undefined,
): boolean {
  if (!previousCycleEndAt) return true;
  return new Date(occurredAt).getTime() > new Date(previousCycleEndAt).getTime();
}

export function filterTransactionsInActiveCycle<T extends { occurred_at: string }>(
  transactions: T[],
  partnership: {
    cycle_active: boolean;
    current_cycle_start_at: string | null;
    cycle_start_day: number;
  } | null,
  previousCycleEndAt?: string | null,
): T[] {
  if (!partnership?.cycle_active) return [];
  const window = partnership.current_cycle_start_at
    ? getAnchoredCycleWindow(partnership.current_cycle_start_at, partnership.cycle_start_day)
    : getCycleWindow(partnership.cycle_start_day);
  return transactions.filter(
    (tx) => inCycle(tx.occurred_at, window) && isAfterPreviousCycle(tx.occurred_at, previousCycleEndAt),
  );
}

export function fmtCycleDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
