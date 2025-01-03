import { Bot } from "grammy";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Telegram Bot
const botToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new Bot(botToken);

// Handle bot being added to a group
bot.on("chat_member", (ctx) => {
  if (ctx.chatMember.new_chat_member.user.id === ctx.me.id) {
    ctx.reply(
      `Hello! Use /activate <token_address> <minimum_token_count> to configure me for this group.`
    );
  }
});

// Handle /activate command
bot.command("activate", async (ctx) => {
  if (ctx.chat.type !== "supergroup") {
    ctx.reply("This command can only be used in a group.");
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
  const minimumTokenCount = parseInt(args[2]);
  const chatId = ctx.chat.id;

  if (isNaN(minimumTokenCount)) {
    ctx.reply("Minimum token count must be an integer.");
    return;
  }

  try {
    // Upsert based on composite key (chat_id + token_id)
    const { error } = await supabase.from("chats").upsert({
      chat_id: chatId.toString(),
      token_id: tokenAddress,
      minimum_token_count: minimumTokenCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving to Supabase:", error.message);
      ctx.reply("Failed to activate the bot. Try again later.");
      return;
    }

    ctx.reply(
      `Bot activated successfully!\nToken Address: ${tokenAddress}\nMinimum Tokens: ${minimumTokenCount}`
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    ctx.reply("An unexpected error occurred. Please try again.");
  }
});

// Start the bot
bot.start();
console.log("Telegram bot is running...");
