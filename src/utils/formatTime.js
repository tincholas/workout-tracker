/**
 * Format a duration in seconds as "Xm Ys".
 * When >= 60 minutes, formats as "Xh Ym Zs".
 * Examples: 90 → "1m 30s", 3600 → "1h 0m 0s", 45 → "0m 45s"
 */
export function fmtSeconds(totalSeconds) {
    const s = Math.round(totalSeconds || 0);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
}
