"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserCount = updateUserCount;
exports.getRanking = getRanking;
exports.getShippingRanking = getShippingRanking;
exports.updateGroupMindfulnessCount = updateGroupMindfulnessCount;
exports.getMindfulnessRanking = getMindfulnessRanking;
const utils_1 = require("../utils");
function updateUserCount(ctx, currentDate, isShipping, isMindfulness, db) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id.toString();
        const username = ((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.username) || ((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.first_name) || "Anonymous";
        const groupId = (_d = ctx.chat) === null || _d === void 0 ? void 0 : _d.id.toString();
        if (!userId || !groupId)
            return;
        const userRef = db
            .collection("groups")
            .doc(groupId)
            .collection("users")
            .doc(userId);
        yield db.runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
            const userDoc = yield transaction.get(userRef);
            const userData = userDoc.data() || {};
            const dailyData = userData.dailyData || {};
            const todayData = dailyData[currentDate] || {
                gymPhotoUploaded: false,
                shippingPhotoUploaded: false,
                mindfulnessPhotoUploaded: false,
                attempts: 0,
            };
            let fitnessCount = userData.fitnessCount || 0;
            let shippingCount = userData.shippingCount || 0;
            let mindfulnessCount = userData.mindfulnessCount || 0;
            if (isMindfulness && !todayData.mindfulnessPhotoUploaded) {
                todayData.mindfulnessPhotoUploaded = true;
                mindfulnessCount += 1;
            }
            else if (isShipping && !todayData.shippingPhotoUploaded) {
                todayData.shippingPhotoUploaded = true;
                shippingCount += 1;
            }
            else if (!isShipping && !isMindfulness && !todayData.gymPhotoUploaded) {
                todayData.gymPhotoUploaded = true;
                fitnessCount += 1;
            }
            // Always increment attempts
            todayData.attempts += 1;
            transaction.set(userRef, {
                fitnessCount,
                shippingCount,
                mindfulnessCount,
                username,
                dailyData: Object.assign(Object.assign({}, dailyData), { [currentDate]: todayData }),
            }, { merge: true });
        }));
    });
}
function getRanking(groupId, db) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const usersSnapshot = yield db
                .collection("groups")
                .doc(groupId)
                .collection("users")
                .orderBy("fitnessCount", "desc")
                .limit(10)
                .get();
            let ranking = "🏆 MegaZu Fitness Hall of Fame 🏆\n\n";
            usersSnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                const emoji = (0, utils_1.getPlacementEmoji)(index);
                ranking += `${emoji} ${data.username}: ${data.fitnessCount} epic workouts\n`;
            });
            return (ranking ||
                "No workouts logged yet? Time to get moving, MegaZu athletes! 💪🏋️‍♀️");
        }
        catch (error) {
            console.error("Error getting fitness ranking:", error);
            return "Oops! Our ranking board is doing extra reps. 🏋️‍♀️ Give it a moment to cool down and try again!";
        }
    });
}
function getShippingRanking(groupId, db) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const usersSnapshot = yield db
                .collection("groups")
                .doc(groupId)
                .collection("users")
                .orderBy("shippingCount", "desc")
                .limit(10)
                .get();
            let ranking = "🚢 MegaZu Shipping Hall of Fame 🚢\n\n";
            usersSnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                const emoji = (0, utils_1.getPlacementEmoji)(index);
                ranking += `${emoji} ${data.username}: ${data.shippingCount} epic ships\n`;
            });
            return (ranking ||
                "No ships launched yet? Time to start coding and shipping, MegaZu developers! 👩‍💻🚀");
        }
        catch (error) {
            console.error("Error getting shipping ranking:", error);
            return "Oops! Our ranking board is experiencing a bug. 🐛 Give it a moment to deploy a fix and try again!";
        }
    });
}
function updateGroupMindfulnessCount(groupId, mentionedUsers, db, currentDate) {
    return __awaiter(this, void 0, void 0, function* () {
        const groupRef = db.collection("groups").doc(groupId);
        const batch = db.batch();
        for (const username of mentionedUsers) {
            const userQuery = yield groupRef
                .collection("users")
                .where("username", "==", username)
                .limit(1)
                .get();
            if (!userQuery.empty) {
                const userDoc = userQuery.docs[0];
                const userData = userDoc.data();
                const userMindfulnessCount = userData.mindfulnessCount || 0;
                const dailyData = userData.dailyData || {};
                const todayData = dailyData[currentDate] || {
                    gymPhotoUploaded: false,
                    shippingPhotoUploaded: false,
                    mindfulnessPhotoUploaded: false,
                    attempts: 0,
                };
                // Only update if not already uploaded today
                if (!todayData.mindfulnessPhotoUploaded) {
                    todayData.mindfulnessPhotoUploaded = true;
                    batch.set(userDoc.ref, {
                        mindfulnessCount: userMindfulnessCount + 1,
                        dailyData: Object.assign(Object.assign({}, dailyData), { [currentDate]: todayData }),
                    }, { merge: true });
                }
            }
        }
        yield batch.commit();
    });
}
function getMindfulnessRanking(groupId, db) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const usersSnapshot = yield db
                .collection("groups")
                .doc(groupId)
                .collection("users")
                .orderBy("mindfulnessCount", "desc")
                .limit(10)
                .get();
            let ranking = "🧘 MegaZu Mindfulness Hall of Zen 🧘\n\n";
            if (usersSnapshot.empty) {
                return "No zen moments logged yet? Time to start finding your inner peace, MegaZu mindfulness seekers! 🧘‍♂️✨";
            }
            usersSnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                const emoji = (0, utils_1.getPlacementEmoji)(index);
                ranking += `${emoji} ${data.username}: ${data.mindfulnessCount} zen moment${data.mindfulnessCount !== 1 ? "s" : ""}\n`;
            });
            return ranking;
        }
        catch (error) {
            console.error("Error getting mindfulness ranking:", error);
            return "Oops! Our zen-o-meter is experiencing a moment of chaos. 🌪️ Take a deep breath, and we'll try again soon!";
        }
    });
}
