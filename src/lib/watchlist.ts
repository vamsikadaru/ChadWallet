import type { Token } from "./types";

const KEY = "chadwallet:watchlist";

export function getWatchlist(): Token[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isWatchlisted(address: string): boolean {
  return getWatchlist().some((t) => t.address === address);
}

/** Adds or removes the token from the watchlist. Returns the new starred state. */
export function toggleWatchlist(token: Token): boolean {
  if (typeof window === "undefined") return false;
  const list = getWatchlist();
  const already = list.some((t) => t.address === token.address);
  const next = already
    ? list.filter((t) => t.address !== token.address)
    : [token, ...list];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("watchlist-change"));
  return !already;
}
