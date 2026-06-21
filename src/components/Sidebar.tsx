"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/nav";
import UserChip from "./UserChip";
import Logo from "./Logo";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[248px] flex-col border-r border-border bg-bg-0/80 px-4 pb-5 pt-6 backdrop-blur-xl lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const matchPath = "match" in item ? item.match : item.href;
          const active =
            matchPath === "/"
              ? pathname === "/"
              : pathname.startsWith(matchPath);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[14px] font-medium transition-colors ${
                active
                  ? "text-text-1"
                  : "text-text-2 hover:text-text-1"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-[var(--radius-md)] border border-border"
                  style={{ background: "var(--bg-2)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon
                size={18}
                className={`relative z-10 ${active ? "text-accent" : ""}`}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <UserChip />
    </aside>
  );
}
