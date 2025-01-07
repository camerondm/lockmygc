"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { AlertCircle, Copy, LinkIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import Image from "next/image";
import FuturisticBackground from "./components/Background";
import HowItWorks from "./components/HowItWorks";
import { createClient } from "@supabase/supabase-js";
import { Navbar } from "./components/Navbar";
import RainbowConnectButton from "./components/RainbowConnectButton";
import SolanaConnectButton from "./components/SolanaConnectButton";
import { useAccount } from "wagmi";

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
  const { address: baseAddress } = useAccount();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [minimumTokenCount, setMinimumTokenCount] = useState(0);
  const [addressType, setAddressType] = useState<"base" | "solana">("base");

  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

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
        .select("token_id, minimum_token_count, name, image_url, description")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError(
          "Failed to fetch token ID. Are you sure you have the correct URL?"
        );
        return;
      }

      setTokenAddress(data.token_id);
      setMinimumTokenCount(data.minimum_token_count);
      setAddressType(data.token_id.startsWith("0x") ? "base" : "solana");
      setGroupName(data.name);
      setGroupImage(data.image_url);
      setGroupDescription(data.description);
    } catch (err) {
      console.error("Error fetching token ID:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleGenerateInvite = async () => {
    let walletAddress;
    if (addressType === "solana") {
      if (!connected || !publicKey) {
        setError("Please connect your Solana wallet first.");
        return;
      }
      walletAddress = publicKey.toString();
    } else {
      if (!baseAddress) {
        setError("Please connect your Base wallet first.");
        return;
      }
      walletAddress = baseAddress;
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
      setIsLoading(false);
      setError("");
      return;
    }

    try {
      const response = await fetch("/api/validate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
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
        tokenId,
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

  const copyToClipboard = async (textToCopy: string) => {
    if (typeof ClipboardItem && navigator.clipboard.write) {
      // this solution works for both chrome and safari
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/plain": new Promise((resolve) => {
              resolve(new Blob([textToCopy], { type: "text/plain" }));
            }),
          }),
        ])
        .then(() => {
          alert("Address copied to clipboard!");
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      // this solution works for firefox
      navigator.clipboard.writeText(textToCopy);
      alert("Address copied to clipboard!");
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
          <Card className="bg-purple-900/30 backdrop-blur-md border-purple-500/30 relative">
            {groupImage?.length > 0 && (
              <div className="flex justify-center items-center w-full h-full -z-10 absolute top-0 left-0 opacity-25">
                <Image
                  src={
                    process.env.NEXT_PUBLIC_SUPABASE_URL! +
                    `/storage/v1/object/public/${groupImage}`
                  }
                  alt={groupName}
                  fill
                  className="object-cover backdrop-blur-sm"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center font-mono text-purple-100">
                {groupName?.length > 0 ? groupName : "Lock My GC"}
              </CardTitle>
              <CardDescription className="text-center font-mono text-purple-200">
                {groupDescription?.length > 0
                  ? groupDescription
                  : "Lock your group chat to only holders of your token"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row justify-center gap-2 items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SolanaConnectButton />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RainbowConnectButton />
                </motion.div>
              </div>

              {tokenMetadata && addressType === "solana" && (
                <motion.div
                  className="space-y-4 bg-purple-900/30 backdrop-blur-md border-purple-500/30 rounded-lg p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex flex-col items-center gap-2 ">
                    <div className="flex flex-row items-center gap-2">
                      <Image
                        src={tokenMetadata.content.links.image}
                        alt={tokenMetadata.content.metadata.name}
                        width={36}
                        height={36}
                        className="rounded-xl"
                      />
                      <p className="text-purple-50 font-mono text-sm">
                        You&apos;ll need at least{" "}
                        <span className="font-bold">
                          {minimumTokenCount}{" "}
                          {tokenMetadata.content.metadata.name}
                        </span>{" "}
                        to join this group
                      </p>
                    </div>
                    {!connected && (
                      <p className="text-purple-50 font-mono text-xs">
                        Connect your wallet to check your balance.
                      </p>
                    )}
                    <button
                      onClick={() => {
                        copyToClipboard(tokenAddress);
                      }}
                      className="flex flex-row items-center gap-2"
                    >
                      <pre className="bg-purple-900/30 backdrop-blur-md border-purple-500/30 rounded-md p-2 text-xs overflow-ellipsis">
                        {tokenAddress.slice(0, 20)}...
                      </pre>
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
              {tokenMetadata && addressType === "base" && (
                <motion.div
                  className="space-y-4 bg-purple-900/30 backdrop-blur-md border-purple-500/30 rounded-lg p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex flex-col items-center gap-2 ">
                    <div className="flex flex-row items-center gap-2">
                      {tokenMetadata.logo && (
                        <Image
                          src={tokenMetadata.logo}
                          alt={tokenMetadata.name}
                          width={36}
                          height={36}
                          className="rounded-xl"
                        />
                      )}
                      <p className="text-purple-50 font-mono text-sm">
                        You&apos;ll need at least{" "}
                        <span className="font-bold">
                          {minimumTokenCount} {tokenMetadata.name}
                        </span>{" "}
                        to join this group
                      </p>
                    </div>
                    {!connected && (
                      <p className="text-purple-50 font-mono text-xs">
                        Connect your wallet to check your balance.
                      </p>
                    )}
                    <button
                      onClick={() => {
                        copyToClipboard(tokenAddress);
                      }}
                      className="flex flex-row items-center gap-2"
                    >
                      <pre className="bg-purple-900/30 backdrop-blur-md border-purple-500/30 rounded-md p-2 text-xs overflow-ellipsis">
                        {tokenAddress.slice(0, 20)}...
                      </pre>
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {(baseAddress || connected) && (
                <>
                  {/* divider */}
                  <div className="w-full h-[1px] bg-purple-500/30"></div>
                  {tokenMetadata ? (
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
                  ) : (
                    <motion.div>
                      <div className="w-full bg-purple-700/50 text-purple-50 font-mono p-4 text-sm rounded-xl">
                        You&apos;re not on a link for a group yet. Check your
                        url for an id.
                      </div>
                    </motion.div>
                  )}
                </>
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
