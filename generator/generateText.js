import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://jeniya.cn/v1",
});

export default function generateText(preset, text, isStream = false, ws) {
  return new Promise(async (resolve) => {
    const stream = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: preset,
        },
        { role: "user", content: text },
      ],
      stream: isStream,
    });

    for await (const chunk of stream) {
      if (chunk?.choices[0]?.delta?.content) {
        ws.send(
          JSON.stringify({
            action: "generateText",
            data: {
              content: chunk?.choices[0]?.delta?.content || "",
              isFinished: false,
            },
          })
        );
      }
    }

    ws.send(
      JSON.stringify({
        action: "generateText",
        data: {
          isFinished: true,
        },
      })
    );
    resolve("ok");
  });
}
