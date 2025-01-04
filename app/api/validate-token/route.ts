import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey } from "@solana/web3.js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const alchemyUrl = process.env.ALCHEMY_RPC_URL!;

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, groupId } = (await req.json()) as {
      walletAddress: string;
      groupId: string;
    };

    if (!walletAddress || !groupId) {
      return NextResponse.json(
        { error: "Wallet address and group ID are required." },
        { status: 400 }
      );
    }

    // Query Supabase to get the minimum token count and chat_id
    const { data, error } = await supabase
      .from("chats")
      .select("minimum_token_count, chat_id, token_id")
      .eq("id", groupId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Token address not found in the database." },
        { status: 404 }
      );
    }

    const { minimum_token_count, chat_id, token_id } = data;

    if (token_id.startsWith("0x")) {
      const response = await fetch(alchemyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "alchemy_getTokenBalances",
          params: [walletAddress, [token_id]],
        }),
      });
      const { result } = await response.json();
      const tokenBalance = result.tokenBalances[0].tokenBalance;
      //   this is in hex
      const readableValue = parseInt(tokenBalance, 16);
      const tokenDecimals = 18;
      const humanReadableBalance = readableValue / Math.pow(10, tokenDecimals);
      if (humanReadableBalance < minimum_token_count) {
        return NextResponse.json(
          {
            error: `Insufficient tokens. Minimum required: ${minimum_token_count}`,
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { success: true, chat_id, tokenBalance: humanReadableBalance },
          { status: 200 }
        );
      }
    } else {
      // Use Helius RPC to check the user's token balance
      const connection = new Connection(process.env.HELIUS_RPC_URL!);
      const tokenAccountInfo = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: new PublicKey(token_id) }
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
    }
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { error: "An error occurred while validating the token." },
      { status: 500 }
    );
  }
}
