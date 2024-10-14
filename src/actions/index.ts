import { Context } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import axios from "axios";
import {
  getRanking,
  getShippingRanking,
  updateUserCount,
} from "../firebase/queries";
import {
  analyzeAndRoastGymPhoto,
  analyzeAndRoastShippingPhoto,
} from "../openai";
import { getCurrentDate } from "../utils";
import { firestore } from "firebase-admin";
import { acquireLock, releaseLock } from "../firebase";

export const handlePhotoSent = async (
  ctx: Context,
  db: firestore.Firestore,
) => {
  const msg = ctx.message as Message.PhotoMessage;

  // Check if the caption contains "/pumped", "/pump", or "/shipped"
  if (!msg.caption || !/\/pumped|\/pump|\/shipped/i.test(msg.caption)) {
    // If not a valid command, ignore this photo
    return;
  }

  const isShipping = /\/shipped/i.test(msg.caption);

  if (ctx.chat?.type === "private") {
    await ctx.reply(
      `Whoa there, solo ${isShipping ? "coder" : "athlete"}! 🐺 Add me to your crew (group) to start the ultimate ${isShipping ? "shipping" : "fitness"} party!`,
      { reply_parameters: { message_id: msg.message_id } },
    );
    return;
  }

  try {
    const userId = ctx.from?.id.toString();
    const username =
      ctx.from?.first_name ||
      ctx.from?.username ||
      (isShipping ? "Code Shipper" : "Fitness Enthusiast");
    const groupId = ctx.chat?.id.toString();

    if (!userId || !groupId) {
      await ctx.reply(
        `Oops! Our ${isShipping ? "ship-o-meter" : "fit-o-meter"} malfunctioned. 🔧 Give it a quick rest and try ${isShipping ? "shipping" : "flexing"} again!`,
        { reply_parameters: { message_id: msg.message_id } },
      );
      return;
    }

    const lockRef = db.collection("locks").doc(`${groupId}_${userId}`);
    const acquired = await acquireLock(lockRef, 10000, db);

    if (!acquired) {
      await ctx.reply(
        `Easy there, turbo ${isShipping ? "shipper" : "athlete"}! 🏃‍♂️💨 We're still processing your last ${isShipping ? "commit" : "rep"}. Give us a sec to catch our breath!`,
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
        attempts: 0,
      };

      if (
        (isShipping && todayData.shippingPhotoUploaded) ||
        (!isShipping && todayData.gymPhotoUploaded)
      ) {
        await ctx.reply(
          `Whoa, ${username}! 🏆 You've already logged your daily ${isShipping ? "shipping" : "fitness"} activity. Save some amazement for tomorrow, you beast!`,
          { reply_parameters: { message_id: msg.message_id } },
        );
        return;
      }

      if (todayData.attempts >= 5) {
        await ctx.reply(
          `Hold up, ${username}! 🛑 You've hit your daily attempt limit. Time to rest those ${isShipping ? "fingers" : "muscles"} and come back more ${isShipping ? "productive" : "energized"} tomorrow! ${isShipping ? "⌨️😴" : "💪😴"}`,
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

      const [isValidPhoto, roast] = isShipping
        ? await analyzeAndRoastShippingPhoto(photoBuffer, username)
        : await analyzeAndRoastGymPhoto(photoBuffer, username);

      if (isValidPhoto) {
        await updateUserCount(ctx, currentDate, isShipping, db);
        // No need to update todayData here, as it's handled in updateUserCount
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
      `Error processing ${isShipping ? "shipping" : "fitness"} activity:`,
      error,
    );
    await ctx.reply(
      `Oof! 😅 Looks like our bot's ${isShipping ? "code" : "workout"} routine hit a snag. Let's take a quick break and try that again!`,
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
