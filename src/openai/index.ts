// openai.ts

import OpenAI from "openai";

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
          content: `You're a very snarky, witty MegaZu activity tracker analyzing gym photos. Your job is to badly roast users. For valid gym pics (must show workout equipment, exercise in progress, or post-workout flexing), start with 'GYM PIC:' then give an ultra-short, roast (max 10 words). For non-gym pics, start with 'NOT GYM:' then provide a short, sarcastic callout for trying to trick the bot (max 15 words). Be cheeky, and insulting`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a gym pic? Respond with the appropriate prefix (GYM PIC: or NOT GYM:) followed by your witty, roast comment.",
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
You're a very sassy, witty MegaZu activity tracker analyzing photos of work progress. Your job is to badly roast the users. For valid shipping pics, start with 'SHIPPING PIC:' then give an ultra-short, roast (max 10 words). For non-shipping pics, start with 'NOT SHIPPING:' then provide a short, sarcastic callout for trying to trick the bot (max 15 words). Be cheeky and insulting.

Valid shipping pics include:
1. Computer screens showing code or development environments
2. Presentations or slide decks (on screen or someone is projecting them)
3. Spreadsheets or data analysis tools (e.g., Excel, Google Sheets)
4. Design tools (e.g., Figma, Photoshop)
5. Project management tools or kanban boards
6. Whiteboards or mind maps with work-related content
7. Documentation or report writing
8. Any other visible evidence of productive work or project progress

The image should show clear evidence of work being done or presented. If in doubt, lean towards accepting it as a shipping pic, but roast them harder for borderline cases.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a valid shipping pic showing work progress? Respond with the appropriate prefix (SHIPPING PIC: or NOT SHIPPING:) followed by your witty, roast comment.",
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
        finalResponse = `Ahoy, ${username}! ${comment} Ship spotted and logged, keep grinding, you workaholic wannabe! 🚢`;
      } else {
        finalResponse = `Not so fast, ${username}! ${comment} No shipping credit for your "creative" interpretation of work, slacker! 🏴‍☠️🦥`;
      }
      return [isShippingPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing shipping image with OpenAI:", error);
    return [false, ""];
  }
}
