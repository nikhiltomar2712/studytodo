/**
 * StudyFlow — small date/format helpers (local time).
 */

export const DAY_MS = 24 * 60 * 60_000;

/** Local YYYY-MM-DD key used for activity maps. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns the last `n` day keys ending today (oldest first). */
export function lastNDayKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getTime() - i * DAY_MS)));
  }
  return keys;
}

/** mm:ss from milliseconds. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** e.g. "3m 24s" or "1h 12m" for a duration in ms. */
export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** e.g. "14:35" */
export function formatTime(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** e.g. "Jun 12" */
export function formatShortDate(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** e.g. "Mon 3" used for the week strip. */
export function weekdayLabel(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return date.toLocaleDateString([], { weekday: "short" }).slice(0, 3);
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
