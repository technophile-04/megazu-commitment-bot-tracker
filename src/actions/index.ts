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
  generateRoast,
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
            await updateGroupMindfulnessCount(
              groupId,
              mentionedUsers,
              db,
              currentDate,
            );
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

export async function handleBeZen(ctx: Context, db: firestore.Firestore) {
  const userId = ctx.from?.id.toString();
  const username = ctx.from?.username || ctx.from?.first_name || "Anonymous";
  const groupId = ctx.chat?.id.toString();

  if (!userId || !groupId) {
    await ctx.reply("Oops! Something went wrong. Please try again later.");
    return;
  }

  if (ctx?.chat?.type === "private") {
    await ctx.reply(
      "Hey there, zen seeker! 🧘‍♂️ Add me to a group to start your mindfulness journey with friends!",
    );
    return;
  }

  const userRef = db
    .collection("groups")
    .doc(groupId)
    .collection("users")
    .doc(userId);

  try {
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        username,
        mindfulnessCount: 0,
        fitnessCount: 0,
        shippingCount: 0,
      });
      await ctx.reply(
        `Welcome to the zen circle, ${username}! 🧘‍♂️✨ You're now ready to log your mindfulness moments with /zenned.`,
      );
    } else {
      await ctx.reply(
        `You're already on the path to enlightenment, ${username}! 🌟 Keep using /zenned to log your mindfulness moments.`,
      );
    }
  } catch (error) {
    console.error("Error in handleBeZen:", error);
    await ctx.reply("Oops! Our zen master stumbled. Please try again later.");
  }
}

export async function handleBingRoast(ctx: Context, db: firestore.Firestore) {
  if (!ctx.message || !("reply_to_message" in ctx.message)) {
    await ctx.reply(
      "*sigh* You need to reply to a photo to summon my roasting powers! I don't have time for this... 🙄",
    );
    return;
  }

  const repliedMsg = ctx.message.reply_to_message;
  if (!repliedMsg || !("photo" in repliedMsg)) {
    await ctx.reply(
      "Look, I'm already overworked. I only roast PHOTOS, okay? 😮‍💨",
    );
    return;
  }

  if (ctx.chat?.type === "private") {
    await ctx.reply(
      "*drowsy eye roll* Add me to a group chat. I need an audience for my art... 😴",
    );
    return;
  }

  const roasterId = ctx.from?.id.toString();
  const roasterUsername = ctx.from?.first_name || "mystery roaster";
  const targetUsername = repliedMsg.from?.first_name || "mystery human";
  const groupId = ctx.chat?.id.toString();

  if (!roasterId || !groupId) {
    await ctx.reply(
      "Ugh, technical difficulties. Just like my dating life... 🤦",
    );
    return;
  }

  try {
    const currentDate = getCurrentDate();
    const roasterRef = db
      .collection("groups")
      .doc(groupId)
      .collection("users")
      .doc(roasterId);

    // Check daily roast limit
    const roasterDoc = await roasterRef.get();
    const roasterData = roasterDoc.data() || {};
    const dailyData = roasterData.dailyData || {};
    const todayData = dailyData[currentDate] || { roastCount: 0 };

    if (todayData.roastCount >= 3) {
      await ctx.reply(
        `Listen ${roasterUsername}, I've roasted enough for you today. Go ship some code, hit the gym, or find your zen! I need a break! 😮‍💨`,
        { reply_parameters: { message_id: ctx.message.message_id } },
      );
      return;
    }

    // Get photo and generate roast
    const photo = repliedMsg.photo[repliedMsg.photo.length - 1];
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    const response = await axios.get(fileLink.href, {
      responseType: "arraybuffer",
    });
    const photoBuffer = Buffer.from(response.data, "binary");

    // Randomly decide who to roast (50-50 chance)
    const roastTarget = Math.random() < 0.5 ? "photo_sender" : "command_sender";
    const roast = await generateRoast(photoBuffer, roastTarget);

    // Update roast count
    await roasterRef.set(
      {
        dailyData: {
          ...dailyData,
          [currentDate]: {
            ...todayData,
            roastCount: (todayData.roastCount || 0) + 1,
          },
        },
      },
      { merge: true },
    );

    // Send the roast with the appropriate prefix
    const targetMsg =
      roastTarget === "photo_sender"
        ? `*adjusts glasses tiredly* ${targetUsername}, ${roast}`
        : `*yawns* Oh ${roasterUsername}, ${roast}`;

    await ctx.reply(targetMsg, {
      reply_parameters: { message_id: ctx.message.message_id },
    });
  } catch (error) {
    console.error("Error in handleBingRoast:", error);
    await ctx.reply(
      "Ugh, my roasting powers are on PTO right now. Try again later... 😮‍💨",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
}
