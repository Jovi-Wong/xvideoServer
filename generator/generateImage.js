import openAI from "openai";

const arkClient = new openAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

export default function generateImage(text) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Generating image with text:", text);
      const response = await arkClient.images.generate({
        model: "doubao-seedream-3-0-t2i-250415",
        prompt:
          "鱼眼镜头，一只猫咪的头部，画面呈现出猫咪的五官因为拍摄方式扭曲的效果。",
        size: "720x1280",
        response_format: "url",
      });
      resolve(response.data[0].url);
    } catch (error) {
      reject(error);
    }
  });
}
