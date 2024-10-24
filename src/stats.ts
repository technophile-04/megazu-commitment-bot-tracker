import dotenv from "dotenv";
import * as admin from "firebase-admin";
dotenv.config();

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

// All group IDs
const GROUP_IDS = [
  "-1002236631045",
  "-1002256499105",
  "-1002274579137",
  "-1002379220368",
  "-1002396839167",
  "-1002452571558",
  "-1002492296339",
  "-4124419742",
  "-4561718797",
  "-4572971953",
  "-4587288412",
  "-4588092579",
  "-4597766655",
];

interface BotStats {
  totalGroups: number;
  activeGroups: number;
  totalUsers: number;
  activeUsers: number;
  activities: {
    fitness: number;
    shipping: number;
    mindfulness: number;
  };
  dailyStats: Map<
    string,
    {
      fitness: number;
      shipping: number;
      mindfulness: number;
    }
  >;
  monthlyStats: Map<
    string,
    {
      fitness: number;
      shipping: number;
      mindfulness: number;
    }
  >;
}

async function analyzeBotStats() {
  console.log("🤖 Analyzing MegaZu Bot Statistics");
  console.log("=================================");

  const stats: BotStats = {
    totalGroups: 0,
    activeGroups: 0,
    totalUsers: 0,
    activeUsers: 0,
    activities: {
      fitness: 0,
      shipping: 0,
      mindfulness: 0,
    },
    dailyStats: new Map(),
    monthlyStats: new Map(),
  };

  try {
    for (const groupId of GROUP_IDS) {
      const groupRef = db.collection("groups").doc(groupId);
      const usersSnapshot = await groupRef.collection("users").get();

      if (!usersSnapshot.empty) {
        stats.totalGroups++;
        let groupHasActivity = false;

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          stats.totalUsers++;

          const fitnessCount = userData.fitnessCount || 0;
          const shippingCount = userData.shippingCount || 0;
          const mindfulnessCount = userData.mindfulnessCount || 0;

          if (fitnessCount + shippingCount + mindfulnessCount > 0) {
            stats.activeUsers++;
            groupHasActivity = true;
          }

          // Aggregate activity counts
          stats.activities.fitness += fitnessCount;
          stats.activities.shipping += shippingCount;
          stats.activities.mindfulness += mindfulnessCount;

          // Process daily data
          if (userData.dailyData) {
            Object.entries(userData.dailyData).forEach(
              ([date, data]: [string, any]) => {
                // Daily stats
                if (!stats.dailyStats.has(date)) {
                  stats.dailyStats.set(date, {
                    fitness: 0,
                    shipping: 0,
                    mindfulness: 0,
                  });
                }
                const dailyStats = stats.dailyStats.get(date)!;
                if (data.gymPhotoUploaded) dailyStats.fitness++;
                if (data.shippingPhotoUploaded) dailyStats.shipping++;
                if (data.mindfulnessPhotoUploaded) dailyStats.mindfulness++;

                // Monthly stats
                const monthKey = date.substring(0, 7); // YYYY-MM
                if (!stats.monthlyStats.has(monthKey)) {
                  stats.monthlyStats.set(monthKey, {
                    fitness: 0,
                    shipping: 0,
                    mindfulness: 0,
                  });
                }
                const monthlyStats = stats.monthlyStats.get(monthKey)!;
                if (data.gymPhotoUploaded) monthlyStats.fitness++;
                if (data.shippingPhotoUploaded) monthlyStats.shipping++;
                if (data.mindfulnessPhotoUploaded) monthlyStats.mindfulness++;
              },
            );
          }
        }

        if (groupHasActivity) {
          stats.activeGroups++;
        }
      }
    }

    // Print Overall Statistics
    console.log("\n📊 Overall Bot Statistics");
    console.log("------------------------");
    console.log(`Total Groups: ${stats.totalGroups}`);
    console.log(`Active Groups: ${stats.activeGroups}`);
    console.log(
      `Group Activity Rate: ${((stats.activeGroups / stats.totalGroups) * 100).toFixed(1)}%`,
    );
    console.log(`\nTotal Users: ${stats.totalUsers}`);
    console.log(`Active Users: ${stats.activeUsers}`);
    console.log(
      `User Activity Rate: ${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%`,
    );

    console.log("\n📈 Total Activities");
    console.log("-----------------");
    console.log(`Fitness Photos: ${stats.activities.fitness}`);
    console.log(`Shipping Updates: ${stats.activities.shipping}`);
    console.log(`Mindfulness Sessions: ${stats.activities.mindfulness}`);
    const totalActivities =
      stats.activities.fitness +
      stats.activities.shipping +
      stats.activities.mindfulness;
    console.log(`Total Activities: ${totalActivities}`);

    // Monthly Statistics
    console.log("\n📅 Monthly Activity Breakdown");
    console.log("---------------------------");
    Array.from(stats.monthlyStats.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date descending
      .forEach(([month, activities]) => {
        const total =
          activities.fitness + activities.shipping + activities.mindfulness;
        console.log(`\n${month}:`);
        console.log(`• Fitness: ${activities.fitness}`);
        console.log(`• Shipping: ${activities.shipping}`);
        console.log(`• Mindfulness: ${activities.mindfulness}`);
        console.log(`• Total: ${total}`);
      });

    // Activity Distribution
    console.log("\n📊 Activity Distribution");
    console.log("----------------------");
    console.log(
      `Fitness: ${((stats.activities.fitness / totalActivities) * 100).toFixed(1)}%`,
    );
    console.log(
      `Shipping: ${((stats.activities.shipping / totalActivities) * 100).toFixed(1)}%`,
    );
    console.log(
      `Mindfulness: ${((stats.activities.mindfulness / totalActivities) * 100).toFixed(1)}%`,
    );

    // Average Activities
    console.log("\n📈 Average Metrics");
    console.log("----------------");
    console.log(
      `Activities per User: ${(totalActivities / stats.activeUsers).toFixed(1)}`,
    );
    console.log(
      `Activities per Group: ${(totalActivities / stats.activeGroups).toFixed(1)}`,
    );
    console.log(
      `Users per Group: ${(stats.totalUsers / stats.totalGroups).toFixed(1)}`,
    );
  } catch (error) {
    console.error("Error analyzing bot stats:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

// Run the analysis
analyzeBotStats()
  .then(() => {
    console.log("\n✨ Analysis completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running analysis:", error);
    process.exit(1);
  });
