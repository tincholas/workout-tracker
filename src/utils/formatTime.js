/**
 * Format a duration in seconds as "Xm Ys".
 * Examples: 90 → "1m 30s", 3600 → "60m 0s", 45 → "0m 45s"
 */
export function fmtSeconds(totalSeconds) {
    const s = Math.round(totalSeconds || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
}
