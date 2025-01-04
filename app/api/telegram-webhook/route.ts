import { Bot } from "grammy";
import { createClient } from "@supabase/supabase-js";
import { PublicKey } from "@solana/web3.js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Telegram Bot
const botToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new Bot(botToken);

// Handle /start command
bot.command("start", async (ctx) => {
  ctx.reply(
    "Hello! Use /activate <token_address> <minimum_token_count> to configure me for this group.",
    {
      parse_mode: "Markdown",
    }
  );
});

// Handle /activate command

bot.command("activate", async (ctx) => {
  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    ctx.reply("This command can only be used in a group or supergroup.");
    return;
  }

  // Check if the bot is an admin
  const botMember = await ctx.getChatMember(ctx.me.id);
  if (
    !botMember.status ||
    (botMember.status !== "administrator" && botMember.status !== "creator")
  ) {
    ctx.reply("I need to be an admin to perform this action.");
    return;
  }

  const memberId = ctx.from?.id;
  if (!memberId) {
    ctx.reply("You must be a member of the group to use this command.");
    return;
  }

  // Check if the user is an admin
  const member = await ctx.getChatMember(memberId);
  if (
    !member.status ||
    (member.status !== "administrator" && member.status !== "creator")
  ) {
    ctx.reply("You must be an admin to use this command.");
    return;
  }

  const args = ctx.message?.text?.split(" ");
  if (!args || args.length !== 3) {
    ctx.reply("Usage: /activate <token_address> <minimum_token_count>");
    return;
  }

  const tokenAddress = args[1];

  // Validate Solana address
  try {
    new PublicKey(tokenAddress);
  } catch (error) {
    ctx.reply("Invalid Solana address. Please try again.");
    console.error("Invalid Solana address:", error);
    return;
  }

  const minimumTokenCount = parseInt(args[2]);
  const chatId = ctx.chat.id;

  if (isNaN(minimumTokenCount)) {
    ctx.reply("Minimum token count must be an integer.");
    return;
  }

  try {
    // Check if a token is already active for this chat
    const { count, error: fetchError } = await supabase
      .from("chats")
      .select("token_id", { count: "exact" })
      .eq("chat_id", chatId.toString());

    if (fetchError) {
      console.error("Error fetching from Supabase:", fetchError.message);
      ctx.reply("Failed to check existing tokens. Try again later.");
      return;
    }

    if (count && count > 0) {
      ctx.reply(`A token is already active for this chat.`, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Delete", callback_data: `delete_${chatId}` },
              { text: "Cancel", callback_data: "cancel" },
            ],
          ],
        },
      });
      return;
    }

    // Upsert based on composite key (chat_id + token_id)
    const { data, error } = await supabase
      .from("chats")
      .upsert({
        chat_id: chatId.toString(),
        token_id: tokenAddress,
        minimum_token_count: minimumTokenCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving to Supabase:", error.message);
      ctx.reply("Failed to activate the bot. Try again later.");
      return;
    }
    if (!data) {
      ctx.reply("Failed to activate the bot. Try again later.");
      return;
    }

    ctx.reply(
      `Bot activated successfully!\nToken Address: \`${tokenAddress}\`\nMinimum Tokens: \`${minimumTokenCount}\`. \nUse this link: \n\`${process.env.NEXT_PUBLIC_BASE_URL}?id=${data.id}\` \nto invite members.`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    ctx.reply("An unexpected error occurred. Please try again.");
  }
});

// Handle callback queries for "Delete" or "Cancel"
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("delete_")) {
    const chatId = data.split("_")[1];

    try {
      const { error } = await supabase
        .from("chats")
        .delete()
        .eq("chat_id", chatId);

      if (error) {
        console.error("Error deleting from Supabase:", error.message);
        ctx.answerCallbackQuery("Failed to delete the token. Try again later.");
        return;
      }

      ctx.answerCallbackQuery("Token deleted successfully.");
      ctx.editMessageText("The token has been deleted.");
    } catch (error) {
      console.error("Unexpected error:", error);
      ctx.answerCallbackQuery(
        "An unexpected error occurred. Please try again."
      );
    }
  } else if (data === "cancel") {
    ctx.answerCallbackQuery("Operation cancelled.");
    ctx.editMessageText("Operation cancelled.");
  }
});

// Export the webhook handler
export async function POST(req: Request) {
  const body = await req.json();
  try {
    // Initialize the bot (required for webhook mode)
    await bot.init();

    // Process Telegram updates via webhook
    await bot.handleUpdate(body);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error handling update:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

console.log("Webhook handler ready.");
