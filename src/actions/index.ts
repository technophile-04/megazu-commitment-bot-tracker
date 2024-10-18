import { Context } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import axios from "axios";
import {
  getMindfulnessRanking,
  getRanking,
  getShippingRanking,
  updateGroupMindfulnessCount,
  updateUserCount,
} from "../firebase/queries";
import {
  analyzeAndRoastGymPhoto,
  analyzeAndRoastMindfulnessPhoto,
  analyzeAndRoastShippingPhoto,
} from "../openai";
import { extractMentions, getCurrentDate } from "../utils";
import { firestore } from "firebase-admin";
import { acquireLock, releaseLock } from "../firebase";

export const handlePhotoSent = async (
  ctx: Context,
  db: firestore.Firestore,
) => {
  const msg = ctx.message as Message.PhotoMessage;

  // Check if the caption contains "/pumped", "/pump", "/shipped", or "/zenned"
  if (
    !msg.caption ||
    !/\/pumped|\/pump|\/shipped|\/zenned/i.test(msg.caption)
  ) {
    // If not a valid command, ignore this photo
    return;
  }

  const isShipping = /\/shipped/i.test(msg.caption);
  const isMindfulness = /\/zenned/i.test(msg.caption);

  if (ctx.chat?.type === "private") {
    await ctx.reply(
      `Whoa there, solo ${isMindfulness ? "zen seeker" : isShipping ? "coder" : "athlete"}! 🐺 Add me to your crew (group) to start the ultimate ${isMindfulness ? "mindfulness" : isShipping ? "shipping" : "fitness"} party!`,
      { reply_parameters: { message_id: msg.message_id } },
    );
    return;
  }

  try {
    const userId = ctx.from?.id.toString();
    const username =
      ctx.from?.first_name ||
      ctx.from?.username ||
      (isMindfulness
        ? "Mindfulness Enthusiast"
        : isShipping
          ? "Code Shipper"
          : "Fitness Enthusiast");
    const groupId = ctx.chat?.id.toString();

    if (!userId || !groupId) {
      await ctx.reply(
        `Oops! Our ${isMindfulness ? "zen-o-meter" : isShipping ? "ship-o-meter" : "fit-o-meter"} malfunctioned. 🔧 Give it a quick rest and try ${isMindfulness ? "finding your center" : isShipping ? "shipping" : "flexing"} again!`,
        { reply_parameters: { message_id: msg.message_id } },
      );
      return;
    }

    const lockRef = db.collection("locks").doc(`${groupId}_${userId}`);
    const acquired = await acquireLock(lockRef, 10000, db);

    if (!acquired) {
      await ctx.reply(
        `Easy there, turbo ${isMindfulness ? "zen seeker" : isShipping ? "shipper" : "athlete"}! 🧘‍♂️💨 We're still processing your last ${isMindfulness ? "moment of zen" : isShipping ? "commit" : "rep"}. Give us a sec to find our balance!`,
        { reply_parameters: { message_id: msg.message_id } },
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
        shippingPhotoUploaded: false,
        mindfulnessPhotoUploaded: false,
        attempts: 0,
      };

      if (
        (isMindfulness && todayData.mindfulnessPhotoUploaded) ||
        (isShipping && todayData.shippingPhotoUploaded) ||
        (!isShipping && !isMindfulness && todayData.gymPhotoUploaded)
      ) {
        await ctx.reply(
          `Whoa, ${username}! 🏆 You've already logged your daily ${isMindfulness ? "mindfulness" : isShipping ? "shipping" : "fitness"} activity. Save some amazement for tomorrow, you ${isMindfulness ? "enlightened being" : "beast"}!`,
          { reply_parameters: { message_id: msg.message_id } },
        );
        return;
      }

      if (todayData.attempts >= 5) {
        await ctx.reply(
          `Hold up, ${username}! 🛑 You've hit your daily attempt limit. Time to rest those ${isMindfulness ? "thoughts" : isShipping ? "fingers" : "muscles"} and come back more ${isMindfulness ? "centered" : isShipping ? "productive" : "energized"} tomorrow! ${isMindfulness ? "🧘‍♂️😴" : isShipping ? "⌨️😴" : "💪😴"}`,
          { reply_parameters: { message_id: msg.message_id } },
        );
        return;
      }

      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileLink.href, {
        responseType: "arraybuffer",
      });
      const photoBuffer = Buffer.from(response.data, "binary");

      let isValidPhoto: boolean;
      let roast: string;

      if (isMindfulness) {
        [isValidPhoto, roast] = await analyzeAndRoastMindfulnessPhoto(
          photoBuffer,
          username,
        );
      } else if (isShipping) {
        [isValidPhoto, roast] = await analyzeAndRoastShippingPhoto(
          photoBuffer,
          username,
        );
      } else {
        [isValidPhoto, roast] = await analyzeAndRoastGymPhoto(
          photoBuffer,
          username,
        );
      }

      if (isValidPhoto) {
        await updateUserCount(ctx, currentDate, isShipping, isMindfulness, db);

        if (isMindfulness) {
          const mentionedUsers = extractMentions(msg.caption);
          if (mentionedUsers.length > 0) {
            await updateGroupMindfulnessCount(groupId, mentionedUsers, db);
            roast += `\n\nLook at you, spreading the zen! ${mentionedUsers.join(", ")} ${mentionedUsers.length > 1 ? "are" : "is"} now part of your mindfulness circle! 🧘‍♂️🧘‍♀️`;
          }
        }
      } else {
        // Only increment attempts for invalid photos
        await userRef.set(
          {
            dailyData: {
              ...dailyData,
              [currentDate]: {
                ...todayData,
                attempts: todayData.attempts + 1,
              },
            },
          },
          { merge: true },
        );
      }

      await ctx.reply(roast, {
        reply_parameters: { message_id: msg.message_id },
      });
    } finally {
      await releaseLock(lockRef);
    }
  } catch (error) {
    console.error(
      `Error processing ${isMindfulness ? "mindfulness" : isShipping ? "shipping" : "fitness"} activity:`,
      error,
    );
    await ctx.reply(
      `Oof! 😅 Looks like our bot's ${isMindfulness ? "zen" : isShipping ? "code" : "workout"} routine hit a snag. Let's take a quick break and try that again!`,
      { reply_parameters: { message_id: msg.message_id } },
    );
  }
};

export const handleGetRanking = async (ctx: any, db: firestore.Firestore) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hey fitness champion, this is a team sport! 🏆 Use this command in your MegaZu group to see who's the ultimate fitness guru!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
    return;
  }

  try {
    const groupId = ctx.chat.id.toString();
    const ranking = await getRanking(groupId, db);
    ctx.reply(ranking);
  } catch (error) {
    console.error("Error getting fitness ranking:", error);
    ctx.reply(
      "Uh-oh! Our fit-o-meter is feeling the burn. 😅 Take a breather and try checking the rankings again in a moment!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
};

export const handleGetShippingRanking = async (
  ctx: any,
  db: firestore.Firestore,
) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hey code shipper, this is a team effort! 🚢 Use this command in your MegaZu group to see who's the ultimate shipping champion!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
    return;
  }

  try {
    const groupId = ctx.chat.id.toString();
    const ranking = await getShippingRanking(groupId, db);
    ctx.reply(ranking);
  } catch (error) {
    console.error("Error getting shipping ranking:", error);
    ctx.reply(
      "Uh-oh! Our ship-o-meter is experiencing some turbulence. 😅 Take a moment to debug and try checking the rankings again soon!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
};

export const handleGetMindfulnessRanking = async (
  ctx: any,
  db: firestore.Firestore,
) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hey mindfulness guru, this is a group journey! 🧘‍♂️ Use this command in your MegaZu group to see who's the ultimate zen master!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
    return;
  }

  try {
    const groupId = ctx.chat.id.toString();
    const ranking = await getMindfulnessRanking(groupId, db);
    ctx.reply(ranking);
  } catch (error) {
    console.error("Error getting mindfulness ranking:", error);
    ctx.reply(
      "Uh-oh! Our zen-o-meter is feeling a bit scattered. 😅 Take a deep breath and try checking the rankings again in a moment!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
};
