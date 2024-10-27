import express from "express";
import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import * as admin from "firebase-admin";
import {
  handlePhotoSent,
  handleGetRanking,
  handleGetShippingRanking,
  handleGetMindfulnessRanking,
  handleBeZen,
  handleBingRoast,
} from "./actions";

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
