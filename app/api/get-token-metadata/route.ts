import { NextResponse } from "next/server";

import { NextRequest } from "next/server";

const heliusUrl = process.env.HELIUS_RPC_URL!;
const alchemyUrl = process.env.ALCHEMY_RPC_URL!;
import { v4 as uuidv4 } from "uuid";
export async function POST(req: NextRequest) {
  const { tokenId } = await req.json();
  if (!tokenId) {
    return NextResponse.json(
      { error: "Token ID is required." },
      { status: 400 }
    );
  }

  if (tokenId.startsWith("0x")) {
    const response = await fetch(alchemyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getTokenMetadata",
        params: [tokenId],
      }),
    });
    const { result } = await response.json();
    return NextResponse.json(result);
  } else {
    const response = await fetch(heliusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: uuidv4(),
        method: "getAsset",
        params: {
          id: tokenId,
          displayOptions: {
            showFungible: true, //return details about a fungible token
          },
        },
      }),
    });
    const { result } = await response.json();
    return NextResponse.json(result);
  }
}
