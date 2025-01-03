"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { AlertCircle, LinkIcon, Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";

import FuturisticBackground from "./components/Background";
import HowItWorks from "./components/HowItWorks";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (id) {
      fetchTokenId(id);
    }
  }, []);

  const fetchTokenId = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("token_id")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Failed to fetch token ID.");
        return;
      }

      setTokenAddress(data.token_id);
    } catch (err) {
      console.error("Error fetching token ID:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleGenerateInvite = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your Solana wallet first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setInviteLink("");

    try {
      const response = await fetch("/api/validate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          groupId: tokenAddress,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Token validation failed.");
        return;
      }

      const generatedInviteLink = await generateInviteLink(result.chat_id);
      if (generatedInviteLink) {
        setInviteLink(generatedInviteLink);
      }
    } catch (err) {
      console.error("Error validating token:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openTelegramBot = () => {
    window.open("https://t.me/lockmygc_bot", "_blank");
  };

  const generateInviteLink = async (chatId: string) => {
    try {
      const response = await fetch("/api/generate-tg-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to generate invite link.");
        return "";
      }

      return result.inviteLink;
    } catch (err) {
      console.error("Error generating invite link:", err);
      setError("Failed to generate invite link. Please try again.");
      return "";
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden text-purple-50">
      <FuturisticBackground />
      <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto mb-12"
        >
          <Card className="bg-purple-900/30 backdrop-blur-md border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center font-mono text-purple-100">
                Lock My GC
              </CardTitle>
              <CardDescription className="text-center font-mono text-purple-200">
                Lock your group chat to only holders of your token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center space-x-4 items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <WalletMultiButton className="!bg-purple-700 hover:!bg-purple-600 !text-purple-50 transition-colors font-mono" />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={openTelegramBot}
                    className="bg-[#0088cc] hover:bg-[#0077b5] text-white font-mono flex items-center rounded-[4px] text-base py-6 px-6"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Open Bot
                  </Button>
                </motion.div>
              </div>
              {connected && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {tokenAddress && <p>{tokenAddress}</p>}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleGenerateInvite}
                      className="w-full bg-purple-700 hover:bg-purple-600 text-purple-50 font-mono"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Invite Link"
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Alert
                    variant="destructive"
                    className="bg-red-900/50 border-red-700/50 text-red-500"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-mono">Error</AlertTitle>
                    <AlertDescription className="font-mono">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {inviteLink && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Alert className="bg-green-900/50 border-green-700/50">
                    <LinkIcon className="h-4 w-4" />
                    <AlertTitle className="font-mono">
                      Invite Link Generated
                    </AlertTitle>
                    <AlertDescription className="font-mono">
                      <a
                        href={inviteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-200 hover:text-purple-100 transition-colors break-all"
                      >
                        {inviteLink}
                      </a>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Sections */}
        <div className="space-y-16 mt-16">
          <HowItWorks />
        </div>
      </div>
    </div>
  );
}
