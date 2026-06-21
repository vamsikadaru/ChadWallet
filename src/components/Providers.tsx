"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
  const isValidAppId = appId && appId.length > 10 && appId !== "your_privy_app_id";

  if (!isValidAppId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5 text-center">
        <div
          className="glass max-w-md space-y-4 p-8"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <h2 className="font-display text-xl font-bold text-danger">
            Missing Privy App ID
          </h2>
          <p className="text-text-2">
            Add your Privy App ID to{" "}
            <code className="rounded bg-bg-2 px-2 py-1 font-mono text-sm text-accent">
              .env.local
            </code>{" "}
            to run the application.
          </p>
          <p className="text-sm text-text-3">
            Get one free at{" "}
            <a
              href="https://dashboard.privy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline transition-colors hover:opacity-80"
            >
              dashboard.privy.io
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet", "google", "apple"],
        appearance: {
          theme: "dark",
          accentColor: "#9945FF",
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
