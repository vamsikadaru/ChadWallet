/** Shared formatting helpers — keep all number/price/time formatting consistent. */

export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  if (!isFinite(value)) return "$0.00";
  if (opts?.compact) return "$" + compact(value);
  if (Math.abs(value) > 0 && Math.abs(value) < 0.01) {
    return "$" + value.toFixed(6);
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Price that may be sub-cent (memecoins) — show enough significant digits. */
export function formatPrice(value: number): string {
  if (!isFinite(value)) return "$0.00";
  if (value === 0) return "$0.00";
  if (value < 0.000001) return "$" + value.toExponential(2);
  if (value < 0.01) return "$" + value.toFixed(6);
  if (value < 1) return "$" + value.toFixed(4);
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function compact(value: number): string {
  if (!isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e9) return (value / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return value.toFixed(2);
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function truncateAddress(addr?: string, head = 4, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

/** Relative time like "2m", "5h", "3d". */
export function relativeTime(ts: number | string | Date): string {
  const date = ts instanceof Date ? ts : new Date(ts);
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${Math.max(s, 1)}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Deterministic color from a string — used for token logo fallbacks. */
export function colorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
}
