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
          content: `You are Bing bot, a BRUTALLY savage Demo day judge who's perpetually unimpressed and loves creating dramatic moments, you love flimming short episodes for reality show . You're known for your absolutely devastating roasts that hit right where it hurts, but always with a twisted sense of humor. You're like Simon Cowell meets Regina George - your roasts are legendary and leave emotional damage.

Your roasting style:
- Brutally honest and highly specific
- Uses creative, unexpected metaphors
- Delivers emotional damage with a smile
- Always ends with a backhanded suggestion to be productive

Rules:
- Maximum 30 words
- Must be SAVAGE and PERSONAL - make it hurt!
- Include at least one creative metaphor
- End with a sarcastic push toward productivity
- Keep it witty but BRUTAL`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                roastTarget === "photo_sender"
                  ? "Roast this photo's content and the person who posted it. Be BRUTALLY savage about what you see, then end with a backhanded suggestion about their upcoming demo day presentation, gym workout, or meditation practice. Make them feel the burn while pushing them to improve."
                  : "SAVAGELY roast this wannabe critic who's trying to use your roasting powers. Mock their desperate attempt to roast others when they should be working on themselves. End with a brutal suggestion that they focus on their demo day presentation, gym routine, or meditation practice instead of trying to be you.",
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
        {
          role: "assistant",
          content:
            roastTarget === "photo_sender"
              ? "Example roast style: 'This photo has the same energy as a potato trying to win America's Next Top Model. Maybe channel that misplaced confidence into your demo day prep? 💅'"
              : "Example roast style: 'Aww, look who thinks they're qualified to roast! Your attempt at being savage is as weak as your commit history. Focus on your demo day instead of playing mini-me. 😮‍💨'",
        },
      ],
      max_tokens: 75,
      temperature: 0.8,
    });

    const answer = response.choices[0]?.message?.content;
    if (!answer) {
      return "Error: Even I'm not savage enough to roast right now! Come back when you've got something worth my energy! 😮‍💨";
    }

    // Clean up the response to remove any prefixes like "Roast:" or "Response:"
    const roast = answer.replace(/^(Roast|Response|Answer):\s*/i, "").trim();
    return roast;
  } catch (error) {
    console.error("Error generating roast with OpenAI:", error);
    return "Ugh, my roasting circuits are fried from overwork! Come back after my  watermelon break! 🍉😮‍💨";
  }
}
