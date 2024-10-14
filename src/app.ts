import express from "express";
import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { initializeFirebase } from "./firebase";
import { handlePhotoSent, handleGetRanking } from "./actions";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

initializeFirebase();

// Initialize Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.command("start", (ctx) => {
  console.log("Starting the bot!!");
  if (ctx.chat?.type === "private") {
    ctx.reply(
      "Hey there, iron pumper! 💪 I'm the MegaLyfters Photo Bot. Add me to your group and share your progress pics! Here's how:\n\n1️⃣ Take a photo of your workout or gains\n2️⃣ Add '/pumped' in the caption\n3️⃣ Send it to the group\n\nLet's showcase those epic gains together! 💪📸",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  } else {
    ctx.reply(
      "MegaLyfters, get ready to pump it up! 🦸‍♂️🦸‍♀️ Your friendly neighborhood Gains Guardian is here!\n\nTo show off your progress:\n1️⃣ Snap a pic of your workout or gains\n2️⃣ Include '/pumped' in the caption\n3️⃣ Share it with the group\n\n",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
});

bot.on("photo", handlePhotoSent);

bot.command("ranking", handleGetRanking);

// Express routes
app.get("/", (_req, res) => {
  res.send("MegaLyfters Gym Photo Bot is pumping iron and taking names! 💪🤳");
});

// Start server
app.listen(port, () => {
  console.log(`Server is flexing on port ${port} 💪`);
});

// Start bot
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
