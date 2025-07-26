import dotenv from "dotenv";
import openAI from "openai";
import OSS from "ali-oss";

dotenv.config();

const ossClient = new OSS({
  region: "oss-cn-hangzhou",
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  authorizationV4: true,
  bucket: "asset-viralvideo-cn",
});

const arkClient = new openAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
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

      // Download image from the generated URL
      const imageUrl = response.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `generated-image-${timestamp}.jpeg`;

      const result = await ossClient.put(
        filename,
        Buffer.from(imageBuffer),
        {
          "x-oss-storage-class": "Standard",
          "x-oss-object-acl": "public-read",
          "x-oss-tagging": "project=xvideo&stage=dev",
          "x-oss-forbid-overwrite": "false",
        }
      );
      resolve(result.url);
    } catch (error) {
      reject(error);
    }
  });
}
