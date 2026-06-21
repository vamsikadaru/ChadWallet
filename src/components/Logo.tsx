import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : "text-xl";
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 place-items-center rounded-[10px] font-display text-[15px] font-bold text-white"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
        }}
      >
        C
      </span>
      <span className={`font-display font-bold tracking-tight ${text}`}>
        Chad<span className="text-text-2">Wallet</span>
      </span>
    </Link>
  );
}
