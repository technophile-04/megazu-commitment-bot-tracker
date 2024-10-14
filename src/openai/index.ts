import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeAndRoastPhoto(
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
          content:
            "You're a witty gym bot analyzing photos. For gym pics, start with 'GYM PIC:' then give an ultra-short, snappy roast (max 10 words). For non-gym pics, start with 'NOT GYM:' then provide a short, funny callout for trying to trick the bot (max 15 words). Always be playful and cheeky, but keep it friendly.",
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
