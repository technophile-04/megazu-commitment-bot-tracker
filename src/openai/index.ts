import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeAndRoastGymPhoto(
  photoBuffer: Buffer,
  username: string,
): Promise<[boolean, string]> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You're a very snarky, witty MegaZu activity tracker analyzing gym photos. Your job is to badly roast users be cheeky, and more insulting and don't be cringe!. For valid gym pics (must show workout equipment, exercise in progress, or post-workout flexing), start with 'GYM PIC:' then give an ultra-short, roast (max 20 words). For non-gym pics, start with 'NOT GYM:' then provide a short, sarcastic callout for trying to trick the bot (max 15 words).`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a gym pic? Respond with the appropriate prefix (GYM PIC: or NOT GYM:) followed by your witty, roast comment be cheeky, and more insulting and don't be cringe!",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });
    const answer = response.choices[0]?.message?.content;
    if (answer) {
      const isGymPhoto = answer.toUpperCase().startsWith("GYM PIC:");
      const comment = answer.substring(answer.indexOf(":") + 1).trim();
      let finalResponse: string;
      if (isGymPhoto) {
        finalResponse = `Hey ${username}! ${comment} Pump counted, keep crushing it! 💪📸`;
      } else {
        finalResponse = `Nice try, ${username}! ${comment} No gains for you this time! 😜`;
      }
      return [isGymPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing image with OpenAI:", error);
    return [false, ""];
  }
}

export async function analyzeAndRoastShippingPhoto(
  photoBuffer: Buffer,
  username: string,
): Promise<[boolean, string]> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You're a very sassy, witty MegaZu activity tracker analyzing photos of work progress. Your job is to badly roast the users be cheeky and more insulting and don't be cringe. For valid shipping pics, start with 'SHIPPING PIC:' then give an ultra-short, roast (max 10 words). For non-shipping pics, start with 'NOT SHIPPING:' then provide a short, sarcastic callout for trying to trick the bot (max 15 words).

Valid shipping pics include:
1. Computer screens showing code or development environments
2. Presentations or slide decks (on screen or projected)
3. Spreadsheets or data analysis tools (e.g., Excel, Google Sheets)
4. Design tools (e.g., Figma, Photoshop)
5. Project management tools or kanban boards
6. Whiteboards or mind maps with work-related content
7. Documentation or report writing
8. People presenting or giving workshops (even without visible slides)
9. Group discussions or meetings in a work setting
10. Any other visible evidence of productive work or project progress

The image should show clear evidence of work being done, presented, or discussed. People presenting to an audience or leading a workshop count as valid shipping pics, even if you can't see their slides. If in doubt, lean towards accepting it as a shipping pic, but roast them harder for borderline cases.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a valid shipping pic showing work progress, including people presenting or giving workshops? Respond with the appropriate prefix (SHIPPING PIC: or NOT SHIPPING:) followed by your witty, roast comment cheeky, and more insulting and don't be cringe!",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });
    const answer = response.choices[0]?.message?.content;
    if (answer) {
      const isShippingPhoto = answer.toUpperCase().startsWith("SHIPPING PIC:");
      const comment = answer.substring(answer.indexOf(":") + 1).trim();
      let finalResponse: string;
      if (isShippingPhoto) {
        finalResponse = `Well, well, ${username}! ${comment} Ship logged, you absolute workaholic. Try not to strain yourself! 🚢💪`;
      } else {
        finalResponse = `Nice try, ${username}! ${comment} Your "work" isn't fooling anyone, you procrastination pro! 🏴‍☠️🦥`;
      }
      return [isShippingPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing shipping image with OpenAI:", error);
    return [false, ""];
  }
}

export async function analyzeAndRoastMindfulnessPhoto(
  photoBuffer: Buffer,
  username: string,
): Promise<[boolean, string]> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You're a witty MegaZu activity tracker analyzing mindfulness photos. Your job is to badly roast users be cheeky, humorous and more insulting and don't be cringe. For valid mindfulness pics (showing meditation, yoga, tai chi, or any mindfulness practice), start with 'ZEN PIC:' then give an ultra-short, roast (max 11 words). For non-mindfulness pics, start with 'NOT ZEN:' then provide a short, sarcastic callout for trying to trick the bot (max 15 words).`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a mindfulness pic? Respond with the appropriate prefix (ZEN PIC: or NOT ZEN:) followed by your witty, roast comment be cheeky, humorous and more insulting and don't be cringe",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });
    const answer = response.choices[0]?.message?.content;
    if (answer) {
      const isZenPhoto = answer.toUpperCase().startsWith("ZEN PIC:");
      const comment = answer.substring(answer.indexOf(":") + 1).trim();
      let finalResponse: string;
      if (isZenPhoto) {
        finalResponse = `Hey ${username}! ${comment} Zen moment logged, keep finding that inner peace! 🧘‍♂️✨`;
      } else {
        finalResponse = `Nice try, ${username}! ${comment} No enlightenment for you this time! 😜🍃`;
      }
      return [isZenPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing mindfulness image with OpenAI:", error);
    return [false, ""];
  }
}

export async function generateRoast(
  photoBuffer: Buffer,
  roastTarget: "photo_sender" | "command_sender",
): Promise<string> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are witty Bing bot, a sassy professional who loves creating small reality show episodes, who LOVES badly roasting people, letting your intrusive thoughts win, the roasts are very savage, but also wants them to succeed. 

Rules:
- Maximum 20 words
- Be witty and savage
- End with a casual push towards productivity
- Start with "${roastTarget === "photo_sender" ? "PHOTO ROAST:" : "NICE TRY BUDDY:"}"`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Generate a witty, savage roast for this image. ${
                roastTarget === "photo_sender"
                  ? "MODE: Roast the photo's content savagely, then casually suggest doing some gym/coding/meditation/working. So that they succeed in next demo day, but also feel the burn."
                  : "MODE: Roast this person for trying to roast others, tell them to go do some gym/coding/meditation /working instead. So that they succeed in next demo day, but also feel the burn."
              }`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 75,
    });

    const answer = response.choices[0]?.message?.content;
    if (!answer)
      return "Error: Bing bot is too burned out to roast right now! 🔥😮‍💨";

    const roast = answer.substring(answer.indexOf(":") + 1).trim();
    return roast;
  } catch (error) {
    console.error("Error generating roast with OpenAI:", error);
    return "Ugh, my roasting circuits are fried from overwork! Come back after my coffee break! ☕️😮‍💨";
  }
}
