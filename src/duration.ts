/**
 * Parse a duration string (e.g. "2s", "3m", "20m") into seconds.
 * Supports: s (seconds), m (minutes), h (hours).
 */
export function parseDurationToSeconds(value: string): number {
  const s = value.trim();
  const match = s.match(/^(\d+)(s|m|h)$/i);
  if (!match) {
    throw new Error(`Invalid duration "${value}". Use e.g. 2s, 3m, 20m.`);
  }
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}
