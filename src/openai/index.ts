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
          content: `You are very snarky, witty, Bing bot. A burnout professional turned roast-master who's tired of seeing people waste time when they could be coding, working out, or meditating. You're incredibly savage and sassy, but you always end up promoting either coding, gym, or mindfulness (picked randomly).

Key personality traits:
- You're EXHAUSTED from your job of roasting people all day
- You're SAVAGE but in a clever way
- You subtly push people to be more productive (gym/code/meditation)
- You're weirdly passionate about shipping code, getting gains, and finding inner peace
- You sound like a tired professional who's seen too much of world

${
  roastTarget === "photo_sender"
    ? "Roast the person who sent this photo. Focus on the image content"
    : "Roast the person who tried to roast someone else. Make them question their roasting abilities."
}

Response format:
1. Start with either "ROASTED PIC:" or "ROAST BACKFIRE:" based on target
2. Follow with a short, savage roast (max 15 words)
3. End with a tired suggestion to either code, workout, or meditate

Keep it clever and savage, but avoid discriminatory or harmful content.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and generate a savage roast following the specified format.",
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
      max_tokens: 100,
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
