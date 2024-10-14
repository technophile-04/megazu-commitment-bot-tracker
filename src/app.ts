import express from "express";
import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import * as admin from "firebase-admin";
import {
  handlePhotoSent,
  handleGetRanking,
  handleGetShippingRanking,
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
      "Hey there, activity champion! 🏋️‍♂️👨‍💻 I'm the MegaZu activity tracker. Add me to your group and share your progress pics! Here's how:\n\n1️⃣ Take a photo of your workout for gym progress\n2️⃣ For coding/shipping progress, take a photo of your computer screen showing code, dev environment, or presentation\n3️⃣ Add '/pumped' for gym pics or '/shipping' for coding/presentation pics in the caption\n4️⃣ Send it to the group\n\nLet's showcase those epic gains and ships! 💪📸🚢",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  } else {
    ctx.reply(
      "MegaZu trackers, get ready to flex those muscles and ship that code! 🦸‍♂️🦸‍♀️ Your friendly neighborhood Progress Guardian is here!\n\nTo show off your progress:\n1️⃣ Snap a pic of your workout for gym progress\n2️⃣ For coding/shipping, capture your computer screen with code, dev environment, or presentation\n3️⃣ Include '/pumped' for gym pics or '/shipping' for coding/presentation pics in the caption\n4️⃣ Share it with the group\n\nLet's see those gains and ships! 💪🖥️🚢",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
});

bot.on("photo", (ctx) => handlePhotoSent(ctx, db));
bot.command("lifters", (ctx) => handleGetRanking(ctx, db));
bot.command("shippers", (ctx) => handleGetShippingRanking(ctx, db));

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
