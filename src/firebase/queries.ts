import { Context } from "telegraf";
import { db } from ".";
import { getPlacementEmoji } from "../utils";

export async function updateUserCount(ctx: Context, currentDate: string) {
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

export async function getRanking(groupId: string): Promise<string> {
  try {
    const usersSnapshot = await db
      .collection("groups")
      .doc(groupId)
      .collection("users")
      .orderBy("photoCount", "desc")
      .limit(10)
      .get();

    let ranking = "🏆 MegaLyfters Pump Hall of Fame 🏆\n\n";
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const emoji = getPlacementEmoji(index);
      ranking += `${emoji} ${data.username}: ${data.photoCount} epic pumps\n`;
    });

    return (
      ranking ||
      "No pumps yet? Time to inflate those muscles, MegaLyfters! 📸💪"
    );
  } catch (error) {
    console.error("Error getting ranking:", error);
    return "Oops! Our ranking board is doing extra reps. 🏋️‍♀️ Give it a moment to cool down and try again!";
  }
}
