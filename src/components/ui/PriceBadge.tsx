import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatPct } from "@/lib/format";

/** +4.21% -> green pill, -2.1% -> red pill. Mono font, tabular. */
export default function PriceBadge({
  value,
  size = "sm",
  showArrow = true,
  className = "",
}: {
  value: number;
  size?: "sm" | "md";
  showArrow?: boolean;
  className?: string;
}) {
  const up = value >= 0;
  const pad = size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-[11px]";
  const icon = size === "md" ? 14 : 12;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] font-mono font-medium ${pad} ${className}`}
      style={{
        color: up ? "var(--success)" : "var(--danger)",
        background: up ? "rgba(20,241,149,0.10)" : "rgba(255,75,75,0.10)",
      }}
    >
      {showArrow &&
        (up ? <ArrowUpRight size={icon} /> : <ArrowDownRight size={icon} />)}
      {formatPct(value)}
    </span>
  );
}
