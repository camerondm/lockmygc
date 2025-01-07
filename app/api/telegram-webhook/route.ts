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
    "Hello! Add me to your group and make me an admin. The only permission I need is to send messages and generate invite links for the group. Then use /activate <token_address> <minimum_token_count> to configure me for this group. Check out https://www.lockmygc.com/ for more info."
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

  // Validate token address for Solana or Base network
  try {
    if (isSolanaAddress(tokenAddress)) {
      new PublicKey(tokenAddress); // Validate Solana address
    } else if (isBaseNetworkAddress(tokenAddress)) {
      // Add your Base network address validation logic here
      // For example, check if it matches a specific pattern or length
    } else {
      throw new Error("Invalid address format for Solana or Base network.");
    }
  } catch (error) {
    ctx.reply("Invalid token address. Please try again.");
    console.error("Invalid token address:", error);
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
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Add name", callback_data: `add_name_${chatId}` },
              { text: "Add image", callback_data: `add_image_${chatId}` },
              {
                text: "Add description",
                callback_data: `add_description_${chatId}`,
              },
              { text: "Delete", callback_data: `delete_${chatId}` },
            ],
          ],
        },
      }
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
  } else if (data.startsWith("add_name_")) {
    const chatId = data.split("_")[2];

    // Prompt user to enter a name
    ctx.reply("Please enter the name you want to set:");

    // Listen for the next message from the user
    bot.on("message:text", async (ctx) => {
      const name = ctx.message.text;

      try {
        const { error } = await supabase
          .from("chats")
          .update({ name })
          .eq("chat_id", chatId);

        if (error) {
          console.error("Error updating name in Supabase:", error.message);
          ctx.reply("Failed to set the name. Try again later.");
          return;
        }

        ctx.reply("Name was set successfully.");
      } catch (error) {
        console.error("Unexpected error:", error);
        ctx.reply("An unexpected error occurred. Please try again.");
      }
    });
  } else if (data.startsWith("add_image_")) {
    const chatId = data.split("_")[2];

    // Prompt user to send an image
    ctx.reply("Please send the image you want to set:");

    // Listen for the next message from the user
    bot.on("message:photo", async (ctx) => {
      const photo = ctx.message.photo.pop(); // Get the highest resolution photo
      if (!photo) {
        ctx.reply("No image found. Please try again.");
        return;
      }

      try {
        // Get the file  from Telegram
        const file = await ctx.getFile();
        const path = file.file_path;
        if (!path) {
          ctx.reply("Failed to get the image path. Try again later.");
          return;
        }

        const fetchPath = `https://api.telegram.org/file/bot${botToken}/${path}`;
        const blob = await fetch(fetchPath).then((res) => res.blob());

        // Upload the image to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(`chat_${chatId}/${photo.file_id}.jpg`, blob, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error(
            "Error uploading image to Supabase:",
            uploadError.message
          );
          ctx.reply("Failed to upload the image. Try again later.");
          return;
        }

        // Update the image_url column in the database
        const { error: updateError } = await supabase
          .from("chats")
          .update({ image_url: uploadData.fullPath })
          .eq("chat_id", chatId);

        if (updateError) {
          console.error(
            "Error updating image URL in Supabase:",
            updateError.message
          );
          ctx.reply("Failed to set the image. Try again later.");
          return;
        }

        ctx.reply("Image was set successfully.");
      } catch (error) {
        console.error("Unexpected error:", error);
        ctx.reply("An unexpected error occurred. Please try again.");
      }
    });
  } else if (data.startsWith("add_description_")) {
    const chatId = data.split("_")[2];

    // Prompt user to enter a description
    ctx.reply("Please enter the description you want to set:");

    // Listen for the next message from the user
    bot.on("message:text", async (ctx) => {
      const description = ctx.message.text;

      try {
        const { error } = await supabase
          .from("chats")
          .update({ description })
          .eq("chat_id", chatId);

        if (error) {
          console.error(
            "Error updating description in Supabase:",
            error.message
          );
          ctx.reply("Failed to set the description. Try again later.");
          return;
        }

        ctx.reply("Description was set successfully.");
      } catch (error) {
        console.error("Unexpected error:", error);
        ctx.reply("An unexpected error occurred. Please try again.");
      }
    });
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

// Helper function to check if the address is a Solana address
function isSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Helper function to check if the address is a Base network address
function isBaseNetworkAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address); // Example pattern
}
