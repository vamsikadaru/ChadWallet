/** Shimmer skeleton loader. */
export default function Skeleton({
  className = "",
  rounded = "md",
}: {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}) {
  const r = {
    sm: "rounded-[var(--radius-sm)]",
    md: "rounded-[var(--radius-md)]",
    lg: "rounded-[var(--radius-lg)]",
    full: "rounded-full",
  }[rounded];
  return <div className={`skeleton ${r} ${className}`} />;
}
