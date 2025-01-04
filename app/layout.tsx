import "@/app/globals.css";
import { Tomorrow } from "next/font/google";
import { SolanaProvider } from "@/app/contexts/SolanaContext";
import { Metadata } from "next";
import { WagmiProviders } from "./contexts/WagmiContext";
import "@rainbow-me/rainbowkit/styles.css";

const tomorrow = Tomorrow({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-tomorrow",
});

export const metadata: Metadata = {
  title: "LockMyGC | Secure Your Group Chats",
  description:
    "LockMyGC is a powerful Telegram bot that secures your group chats with a minimum token count requirement.",
  icons: {
    icon: "/favicon-32x32.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${tomorrow.variable}`}>
      <body className="font-mono bg-background text-foreground">
        <WagmiProviders>
          <SolanaProvider>{children}</SolanaProvider>
        </WagmiProviders>
      </body>
    </html>
  );
}
