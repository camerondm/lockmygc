"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const { publicKey, connected } = useWallet();

  const handleGenerateInvite = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your Solana wallet first.");
      return;
    }

    try {
      // Check if the token address exists in the database
      const { data, error } = await supabase
        .from("chats")
        .select("minimum_token_count")
        .eq("token_id", tokenAddress)
        .single();

      if (error || !data) {
        setError("Token address not found in the database.");
        return;
      }

      // Check if the user holds the minimum number of tokens
      const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_RPC_URL!
      );
      const tokenAccountInfo = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: new PublicKey(tokenAddress) }
      );

      const tokenBalance =
        tokenAccountInfo.value[0]?.account.data.parsed.info.tokenAmount
          .uiAmount || 0;

      if (tokenBalance < data.minimum_token_count) {
        setError(
          `You don't have enough tokens. Minimum required: ${data.minimum_token_count}`
        );
        return;
      }

      // Generate invite link
      const generatedLink = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=${tokenAddress}`;
      setInviteLink(generatedLink);
      setError("");
    } catch (err) {
      console.error("Error generating invite:", err);
      setError("An error occurred while generating the invite link.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Telegram Bot Invite Generator</h1>
      <div className="mb-4">
        <WalletMultiButton />
      </div>
      {connected && (
        <div className="mb-4">
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Enter token address"
            className="border p-2 mr-2"
          />
          <button
            onClick={handleGenerateInvite}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Generate Invite Link
          </button>
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {inviteLink && (
        <div className="mt-4">
          <p>Invite Link:</p>
          <a
            href={inviteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            {inviteLink}
          </a>
        </div>
      )}
    </div>
  );
}
