import Link from "next/link";

/** The ChadWallet diamond mark (same glyph as the app icon). */
function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="55%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="logoCore" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14F195" />
          <stop offset="100%" stopColor="#9945FF" />
        </linearGradient>
        <clipPath id="logoClip">
          <rect width="280" height="280" rx="56" />
        </clipPath>
      </defs>
      <g clipPath="url(#logoClip)">
        <rect width="280" height="280" fill="#0B0B12" />
        <g transform="translate(140,140)">
          <path d="M -78 -10 L -10 -78 L 78 10 L 10 78 Z" fill="url(#logoGrad)" />
          <path d="M -44 0 L 0 -44 L 44 0 L 0 44 Z" fill="#0B0B12" />
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill="url(#logoCore)" />
        </g>
      </g>
    </svg>
  );
}

export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : "text-xl";
  const mark = size === "lg" ? 38 : 32;
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <LogoMark size={mark} />
      <span className={`font-display font-bold tracking-tight ${text}`}>
        Chad<span className="text-text-2">Wallet</span>
      </span>
    </Link>
  );
}
