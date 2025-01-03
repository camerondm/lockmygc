"use client";

import { useState } from "react";
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
import { AlertCircle, LinkIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";

const StarField = () => {
  const stars = Array.from({ length: 100 }).map((_, i) => (
    <motion.div
      key={i}
      className="absolute rounded-full bg-white"
      style={{
        width: Math.random() * 2 + 1 + "px",
        height: Math.random() * 2 + 1 + "px",
        left: Math.random() * 100 + "%",
        top: Math.random() * 100 + "%",
      }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: Math.random() * 3 + 2,
        repeat: Infinity,
        repeatType: "loop",
      }}
    />
  ));

  return <div className="fixed inset-0 overflow-hidden">{stars}</div>;
};

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, connected } = useWallet();

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
          tokenAddress,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black overflow-hidden">
      <StarField />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-black/30 backdrop-blur-md border-gray-700 shadow-lg shadow-purple-500/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center font-mono text-blue-400">
              Telegram Bot Invite Generator
            </CardTitle>
            <CardDescription className="text-center font-mono text-gray-400">
              Connect your wallet and generate an invite link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              className="flex justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-white transition-colors font-mono" />
            </motion.div>
            {connected && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Enter token address"
                  className="bg-gray-800 border-gray-700 text-gray-100 font-mono"
                  disabled={isLoading}
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleGenerateInvite}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono"
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
                  className="bg-red-900/50 border-red-700"
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
                <Alert className="bg-green-900/50 border-green-700">
                  <LinkIcon className="h-4 w-4" />
                  <AlertTitle className="font-mono">
                    Invite Link Generated
                  </AlertTitle>
                  <AlertDescription className="font-mono">
                    <a
                      href={inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors break-all"
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
    </div>
  );
}
