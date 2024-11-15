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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetMindfulnessRanking = exports.handleGetShippingRanking = exports.handleGetRanking = exports.handlePhotoSent = void 0;
exports.handleBeZen = handleBeZen;
exports.handleBingRoast = handleBingRoast;
const axios_1 = __importDefault(require("axios"));
const queries_1 = require("../firebase/queries");
const openai_1 = require("../openai");
const utils_1 = require("../utils");
const firebase_1 = require("../firebase");
const handlePhotoSent = (ctx, db) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const msg = ctx.message;
    // Check if the caption contains "/pumped", "/pump", "/shipped", or "/zenned"
    if (!msg.caption ||
        !/\/pumped|\/pump|\/shipped|\/zenned/i.test(msg.caption)) {
        // If not a valid command, ignore this photo
        return;
    }
    const isShipping = /\/shipped/i.test(msg.caption);
    const isMindfulness = /\/zenned/i.test(msg.caption);
    if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "private") {
        yield ctx.reply(`Whoa there, solo ${isMindfulness ? "zen seeker" : isShipping ? "coder" : "athlete"}! 🐺 Add me to your crew (group) to start the ultimate ${isMindfulness ? "mindfulness" : isShipping ? "shipping" : "fitness"} party!`, { reply_parameters: { message_id: msg.message_id } });
        return;
    }
    try {
        const userId = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id.toString();
        const username = ((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.first_name) ||
            ((_d = ctx.from) === null || _d === void 0 ? void 0 : _d.username) ||
            (isMindfulness
                ? "Mindfulness Enthusiast"
                : isShipping
                    ? "Code Shipper"
                    : "Fitness Enthusiast");
        const groupId = (_e = ctx.chat) === null || _e === void 0 ? void 0 : _e.id.toString();
        if (!userId || !groupId) {
            yield ctx.reply(`Oops! Our ${isMindfulness ? "zen-o-meter" : isShipping ? "ship-o-meter" : "fit-o-meter"} malfunctioned. 🔧 Give it a quick rest and try ${isMindfulness ? "finding your center" : isShipping ? "shipping" : "flexing"} again!`, { reply_parameters: { message_id: msg.message_id } });
            return;
        }
        const lockRef = db.collection("locks").doc(`${groupId}_${userId}`);
        const acquired = yield (0, firebase_1.acquireLock)(lockRef, 10000, db);
        if (!acquired) {
            yield ctx.reply(`Easy there, turbo ${isMindfulness ? "zen seeker" : isShipping ? "shipper" : "athlete"}! 🧘‍♂️💨 We're still processing your last ${isMindfulness ? "moment of zen" : isShipping ? "commit" : "rep"}. Give us a sec to find our balance!`, { reply_parameters: { message_id: msg.message_id } });
            return;
        }
        try {
            const currentDate = (0, utils_1.getCurrentDate)();
            const userRef = db
                .collection("groups")
                .doc(groupId)
                .collection("users")
                .doc(userId);
            // Check user's daily status
            const userDoc = yield userRef.get();
            const userData = userDoc.data() || {};
            const dailyData = userData.dailyData || {};
            const todayData = dailyData[currentDate] || {
                gymPhotoUploaded: false,
                shippingPhotoUploaded: false,
                mindfulnessPhotoUploaded: false,
                attempts: 0,
            };
            if ((isMindfulness && todayData.mindfulnessPhotoUploaded) ||
                (isShipping && todayData.shippingPhotoUploaded) ||
                (!isShipping && !isMindfulness && todayData.gymPhotoUploaded)) {
                yield ctx.reply(`Whoa, ${username}! 🏆 You've already logged your daily ${isMindfulness ? "mindfulness" : isShipping ? "shipping" : "fitness"} activity. Save some amazement for tomorrow, you ${isMindfulness ? "enlightened being" : "beast"}!`, { reply_parameters: { message_id: msg.message_id } });
                return;
            }
            if (todayData.attempts >= 5) {
                yield ctx.reply(`Hold up, ${username}! 🛑 You've hit your daily attempt limit. Time to rest those ${isMindfulness ? "thoughts" : isShipping ? "fingers" : "muscles"} and come back more ${isMindfulness ? "centered" : isShipping ? "productive" : "energized"} tomorrow! ${isMindfulness ? "🧘‍♂️😴" : isShipping ? "⌨️😴" : "💪😴"}`, { reply_parameters: { message_id: msg.message_id } });
                return;
            }
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileLink = yield ctx.telegram.getFileLink(fileId);
            const response = yield axios_1.default.get(fileLink.href, {
                responseType: "arraybuffer",
            });
            const photoBuffer = Buffer.from(response.data, "binary");
            let isValidPhoto;
            let roast;
            if (isMindfulness) {
                [isValidPhoto, roast] = yield (0, openai_1.analyzeAndRoastMindfulnessPhoto)(photoBuffer, username);
            }
            else if (isShipping) {
                [isValidPhoto, roast] = yield (0, openai_1.analyzeAndRoastShippingPhoto)(photoBuffer, username);
            }
            else {
                [isValidPhoto, roast] = yield (0, openai_1.analyzeAndRoastGymPhoto)(photoBuffer, username);
            }
            if (isValidPhoto) {
                yield (0, queries_1.updateUserCount)(ctx, currentDate, isShipping, isMindfulness, db);
                if (isMindfulness) {
                    const mentionedUsers = (0, utils_1.extractMentions)(msg.caption);
                    if (mentionedUsers.length > 0) {
                        yield (0, queries_1.updateGroupMindfulnessCount)(groupId, mentionedUsers, db, currentDate);
                        roast += `\n\nLook at you, spreading the zen! ${mentionedUsers.join(", ")} ${mentionedUsers.length > 1 ? "are" : "is"} now part of your mindfulness circle! 🧘‍♂️🧘‍♀️`;
                    }
                }
            }
            else {
                // Only increment attempts for invalid photos
                yield userRef.set({
                    dailyData: Object.assign(Object.assign({}, dailyData), { [currentDate]: Object.assign(Object.assign({}, todayData), { attempts: todayData.attempts + 1 }) }),
                }, { merge: true });
            }
            yield ctx.reply(roast, {
                reply_parameters: { message_id: msg.message_id },
            });
        }
        finally {
            yield (0, firebase_1.releaseLock)(lockRef);
        }
    }
    catch (error) {
        console.error(`Error processing ${isMindfulness ? "mindfulness" : isShipping ? "shipping" : "fitness"} activity:`, error);
        yield ctx.reply(`Oof! 😅 Looks like our bot's ${isMindfulness ? "zen" : isShipping ? "code" : "workout"} routine hit a snag. Let's take a quick break and try that again!`, { reply_parameters: { message_id: msg.message_id } });
    }
});
exports.handlePhotoSent = handlePhotoSent;
const handleGetRanking = (ctx, db) => __awaiter(void 0, void 0, void 0, function* () {
    if (ctx.chat.type === "private") {
        ctx.reply("Hey fitness champion, this is a team sport! 🏆 Use this command in your MegaZu group to see who's the ultimate fitness guru!", { reply_parameters: { message_id: ctx.message.message_id } });
        return;
    }
    try {
        const groupId = ctx.chat.id.toString();
        const ranking = yield (0, queries_1.getRanking)(groupId, db);
        ctx.reply(ranking);
    }
    catch (error) {
        console.error("Error getting fitness ranking:", error);
        ctx.reply("Uh-oh! Our fit-o-meter is feeling the burn. 😅 Take a breather and try checking the rankings again in a moment!", { reply_parameters: { message_id: ctx.message.message_id } });
    }
});
exports.handleGetRanking = handleGetRanking;
const handleGetShippingRanking = (ctx, db) => __awaiter(void 0, void 0, void 0, function* () {
    if (ctx.chat.type === "private") {
        ctx.reply("Hey code shipper, this is a team effort! 🚢 Use this command in your MegaZu group to see who's the ultimate shipping champion!", { reply_parameters: { message_id: ctx.message.message_id } });
        return;
    }
    try {
        const groupId = ctx.chat.id.toString();
        const ranking = yield (0, queries_1.getShippingRanking)(groupId, db);
        ctx.reply(ranking);
    }
    catch (error) {
        console.error("Error getting shipping ranking:", error);
        ctx.reply("Uh-oh! Our ship-o-meter is experiencing some turbulence. 😅 Take a moment to debug and try checking the rankings again soon!", { reply_parameters: { message_id: ctx.message.message_id } });
    }
});
exports.handleGetShippingRanking = handleGetShippingRanking;
const handleGetMindfulnessRanking = (ctx, db) => __awaiter(void 0, void 0, void 0, function* () {
    if (ctx.chat.type === "private") {
        ctx.reply("Hey mindfulness guru, this is a group journey! 🧘‍♂️ Use this command in your MegaZu group to see who's the ultimate zen master!", { reply_parameters: { message_id: ctx.message.message_id } });
        return;
    }
    try {
        const groupId = ctx.chat.id.toString();
        const ranking = yield (0, queries_1.getMindfulnessRanking)(groupId, db);
        ctx.reply(ranking);
    }
    catch (error) {
        console.error("Error getting mindfulness ranking:", error);
        ctx.reply("Uh-oh! Our zen-o-meter is feeling a bit scattered. 😅 Take a deep breath and try checking the rankings again in a moment!", { reply_parameters: { message_id: ctx.message.message_id } });
    }
});
exports.handleGetMindfulnessRanking = handleGetMindfulnessRanking;
function handleBeZen(ctx, db) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id.toString();
        const username = ((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.username) || ((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.first_name) || "Anonymous";
        const groupId = (_d = ctx.chat) === null || _d === void 0 ? void 0 : _d.id.toString();
        if (!userId || !groupId) {
            yield ctx.reply("Oops! Something went wrong. Please try again later.");
            return;
        }
        if (((_e = ctx === null || ctx === void 0 ? void 0 : ctx.chat) === null || _e === void 0 ? void 0 : _e.type) === "private") {
            yield ctx.reply("Hey there, zen seeker! 🧘‍♂️ Add me to a group to start your mindfulness journey with friends!");
            return;
        }
        const userRef = db
            .collection("groups")
            .doc(groupId)
            .collection("users")
            .doc(userId);
        try {
            const userDoc = yield userRef.get();
            if (!userDoc.exists) {
                yield userRef.set({
                    username,
                    mindfulnessCount: 0,
                    fitnessCount: 0,
                    shippingCount: 0,
                });
                yield ctx.reply(`Welcome to the zen circle, ${username}! 🧘‍♂️✨ You're now ready to log your mindfulness moments with /zenned.`);
            }
            else {
                yield ctx.reply(`You're already on the path to enlightenment, ${username}! 🌟 Keep using /zenned to log your mindfulness moments.`);
            }
        }
        catch (error) {
            console.error("Error in handleBeZen:", error);
            yield ctx.reply("Oops! Our zen master stumbled. Please try again later.");
        }
    });
}
function handleBingRoast(ctx, db) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!ctx.message || !("reply_to_message" in ctx.message)) {
            yield ctx.reply("*sigh* You need to REPLY to a photo to summon my roasting powers! Trying to make my job harder? 🙄");
            return;
        }
        const repliedMsg = ctx.message.reply_to_message;
        if (!repliedMsg || !("photo" in repliedMsg)) {
            yield ctx.reply("Look, I'm already overworked. I only roast PHOTOS, okay? What part of that is unclear? 😮‍💨");
            return;
        }
        if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "private") {
            yield ctx.reply("*drowsy eye roll* You really think I'm going to roast in private? Add me to a group - I need witnesses for my art... 😴");
            return;
        }
        const roasterId = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id.toString();
        const groupId = (_c = ctx.chat) === null || _c === void 0 ? void 0 : _c.id.toString();
        if (!roasterId || !groupId) {
            yield ctx.reply("Ugh, technical difficulties. Just like my dating life... 🤦");
            return;
        }
        try {
            const currentDate = (0, utils_1.getCurrentDate)();
            const roasterRef = db
                .collection("groups")
                .doc(groupId)
                .collection("users")
                .doc(roasterId);
            // Check daily roast limit
            const roasterDoc = yield roasterRef.get();
            const roasterData = roasterDoc.data() || {};
            const dailyData = roasterData.dailyData || {};
            const todayData = dailyData[currentDate] || { roastCount: 0 };
            if (todayData.roastCount >= 3) {
                yield ctx.reply("Oh look who's back for more roasts! 🙄 Maybe try roasting your keyboard with some actual work instead? Come back tomorrow if you still haven't found a productive hobby! 😮‍💨", { reply_parameters: { message_id: ctx.message.message_id } });
                return;
            }
            // Get photo and generate roast
            const photo = repliedMsg.photo[repliedMsg.photo.length - 1];
            const fileLink = yield ctx.telegram.getFileLink(photo.file_id);
            const response = yield axios_1.default.get(fileLink.href, {
                responseType: "arraybuffer",
            });
            const photoBuffer = Buffer.from(response.data, "binary");
            // 50% chance to roast the photo, 50% chance to roast the person trying to roast
            const roastTarget = Math.random() < 0.5 ? "photo_sender" : "command_sender";
            const roast = yield (0, openai_1.generateRoast)(photoBuffer, roastTarget);
            // Update roast count
            yield roasterRef.set({
                dailyData: Object.assign(Object.assign({}, dailyData), { [currentDate]: Object.assign(Object.assign({}, todayData), { roastCount: (todayData.roastCount || 0) + 1 }) }),
            }, { merge: true });
            const response2 = (0, utils_1.getBingBotReaction)(roastTarget === "photo_sender", roast);
            yield ctx.reply(response2, {
                reply_parameters: { message_id: ctx.message.message_id },
            });
        }
        catch (error) {
            console.error("Error in handleBingRoast:", error);
            yield ctx.reply("Ugh, my roasting powers are on PTO right now. Try again when I've had my coffee... 😮‍💨", { reply_parameters: { message_id: ctx.message.message_id } });
        }
    });
}
