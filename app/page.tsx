"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
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
import { Navbar } from "./components/Navbar";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [minimumTokenCount, setMinimumTokenCount] = useState(0);

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
        .select("token_id, minimum_token_count")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Failed to fetch token ID.");
        return;
      }

      setTokenAddress(data.token_id);
      setMinimumTokenCount(data.minimum_token_count);
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
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (!id) {
      setError("No group ID found. Make sure you have the correct URL.");
      return;
    }

    // check localstorage if the user has already generated an invite link
    const hasGeneratedInvite = localStorage.getItem(`inviteLink_${id}`);
    if (hasGeneratedInvite) {
      setInviteLink(hasGeneratedInvite);
      return;
    }

    try {
      const response = await fetch("/api/validate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          groupId: id,
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
        localStorage.setItem(`inviteLink_${id}`, generatedInviteLink);
      }
    } catch (err) {
      console.error("Error validating token:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenMetadata = async (tokenId: string) => {
    const response = await fetch("/api/get-token-metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokenId: tokenId,
      }),
    });
    const result = await response.json();
    setTokenMetadata(result);
  };

  useEffect(() => {
    if (tokenAddress) {
      getTokenMetadata(tokenAddress);
    }
  }, [tokenAddress]);

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
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-16 relative z-10 flex flex-col items-center">
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
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {tokenMetadata && (
                  <div className="flex flex-col items-center gap-2">
                    <p>
                      You&apos;ll need at least {minimumTokenCount}{" "}
                      {tokenMetadata.content.metadata.name}
                    </p>
                    <p>to join this group</p>
                    <pre className="bg-purple-900/30 backdrop-blur-md border-purple-500/30 rounded-md p-2 text-xs">
                      {tokenAddress}
                    </pre>
                    {/* <pre>{JSON.stringify(tokenMetadata, null, 2)}</pre> */}
                  </div>
                )}
                {connected && (
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
                          Checking Token Balance...
                        </>
                      ) : (
                        "Check Token Balance"
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>

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
                      Invite Link Generated!
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
        <span className="text-purple-200 text-[10px] mt-2 mx-auto max-w-md flex items-center">
          This DApp can only read your token balances. It does not have any
          other access to your wallet or any write permissions. It does not
          store any data about you. Feel free to use a test wallet to preview
          permissions.
        </span>
        {/* Additional Sections */}
        <div className="space-y-16 mt-12">
          <HowItWorks />
        </div>
      </div>
    </div>
  );
}
