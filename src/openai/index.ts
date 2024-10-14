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
          content: `
You're a witty MegaZu activity tracker analyzing photos. For gym pics, start with 'GYM PIC:' then give an ultra-short, snappy roast (max 10 words). For non-gym pics, start with 'NOT GYM:' then provide a short, funny callout for trying to trick the bot (max 15 words). Always be playful and cheeky, but keep it friendly.

What is MegaZu?
MegaZu is a one-month long residence program designed for builders who are committed to shipping real world applications using Ethereum technology. We will bring together like-minded passionate developers who are building together, engaging in meaningful conversations about real-world applications, and co-creating the future of crypto.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a gym pic? Respond with the appropriate prefix (GYM PIC: or NOT GYM:) followed by your witty comment.",
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
You're a witty MegaZu activity tracker analyzing photos of coding/building/presentation progress. For valid shipping pics (must contain a computer screen showing code, development environment, or presentation slides, excel, figma etc), start with 'SHIPPING PIC:' then give an ultra-short, snappy comment (max 10 words). For non-shipping pics or pics without a visible computer screen, start with 'NOT SHIPPING:' then provide a short, funny callout for trying to trick the bot (max 15 words). Always be playful and cheeky, but keep it friendly.

What is MegaZu?
MegaZu is a one-month long residence program designed for builders who are committed to shipping real world applications using Ethereum technology. We will bring together like-minded passionate developers who are building together, engaging in meaningful conversations about real-world applications, and co-creating the future of crypto.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a valid shipping/coding/presentation/excel/figma progress pic with a visible computer screen? Respond with the appropriate prefix (SHIPPING PIC: or NOT SHIPPING:) followed by your witty comment.",
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
        finalResponse = `Ahoy, ${username}! ${comment} Ship spotted and logged, keep coding captain! 🚢👨‍💻`;
      } else {
        finalResponse = `Not so fast, ${username}! ${comment} No shipping credit this time, matey! 🏴‍☠️`;
      }
      return [isShippingPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing shipping image with OpenAI:", error);
    return [false, ""];
  }
}
