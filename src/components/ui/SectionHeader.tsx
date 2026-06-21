import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SectionHeader({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-display text-[20px] font-semibold tracking-tight">
        {title}
      </h2>
      {action && href && (
        <Link
          href={href}
          className="caps flex items-center gap-1 text-text-2 transition-colors hover:text-text-1"
        >
          {action}
          <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
