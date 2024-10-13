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

bot.command("start", (ctx) => {
  console.log("Starting the bot!!");
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hey there, gym enthusiast! 💪 I'm the MegaLyfters Photo Bot. Add me to your group to start tracking those epic gym selfies!",
    );
  } else {
    ctx.reply(
      "MegaLyfters assemble! 🦸‍♂️🦸‍♀️ Your friendly neighborhood Gym Photo Bot is here to pump up your photo game!",
    );
  }
});

bot.on("photo", async (ctx) => {
  if (ctx.chat.type === "private") {
    console.log("Hitting the bot!!");
    await ctx.reply(
      "Whoa there, lone wolf! 🐺 Add me to your pack (group) to start the gym photo party!",
    );
    return;
  }

  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(fileLink.href, {
      responseType: "arraybuffer",
    });
    const photoBuffer = Buffer.from(response.data, "binary");

    const username = ctx.from?.first_name || ctx.from?.username || "Gym Beast";
    const [isGymPhoto, roast] = await analyzeAndRoastPhoto(
      photoBuffer,
      username,
    );

    if (isGymPhoto) {
      await updateUserCount(ctx);
    }
    await ctx.reply(roast);
  } catch (error) {
    console.error("Error processing photo:", error);
    await ctx.reply(
      "Oops! Looks like our bot pulled a muscle. 🤕 Give it a moment to recover and try again!",
    );
  }
});

bot.command("ranking", async (ctx) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hey champ, this is a team sport! 🏆 Use this command in your MegaLyfters group!",
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
}

function getPlacementEmoji(index: number): string {
  const emojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  return emojis[index] || "🏅";
}

// Express routes (kept from previous version)
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
