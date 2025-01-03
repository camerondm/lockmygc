import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey } from "@solana/web3.js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, tokenAddress } = await req.json();

    if (!walletAddress || !tokenAddress) {
      return NextResponse.json(
        { error: "Wallet address and token address are required." },
        { status: 400 }
      );
    }

    // Query Supabase to get the minimum token count and chat_id
    const { data, error } = await supabase
      .from("chats")
      .select("minimum_token_count, chat_id")
      .eq("token_id", tokenAddress)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Token address not found in the database." },
        { status: 404 }
      );
    }

    const { minimum_token_count, chat_id } = data;

    // Use Helius RPC to check the user's token balance
    const connection = new Connection(process.env.HELIUS_RPC_URL!);
    const tokenAccountInfo = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { mint: new PublicKey(tokenAddress) }
    );

    const tokenBalance =
      tokenAccountInfo.value[0]?.account.data.parsed.info.tokenAmount
        .uiAmount || 0;

    if (tokenBalance < minimum_token_count) {
      return NextResponse.json(
        {
          error: `Insufficient tokens. Minimum required: ${minimum_token_count}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, chat_id, tokenBalance },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { error: "An error occurred while validating the token." },
      { status: 500 }
    );
  }
}
