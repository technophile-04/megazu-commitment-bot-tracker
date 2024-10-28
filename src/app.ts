import express from "express";
import dotenv from "dotenv";
import { Markup, Telegraf } from "telegraf";
import * as admin from "firebase-admin";
import {
  handlePhotoSent,
  handleGetRanking,
  handleGetShippingRanking,
  handleGetMindfulnessRanking,
  handleBeZen,
  handleBingRoast,
} from "./actions";
import { link } from "telegraf/format";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

// Initialize Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.command("start", (ctx) => {
  console.log("Starting the bot!!");
  if (ctx.chat?.type === "private") {
    ctx.reply(
      "Hey there, wellness champion! 🏋️‍♂️👨‍💻🧘‍♂️ I'm the MegaZu activity tracker. Add me to your group and share your progress pics! Here's how:\n\n1️⃣ Take a photo of your workout, coding progress, or mindfulness practice\n2️⃣ Add '/pumped' for gym pics, '/shipped' for coding pics, or '/zenned' for mindfulness pics in the caption\n3️⃣ Send it to the group\n\nLet's showcase those epic gains, ships, and zen moments! 💪📸🚢🧘‍♂️",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  } else {
    ctx.reply(
      "MegaZu trackers, get ready to flex those muscles, ship that code, and find your zen! 🦸‍♂️🦸‍♀️ Your friendly neighborhood Progress Guardian is here!\n\nTo show off your progress:\n1️⃣ Snap a pic of your workout, coding, or mindfulness practice\n2️⃣ Include '/pumped' for gym pics, '/shipped' for coding pics, or '/zenned' for mindfulness pics in the caption\n3️⃣ Share it with the group\n\nLet's see those gains, ships, and zen moments! 💪🖥️🚢🧘‍♂️",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
});

bot.on("photo", (ctx) => handlePhotoSent(ctx, db));
bot.command("lifters", (ctx) => handleGetRanking(ctx, db));
bot.command("shippers", (ctx) => handleGetShippingRanking(ctx, db));
bot.command("zensters", (ctx) => handleGetMindfulnessRanking(ctx, db));
// Since `/zenned` can used by mentioning different members,  members need to be regsitered in firebase DB before adding their count
bot.command("bezen", (ctx) => handleBeZen(ctx, db));

bot.command("bing_roast", (ctx) => handleBingRoast(ctx, db));

const WEB_APP_URL = "https://megagoals.vercel.app/";
bot.command("inlinekb", async (ctx) => {
  try {
    // Check if the chat is a group
    const isGroup =
      ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";

    ctx.reply(
      "Launch mini app from inline keyboard!",
      Markup.inlineKeyboard([
        Markup.button.webApp("Launch", `${WEB_APP_URL}/activity`),
      ]),
    );
  } catch (error) {
    console.error("Error sending inline keyboard:", error);
    ctx.reply("Sorry, there was an error launching the web app.");
  }
});

bot.command("link", async (ctx) => {
  try {
    const botUsername = (await bot.telegram.getMe()).username;
    // Format: tg://resolve?domain=<botUsername>&appname=<appName>&startapp=<startParameter>
    const miniAppLink = `tg://resolve?domain=${botUsername}&appname=MegaCommitments&startapp=activity`;

    await ctx.reply("📊 Open Activity Tracker:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Track Activities",
              url: miniAppLink,
            },
          ],
        ],
      },
      reply_parameters: { message_id: ctx.message.message_id },
    });
  } catch (error) {
    console.error("Error generating mini app link:", error);
    ctx.reply("Sorry, there was an error generating the link.");
  }
});

// Express routes
app.get("/", (_req, res) => {
  res.send("MegaZu Activity Tracker is pumping iron and shipping code! 💪🚢");
});

// Start server and bot
async function startApp() {
  try {
    // Start Express server
    app.listen(port, () => {
      console.log(`Server is flexing on port ${port} 💪`);
    });

    // Start Telegram bot
    await bot.launch();
    console.log("MegaZu bot is online and ready to track activities!");

    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (error) {
    console.error("Failed to start the application:", error);
    process.exit(1);
  }
}

startApp();
