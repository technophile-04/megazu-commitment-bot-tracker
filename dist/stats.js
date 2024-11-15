"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const admin = __importStar(require("firebase-admin"));
dotenv_1.default.config();
// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"),
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
function analyzeBotStats() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🤖 Analyzing MegaZu Bot Statistics");
        console.log("=================================");
        const stats = {
            totalGroups: 0,
            activeGroups: 0,
            totalUsers: 0,
            activeUsers: 0,
            activities: {
                fitness: 0,
                shipping: 0,
                mindfulness: 0,
                roasts: 0,
            },
            dailyStats: new Map(),
            monthlyStats: new Map(),
            roastStats: {
                totalRoasts: 0,
                topRoasters: [],
                dailyRoastCounts: new Map(),
                monthlyRoastCounts: new Map(),
            },
        };
        try {
            for (const groupId of GROUP_IDS) {
                const groupRef = db.collection("groups").doc(groupId);
                const usersSnapshot = yield groupRef.collection("users").get();
                if (!usersSnapshot.empty) {
                    stats.totalGroups++;
                    let groupHasActivity = false;
                    let userRoastCounts = {};
                    for (const userDoc of usersSnapshot.docs) {
                        const userData = userDoc.data();
                        stats.totalUsers++;
                        const fitnessCount = userData.fitnessCount || 0;
                        const shippingCount = userData.shippingCount || 0;
                        const mindfulnessCount = userData.mindfulnessCount || 0;
                        let totalRoasts = 0;
                        if (fitnessCount + shippingCount + mindfulnessCount > 0) {
                            stats.activeUsers++;
                            groupHasActivity = true;
                        }
                        // Aggregate activity counts
                        stats.activities.fitness += fitnessCount;
                        stats.activities.shipping += shippingCount;
                        stats.activities.mindfulness += mindfulnessCount;
                        // Process daily data including roasts
                        if (userData.dailyData) {
                            Object.entries(userData.dailyData).forEach(([date, data]) => {
                                // Initialize daily stats if not exists
                                if (!stats.dailyStats.has(date)) {
                                    stats.dailyStats.set(date, {
                                        fitness: 0,
                                        shipping: 0,
                                        mindfulness: 0,
                                        roasts: 0,
                                    });
                                }
                                const dailyStats = stats.dailyStats.get(date);
                                // Track regular activities
                                if (data.gymPhotoUploaded)
                                    dailyStats.fitness++;
                                if (data.shippingPhotoUploaded)
                                    dailyStats.shipping++;
                                if (data.mindfulnessPhotoUploaded)
                                    dailyStats.mindfulness++;
                                // Track roasts
                                const dailyRoasts = data.roastCount || 0;
                                dailyStats.roasts += dailyRoasts;
                                totalRoasts += dailyRoasts;
                                // Update daily roast counts
                                const currentDailyRoasts = stats.roastStats.dailyRoastCounts.get(date) || 0;
                                stats.roastStats.dailyRoastCounts.set(date, currentDailyRoasts + dailyRoasts);
                                // Monthly stats
                                const monthKey = date.substring(0, 7); // YYYY-MM
                                if (!stats.monthlyStats.has(monthKey)) {
                                    stats.monthlyStats.set(monthKey, {
                                        fitness: 0,
                                        shipping: 0,
                                        mindfulness: 0,
                                        roasts: 0,
                                    });
                                }
                                const monthlyStats = stats.monthlyStats.get(monthKey);
                                if (data.gymPhotoUploaded)
                                    monthlyStats.fitness++;
                                if (data.shippingPhotoUploaded)
                                    monthlyStats.shipping++;
                                if (data.mindfulnessPhotoUploaded)
                                    monthlyStats.mindfulness++;
                                monthlyStats.roasts += dailyRoasts;
                                // Update monthly roast counts
                                const currentMonthlyRoasts = stats.roastStats.monthlyRoastCounts.get(monthKey) || 0;
                                stats.roastStats.monthlyRoastCounts.set(monthKey, currentMonthlyRoasts + dailyRoasts);
                            });
                        }
                        // Track total roasts for user
                        if (totalRoasts > 0) {
                            userRoastCounts[userData.username || `User${userDoc.id}`] =
                                totalRoasts;
                        }
                    }
                    if (groupHasActivity) {
                        stats.activeGroups++;
                    }
                    // Update top roasters
                    stats.roastStats.topRoasters = Object.entries(userRoastCounts)
                        .map(([username, count]) => ({ username, roastCount: count }))
                        .sort((a, b) => b.roastCount - a.roastCount)
                        .slice(0, 10);
                }
            }
            // Calculate total roasts
            stats.activities.roasts = Array.from(stats.roastStats.dailyRoastCounts.values()).reduce((sum, count) => sum + count, 0);
            stats.roastStats.totalRoasts = stats.activities.roasts;
            // Print Overall Statistics
            console.log("\n📊 Overall Bot Statistics");
            console.log("------------------------");
            console.log(`Total Groups: ${stats.totalGroups}`);
            console.log(`Active Groups: ${stats.activeGroups}`);
            console.log(`Group Activity Rate: ${((stats.activeGroups / stats.totalGroups) * 100).toFixed(1)}%`);
            console.log(`\nTotal Users: ${stats.totalUsers}`);
            console.log(`Active Users: ${stats.activeUsers}`);
            console.log(`User Activity Rate: ${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%`);
            console.log("\n📈 Total Activities");
            console.log("-----------------");
            console.log(`Fitness Photos: ${stats.activities.fitness}`);
            console.log(`Shipping Updates: ${stats.activities.shipping}`);
            console.log(`Mindfulness Sessions: ${stats.activities.mindfulness}`);
            console.log(`Roasts: ${stats.activities.roasts}`);
            const totalActivities = stats.activities.fitness +
                stats.activities.shipping +
                stats.activities.mindfulness +
                stats.activities.roasts;
            console.log(`Total Activities: ${totalActivities}`);
            // Roast Statistics
            console.log("\n🔥 Roast Statistics");
            console.log("-----------------");
            console.log(`Total Roasts: ${stats.roastStats.totalRoasts}`);
            console.log("\nTop Roasters:");
            stats.roastStats.topRoasters.forEach((roaster, index) => {
                console.log(`${index + 1}. ${roaster.username}: ${roaster.roastCount} roasts`);
            });
            // Monthly Statistics
            console.log("\n📅 Monthly Activity Breakdown (Including Roasts)");
            console.log("------------------------------------------");
            Array.from(stats.monthlyStats.entries())
                .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date descending
                .forEach(([month, activities]) => {
                const total = activities.fitness +
                    activities.shipping +
                    activities.mindfulness +
                    activities.roasts;
                console.log(`\n${month}:`);
                console.log(`• Fitness: ${activities.fitness}`);
                console.log(`• Shipping: ${activities.shipping}`);
                console.log(`• Mindfulness: ${activities.mindfulness}`);
                console.log(`• Roasts: ${activities.roasts}`);
                console.log(`• Total: ${total}`);
            });
            // Activity Distribution
            console.log("\n📊 Activity Distribution");
            console.log("----------------------");
            console.log(`Fitness: ${((stats.activities.fitness / totalActivities) * 100).toFixed(1)}%`);
            console.log(`Shipping: ${((stats.activities.shipping / totalActivities) * 100).toFixed(1)}%`);
            console.log(`Mindfulness: ${((stats.activities.mindfulness / totalActivities) * 100).toFixed(1)}%`);
            console.log(`Roasts: ${((stats.activities.roasts / totalActivities) * 100).toFixed(1)}%`);
            // Average Activities
            console.log("\n📈 Average Metrics");
            console.log("----------------");
            console.log(`Activities per User: ${(totalActivities / stats.activeUsers).toFixed(1)}`);
            console.log(`Activities per Group: ${(totalActivities / stats.activeGroups).toFixed(1)}`);
            console.log(`Users per Group: ${(stats.totalUsers / stats.totalGroups).toFixed(1)}`);
            console.log(`Roasts per Active User: ${(stats.activities.roasts / stats.activeUsers).toFixed(1)}`);
        }
        catch (error) {
            console.error("Error analyzing bot stats:", error);
            if (error instanceof Error) {
                console.error("Error details:", error.message);
            }
        }
    });
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
