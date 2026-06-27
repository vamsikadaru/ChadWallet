import type { Metadata, Viewport } from "next";
import { Syne, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

// Syne: the display/headline font — heavy, geometric, crypto-native
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
});

// Space Grotesk: body, nav, UI chrome — clean, readable
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChadWallet — Trade Solana like a Chad",
  description:
    "A premium, non-custodial Solana trading experience. Sign in, get a wallet, trade trending tokens with zero friction.",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}
    >
      <body>
        {/*
          Early-redirect script: runs before React hydrates.
          If the user already has a Privy session, hide the page immediately
          and jump to the last trade page they visited (stored in localStorage),
          so they never see a landing/loading flash on return visits.
          The html element is always restored on non-root paths.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  document.documentElement.style.display="";
  if(location.pathname!=="/")return;
  var hasSession=false;
  try{var t=localStorage.getItem("privy:refresh_token");hasSession=typeof t==="string"&&t[0]==='"'&&t!=='"deprecated"';}
  catch(e){hasSession=/(?:^|; )privy-session=/.test(document.cookie);}
  if(!hasSession)return;
  var last=localStorage.getItem("chadwallet:last-trade");
  if(!last)return;
  document.documentElement.style.display="none";
  location.replace(last);
}catch(e){document.documentElement.style.display="";}})();`,
          }}
        />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
