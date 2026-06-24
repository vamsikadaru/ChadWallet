/** Deterministic, fomo-style identity derived from a wallet address. */

const ADJECTIVES = [
  "Heavy", "Silly", "Brave", "Sneaky", "Lucky", "Cosmic", "Feral", "Mighty",
  "Quiet", "Wild", "Golden", "Frosty", "Rapid", "Lazy", "Noble", "Spicy",
  "Hidden", "Electric", "Jolly", "Mellow", "Rugged", "Velvet", "Atomic", "Lunar",
];
const SIZES = [
  "Above", "Below", "Small", "Tall", "Tiny", "Giant", "Swift", "Bold",
  "Calm", "Sharp", "Deep", "Pale", "Bright", "Dark", "Solar", "Hyper",
];
const ANIMALS = [
  "Aphid", "Otter", "Falcon", "Octopus", "Lynx", "Walrus", "Gecko", "Marmot",
  "Heron", "Badger", "Newt", "Panther", "Raven", "Bison", "Mantis", "Wombat",
  "Ferret", "Cobra", "Moth", "Stoat", "Tapir", "Yak", "Ibis", "Quokka",
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A stable, readable handle like "HeavyAboveAphid" for an address. */
export function handleFromAddress(address?: string): string {
  if (!address) return "Anon";
  const h = hash(address);
  const a = ADJECTIVES[h % ADJECTIVES.length];
  const b = SIZES[(h >>> 8) % SIZES.length];
  const c = ANIMALS[(h >>> 16) % ANIMALS.length];
  return `${a}${b}${c}`;
}

/** Two-stop gradient for the avatar, stable per seed. */
export function avatarGradient(seed?: string): string {
  const h = hash(seed ?? "anon");
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + ((h >>> 9) % 80)) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 70% 55%), hsl(${hue2} 75% 45%))`;
}

/** First grapheme of a label, for the avatar monogram. */
export function monogram(label?: string): string {
  const s = (label ?? "").trim();
  return s ? s[0].toUpperCase() : "◎";
}
