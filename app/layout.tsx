import "@/app/globals.css";
import { IBM_Plex_Mono } from "next/font/google";
import { SolanaProvider } from "@/app/contexts/SolanaContext";
import { Metadata } from "next";

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "LockMyGC | Telegram Bot Invite Generator",
  description:
    "LockMyGC is a Telegram bot that allows you to lock your group chats with a minimum token count.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${ibmPlexMono.variable}`}>
      <body className="font-mono bg-background text-foreground">
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
