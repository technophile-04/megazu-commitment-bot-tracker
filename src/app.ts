import express from "express";
import dotenv from "dotenv";
import { Telegraf, Context } from "telegraf";
import * as admin from "firebase-admin";
import axios from "axios";

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
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hi! I'm the Gym Photo Bot. Add me to a group to track gym photos!",
    );
  } else {
    ctx.reply("Gym Photo Bot is ready! Send your gym photos to be counted.");
  }
});

bot.on("photo", async (ctx) => {
  if (ctx.chat.type === "private") {
    console.log("Hitting the bot!!");
    await ctx.reply("Please add me to a group to track gym photos!");
    return;
  }

  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(fileLink.href, {
      responseType: "arraybuffer",
    });
    const photoBuffer = Buffer.from(response.data, "binary");

    const isGymPhoto = await analyzePhoto(photoBuffer);

    if (isGymPhoto) {
      await updateUserCount(ctx);
      await ctx.reply("Great job! Your gym photo has been counted.");
    } else {
      await ctx.reply("This doesn't seem to be a gym photo. Try again!");
    }
  } catch (error) {
    console.error("Error processing photo:", error);
    await ctx.reply(
      "Sorry, there was an error processing your photo. Please try again later.",
    );
  }
});

bot.command("ranking", async (ctx) => {
  if (ctx.chat.type === "private") {
    ctx.reply("Please use this command in a group!");
    return;
  }

  try {
    const groupId = ctx.chat.id.toString();
    const ranking = await getRanking(groupId);
    ctx.reply(ranking);
  } catch (error) {
    console.error("Error getting ranking:", error);
    ctx.reply(
      "Sorry, there was an error retrieving the ranking. Please try again later.",
    );
  }
});

async function analyzePhoto(photoBuffer: Buffer): Promise<boolean> {
  // TODO: Implement actual photo analysis logic
  return Math.random() < 0.7; // 70% chance of being a gym photo
}

async function updateUserCount(ctx: Context) {
  const userId = ctx.from?.id.toString();
  const username = ctx.from?.username || ctx.from?.first_name || "Anonymous";
  const groupId = ctx.chat?.id.toString();

  if (!userId || !groupId) return;

  const userRef = db
    .collection("groups")
    .doc(groupId)
    .collection("users")
    .doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (userDoc.exists) {
      const newCount = (userDoc.data()?.photoCount || 0) + 1;
      transaction.update(userRef, { photoCount: newCount, username });
    } else {
      transaction.set(userRef, { photoCount: 1, username });
    }
  });
}

async function getRanking(groupId: string): Promise<string> {
  const usersSnapshot = await db
    .collection("groups")
    .doc(groupId)
    .collection("users")
    .orderBy("photoCount", "desc")
    .limit(10)
    .get();

  let ranking = "Top 10 Gym Photo Posters in this group:\n";
  usersSnapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    ranking += `${index + 1}. ${data.username}: ${data.photoCount} photos\n`;
  });

  return (
    ranking || "No rankings available yet. Start posting those gym photos!"
  );
}

// Express routes (kept from previous version)
app.get("/", (req, res) => {
  res.send("Gym Photo Bot Server is running!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Start bot
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
