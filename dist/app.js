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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const telegraf_1 = require("telegraf");
const admin = __importStar(require("firebase-admin"));
const actions_1 = require("./actions");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"),
    }),
});
const db = admin.firestore();
// Initialize Telegram bot
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
bot.command("start", (ctx) => {
    var _a;
    console.log("Starting the bot!!");
    if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "private") {
        ctx.reply("Hey there, wellness champion! 🏋️‍♂️👨‍💻🧘‍♂️ I'm the MegaZu activity tracker. Add me to your group and share your progress pics! Here's how:\n\n1️⃣ Take a photo of your workout, coding progress, or mindfulness practice\n2️⃣ Add '/pumped' for gym pics, '/shipped' for coding pics, or '/zenned' for mindfulness pics in the caption\n3️⃣ Send it to the group\n\nLet's showcase those epic gains, ships, and zen moments! 💪📸🚢🧘‍♂️", { reply_parameters: { message_id: ctx.message.message_id } });
    }
    else {
        ctx.reply("MegaZu trackers, get ready to flex those muscles, ship that code, and find your zen! 🦸‍♂️🦸‍♀️ Your friendly neighborhood Progress Guardian is here!\n\nTo show off your progress:\n1️⃣ Snap a pic of your workout, coding, or mindfulness practice\n2️⃣ Include '/pumped' for gym pics, '/shipped' for coding pics, or '/zenned' for mindfulness pics in the caption\n3️⃣ Share it with the group\n\nLet's see those gains, ships, and zen moments! 💪🖥️🚢🧘‍♂️", { reply_parameters: { message_id: ctx.message.message_id } });
    }
});
bot.on("photo", (ctx) => (0, actions_1.handlePhotoSent)(ctx, db));
bot.command("lifters", (ctx) => (0, actions_1.handleGetRanking)(ctx, db));
bot.command("shippers", (ctx) => (0, actions_1.handleGetShippingRanking)(ctx, db));
bot.command("zensters", (ctx) => (0, actions_1.handleGetMindfulnessRanking)(ctx, db));
// Since `/zenned` can used by mentioning different members,  members need to be regsitered in firebase DB before adding their count
bot.command("bezen", (ctx) => (0, actions_1.handleBeZen)(ctx, db));
bot.command("bing_roast", (ctx) => (0, actions_1.handleBingRoast)(ctx, db));
// Express routes
app.get("/", (_req, res) => {
    res.send("MegaZu Activity Tracker is pumping iron and shipping code! 💪🚢");
});
// Start server and bot
function startApp() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Start Express server
            app.listen(port, () => {
                console.log(`Server is flexing on port ${port} 💪`);
            });
            // Start Telegram bot
            yield bot.launch();
            console.log("MegaZu bot is online and ready to track activities!");
            // Enable graceful stop
            process.once("SIGINT", () => bot.stop("SIGINT"));
            process.once("SIGTERM", () => bot.stop("SIGTERM"));
        }
        catch (error) {
            console.error("Failed to start the application:", error);
            process.exit(1);
        }
    });
}
startApp();
