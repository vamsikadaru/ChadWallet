"use client";

import { usePrivy } from "@privy-io/react-auth";
import { LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";
import { truncateAddress, colorFromString } from "@/lib/format";
import { useSolanaWallet } from "@/lib/solana";

export default function UserChip({ compact = false }: { compact?: boolean }) {
  const { user, logout } = usePrivy();
  const { address: solAddress } = useSolanaWallet();
  const [copied, setCopied] = useState(false);

  const address = solAddress ?? user?.wallet?.address;
  const label = user?.email?.address ?? user?.google?.email ?? "Wallet";

  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg-1 p-2.5 ${
        compact ? "" : "w-full"
      }`}
    >
      <div
        className="h-9 w-9 shrink-0 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${colorFromString(
            address ?? label
          )}, var(--accent))`,
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-text-1">{label}</div>
        <button
          onClick={copy}
          className="flex items-center gap-1 font-mono text-[11px] text-text-2 transition-colors hover:text-text-1"
        >
          {truncateAddress(address, 4, 4)}
          {copied ? (
            <Check size={11} className="text-success" />
          ) : (
            <Copy size={11} />
          )}
        </button>
      </div>
      <button
        onClick={logout}
        aria-label="Disconnect"
        className="rounded-[var(--radius-sm)] p-2 text-text-2 transition-colors hover:bg-bg-2 hover:text-danger"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
