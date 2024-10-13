import express from "express";
import dotenv from "dotenv";
import { Telegraf, Context } from "telegraf";
import * as admin from "firebase-admin";
import axios from "axios";
import OpenAI from "openai";

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

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN!);

function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

bot.command("start", (ctx) => {
  console.log("Starting the bot!!");
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hey there, gym enthusiast! 💪 I'm the MegaLyfters Photo Bot. Add me to your group to start tracking those epic gym selfies!",
      {
        reply_parameters: {
          message_id: ctx.message.message_id,
        },
      },
    );
  } else {
    ctx.reply(
      "MegaLyfters assemble! 🦸‍♂️🦸‍♀️ Your friendly neighborhood Gym Photo Bot is here to pump up your photo game!",
      {
        reply_parameters: {
          message_id: ctx.message.message_id,
        },
      },
    );
  }
});

async function acquireLock(
  lockRef: admin.firestore.DocumentReference,
  maxWaitTime: number = 10000,
): Promise<boolean> {
  const lockExpiration = Date.now() + 10000; // Lock expires after 10 seconds

  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(lockRef);
    if (!doc.exists || doc.data()!.expiresAt < Date.now()) {
      transaction.set(lockRef, { expiresAt: lockExpiration });
      return true;
    }
    return false;
  });

  if (result) return true;

  // If we couldn't acquire the lock, wait and try again
  if (maxWaitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return acquireLock(lockRef, maxWaitTime - 100);
  }

  return false;
}

async function releaseLock(lockRef: admin.firestore.DocumentReference) {
  await lockRef.delete();
}

// Update the photo handling logic
bot.on("photo", async (ctx) => {
  if (ctx.chat.type === "private") {
    console.log("Hitting the bot!!");
    await ctx.reply(
      "Whoa there, lone wolf! 🐺 Add me to your pack (group) to start the gym photo party!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
    return;
  }

  try {
    const userId = ctx.from?.id.toString();
    const username = ctx.from?.first_name || ctx.from?.username || "Gym Beast";
    const groupId = ctx.chat?.id.toString();

    if (!userId || !groupId) {
      await ctx.reply(
        "Oops! Our gym equipment malfunctioned. 🏋️‍♂️🔧 Give it a quick rest and try again!",
        {
          reply_parameters: { message_id: ctx.message.message_id },
        },
      );
      return;
    }

    const lockRef = db.collection("locks").doc(`${groupId}_${userId}`);
    const acquired = await acquireLock(lockRef);

    if (!acquired) {
      await ctx.reply(
        "Easy there, speed demon! 🏃‍♂️💨 Your last pic is still doing reps. Give it a moment to catch its breath!",
        { reply_parameters: { message_id: ctx.message.message_id } },
      );
      return;
    }

    try {
      const currentDate = getCurrentDate();
      const userRef = db
        .collection("groups")
        .doc(groupId)
        .collection("users")
        .doc(userId);

      // Check user's daily status
      const userDoc = await userRef.get();
      const userData = userDoc.data() || {};
      const dailyData = userData.dailyData || {};
      const todayData = dailyData[currentDate] || {
        gymPhotoUploaded: false,
        attempts: 0,
      };

      if (todayData.gymPhotoUploaded) {
        await ctx.reply(
          `Whoa, ${username}! 🏆 You've already crushed your daily gym pic goal. Save some gains for tomorrow, champ!`,
          { reply_parameters: { message_id: ctx.message.message_id } },
        );
        return;
      }

      if (!todayData.gymPhotoUploaded && todayData.attempts >= 5) {
        await ctx.reply(
          `Hold up, ${username}! 🛑 You've maxed out your daily photo reps. Time to rest those selfie muscles and come back stronger tomorrow! 💪😴`,
          { reply_parameters: { message_id: ctx.message.message_id } },
        );
        return;
      }

      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileLink.href, {
        responseType: "arraybuffer",
      });
      const photoBuffer = Buffer.from(response.data, "binary");

      const [isGymPhoto, roast] = await analyzeAndRoastPhoto(
        photoBuffer,
        username,
      );

      if (isGymPhoto) {
        await updateUserCount(ctx, currentDate);
        todayData.gymPhotoUploaded = true;
      } else {
        todayData.attempts += 1;
      }

      // Update the user's daily data
      await userRef.set(
        {
          ...userData,
          dailyData: {
            ...dailyData,
            [currentDate]: todayData,
          },
        },
        { merge: true },
      );

      await ctx.reply(roast, {
        reply_parameters: { message_id: ctx.message.message_id },
      });
    } finally {
      await releaseLock(lockRef);
    }
  } catch (error) {
    console.error("Error processing photo:", error);
    await ctx.reply(
      "Oof! 😅 Looks like our bot pulled a digital muscle. Let's take a quick water break and try that again!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
});

bot.command("ranking", async (ctx) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hey champ, this is a team sport! 🏆 Use this command in your MegaLyfters group!",
      {
        reply_parameters: {
          message_id: ctx.message.message_id,
        },
      },
    );
    return;
  }

  try {
    const groupId = ctx.chat.id.toString();
    const ranking = await getRanking(groupId);
    ctx.reply(ranking);
  } catch (error) {
    console.error("Error getting ranking:", error);
    ctx.reply(
      "Uh-oh! Our ranking system is feeling a bit winded. 😅 Take a breather and try again in a moment!",
      {
        reply_parameters: {
          message_id: ctx.message.message_id,
        },
      },
    );
  }
});

async function analyzeAndRoastPhoto(
  photoBuffer: Buffer,
  username: string,
): Promise<[boolean, string]> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You're a witty gym bot analyzing photos. For gym pics, start with 'GYM PIC:' then give an ultra-short, snappy roast (max 10 words). For non-gym pics, start with 'NOT GYM:' then provide a short, funny callout for trying to trick the bot (max 15 words). Always be playful and cheeky, but keep it friendly.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a gym pic? Respond with the appropriate prefix (GYM PIC: or NOT GYM:) followed by your witty comment.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });

    const answer = response.choices[0]?.message?.content;
    if (answer) {
      const isGymPhoto = answer.toUpperCase().startsWith("GYM PIC:");
      const comment = answer.substring(answer.indexOf(":") + 1).trim();
      let finalResponse: string;

      if (isGymPhoto) {
        finalResponse = `Hey ${username}! ${comment} Photo counted, flex on! 💪📸`;
      } else {
        finalResponse = `Nice try, ${username}! ${comment} No gains for you this time! 😜`;
      }

      return [isGymPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing image with OpenAI:", error);
    return [false, ""];
  }
}

async function updateUserCount(ctx: Context, currentDate: string) {
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
    const userData = userDoc.data() || {};
    const newCount = (userData.photoCount || 0) + 1;
    const dailyData = userData.dailyData || {};

    transaction.set(
      userRef,
      {
        photoCount: newCount,
        username,
        dailyData: {
          ...dailyData,
          [currentDate]: {
            gymPhotoUploaded: true,
            attempts: (dailyData[currentDate]?.attempts || 0) + 1,
          },
        },
      },
      { merge: true },
    );
  });
}

async function getRanking(groupId: string): Promise<string> {
  try {
    const usersSnapshot = await db
      .collection("groups")
      .doc(groupId)
      .collection("users")
      .orderBy("photoCount", "desc")
      .limit(10)
      .get();

    let ranking = "🏆 MegaLyfters Hall of Fame 🏆\n\n";
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const emoji = getPlacementEmoji(index);
      ranking += `${emoji} ${data.username}: ${data.photoCount} epic gym selfies\n`;
    });

    return (
      ranking ||
      "No rankings yet? Time to flex those selfie muscles, MegaLyfters! 📸💪"
    );
  } catch (error) {
    console.error("Error getting ranking:", error);
    return "Oops! Our ranking board is doing extra reps. 🏋️‍♀️ Give it a moment to cool down and try again!";
  }
}

function getPlacementEmoji(index: number): string {
  const emojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  return emojis[index] || "🏅";
}

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
