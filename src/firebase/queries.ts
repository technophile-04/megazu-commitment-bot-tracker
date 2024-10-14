import { Context } from "telegraf";
import { getPlacementEmoji } from "../utils";
import { firestore } from "firebase-admin";

export async function updateUserCount(
  ctx: Context,
  currentDate: string,
  isShipping: boolean,
  db: firestore.Firestore,
) {
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
    const dailyData = userData.dailyData || {};
    const todayData = dailyData[currentDate] || {
      gymPhotoUploaded: false,
      shippingPhotoUploaded: false,
      attempts: 0,
    };

    // Only increment the count if it hasn't been done for the day
    let fitnessCount = userData.fitnessCount || 0;
    let shippingCount = userData.shippingCount || 0;

    if (isShipping && !todayData.shippingPhotoUploaded) {
      todayData.shippingPhotoUploaded = true;
      shippingCount += 1;
    } else if (!isShipping && !todayData.gymPhotoUploaded) {
      todayData.gymPhotoUploaded = true;
      fitnessCount += 1;
    }

    // Always increment attempts
    todayData.attempts += 1;

    transaction.set(
      userRef,
      {
        fitnessCount,
        shippingCount,
        username,
        dailyData: {
          ...dailyData,
          [currentDate]: todayData,
        },
      },
      { merge: true },
    );
  });
}

export async function getRanking(
  groupId: string,
  db: firestore.Firestore,
): Promise<string> {
  try {
    const usersSnapshot = await db
      .collection("groups")
      .doc(groupId)
      .collection("users")
      .orderBy("fitnessCount", "desc")
      .limit(10)
      .get();

    let ranking = "🏆 MegaZu Fitness Hall of Fame 🏆\n\n";
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const emoji = getPlacementEmoji(index);
      ranking += `${emoji} ${data.username}: ${data.fitnessCount} epic workouts\n`;
    });

    return (
      ranking ||
      "No workouts logged yet? Time to get moving, MegaZu athletes! 💪🏋️‍♀️"
    );
  } catch (error) {
    console.error("Error getting fitness ranking:", error);
    return "Oops! Our ranking board is doing extra reps. 🏋️‍♀️ Give it a moment to cool down and try again!";
  }
}

export async function getShippingRanking(
  groupId: string,
  db: firestore.Firestore,
): Promise<string> {
  try {
    const usersSnapshot = await db
      .collection("groups")
      .doc(groupId)
      .collection("users")
      .orderBy("shippingCount", "desc")
      .limit(10)
      .get();

    let ranking = "🚢 MegaZu Shipping Hall of Fame 🚢\n\n";
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const emoji = getPlacementEmoji(index);
      ranking += `${emoji} ${data.username}: ${data.shippingCount} epic ships\n`;
    });

    return (
      ranking ||
      "No ships launched yet? Time to start coding and shipping, MegaZu developers! 👩‍💻🚀"
    );
  } catch (error) {
    console.error("Error getting shipping ranking:", error);
    return "Oops! Our ranking board is experiencing a bug. 🐛 Give it a moment to deploy a fix and try again!";
  }
}
