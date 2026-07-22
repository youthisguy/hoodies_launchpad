import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "./contexts/WalletContext";
import WalletConnection from "./components/WalletConnection";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "HOODIE LAUNCHPAD",
  description: "Hoodie token launchpad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
          <head>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="b6cb255b-18bb-4aea-9480-178831be87b5"
        />
      </head>
      <Analytics />
      <body className="antialiased bg-[#0a0a0f]">
        <WalletProvider>
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#F1EBDC] backdrop-blur-xl border-b border-zinc-800/50">
              <div className="mx-5 flex items-center justify-between py-4">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  {/* Logo image */}
                  <img
                    src="/mascotgreen.png"
                    alt="HOODIE"
                    className="h-10 w-10 object-contain"
                  />
 
                </div>

                {/* Right side — network pill + wallet */}
                <div className="flex items-center gap-3">
                  <WalletConnection />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
