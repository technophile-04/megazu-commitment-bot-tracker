import { Context, Telegraf } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";
import { acquireLock, releaseLock, db } from "../firebase";
import axios from "axios";
import { getRanking, updateUserCount } from "../firebase/queries";
import { analyzeAndRoastPhoto } from "../openai";
import { getCurrentDate } from "../utils";

export const handlePhotoSent = async (ctx: Context) => {
  const msg = ctx.message as Message.PhotoMessage;

  // Check if the caption contains "/pumped" or "/pump"
  if (!msg.caption || !/\/pumped|\/pump/i.test(msg.caption)) {
    // If not a pump command, ignore this photo
    return;
  }

  if (ctx.chat?.type === "private") {
    await ctx.reply(
      "Whoa there, solo lifter! 🐺 Add me to your crew (group) to start the ultimate pump party!",
      { reply_parameters: { message_id: msg.message_id } },
    );
    return;
  }

  try {
    const userId = ctx.from?.id.toString();
    const username =
      ctx.from?.first_name || ctx.from?.username || "Iron Pumper";
    const groupId = ctx.chat?.id.toString();

    if (!userId || !groupId) {
      await ctx.reply(
        "Oops! Our pump-o-meter malfunctioned. 🏋️‍♂️🔧 Give it a quick rest and try flexing again!",
        { reply_parameters: { message_id: msg.message_id } },
      );
      return;
    }

    const lockRef = db.collection("locks").doc(`${groupId}_${userId}`);
    const acquired = await acquireLock(lockRef);

    if (!acquired) {
      await ctx.reply(
        "Easy there, turbo lifter! 🏃‍♂️💨 We're still admiring your last pump. Give us a sec to catch our breath!",
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
        attempts: 0,
      };

      if (todayData.gymPhotoUploaded) {
        await ctx.reply(
          `Whoa, ${username}! 🏆 You've already maxed out your daily pump showcase. Save some amazement for tomorrow, you beast!`,
          { reply_parameters: { message_id: msg.message_id } },
        );
        return;
      }

      if (!todayData.gymPhotoUploaded && todayData.attempts >= 5) {
        await ctx.reply(
          `Hold up, ${username}! 🛑 You've hit your daily pump limit. Time to rest those muscles and come back more pumped tomorrow! 💪😴`,
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
        reply_parameters: { message_id: msg.message_id },
      });
    } finally {
      await releaseLock(lockRef);
    }
  } catch (error) {
    console.error("Error processing pump:", error);
    await ctx.reply(
      "Oof! 😅 Looks like our bot's pump deflated a bit. Let's take a quick pre-workout break and try that again!",
      { reply_parameters: { message_id: msg.message_id } },
    );
  }
};

export const handleGetRanking: Parameters<
  Telegraf<Context<Update>>["command"]
>[1] = async (ctx) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Hey pump master, this is a team sport! 🏆 Use this command in your MegaLyfters group to see who's the ultimate pump champion!",
      { reply_parameters: { message_id: ctx.message.message_id } },
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
      "Uh-oh! Our pump-o-meter is feeling the burn. 😅 Take a breather and try checking the rankings again in a moment!",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
};
