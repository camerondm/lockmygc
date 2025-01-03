import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required to generate an invite link." },
        { status: 400 }
      );
    }

    // Call Telegram Bot API to generate an invite link
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/createChatInviteLink`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId, // Chat ID for which the invite link is being generated
          member_limit: 1, // Optional: limit the link to one use
          expire_date: Math.floor(Date.now() / 1000) + 3600, // Optional: expires in 1 hour
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return NextResponse.json(
        {
          error: "Failed to generate invite link.",
          details: result.description,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ inviteLink: result.result.invite_link });
  } catch (error) {
    console.error("Error generating invite link:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the invite link." },
      { status: 500 }
    );
  }
}
