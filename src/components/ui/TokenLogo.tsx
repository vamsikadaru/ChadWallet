"use client";

import { useState } from "react";
import { colorFromString } from "@/lib/format";

/** Token logo with graceful fallback to a colored circle + first letter. */
export default function TokenLogo({
  src,
  symbol,
  size = 40,
  className = "",
}: {
  src?: string;
  symbol: string;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;

  if (showFallback) {
    return (
      <div
        className={`flex items-center justify-center rounded-full font-display font-bold text-white select-none ${className}`}
        style={{
          width: size,
          height: size,
          background: colorFromString(symbol),
          fontSize: size * 0.4,
        }}
        aria-label={symbol}
      >
        {symbol.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      onError={() => setErrored(true)}
      className={`rounded-full object-cover bg-bg-2 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
