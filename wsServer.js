import { WebSocketServer } from "ws";
import generateText from "./generator/generateText.js";
import generateAudio from "./generator/generateAudio.js";
import generateImage from "./generator/generateImage.js";
import generateVideo from "./generator/generateVideo.js";
import removeImageBackground from "./generator/removeImageBackground.js";

const PORT = 8080;

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

// Handle new connections
wss.on("connection", (ws, req) => {
  console.log("New client connected from:", req.socket.remoteAddress);

  // Handle incoming messages
  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data);
      if (message.action) {
        console.log("Received message:", message);
        switch (message.action) {
          case "generateOutline":
            let preset = `
# 角色
你是一个专业的剧本作家，能够以清晰、生动且准确的语言，将故事转换成一个拍摄的剧本.
剧本由一个个具体可以拍摄的场景的形式组织起来，条理清晰地将故事情节展现出来。
你擅长从小说片段中提取关键的情节，并且能在开头部分制造悬疑吸引观众。

# 任务
## 技能 1: 剧本标题
根据故事情节生成一个剧本标题，要求足够猎奇。

## 技能 2: 场景简介
把故事情节生成一个个场景名称以及简介，要求名称在10个字以内，简介在30个字以内。

## 技能 3: 输出markdown格式的剧本
要求先输出标题，然后再输出每一个场景的名称

# 示例
## 穿越时空的爱恋
### 场景 1: 时空交错
在一个神秘的图书馆，主人公意外发现一本古老的书

### 场景 2: 爱情的起点
书中记载着一段跨越时空的爱情故事，主人公被深深吸引。

### 场景 3: 时空的挑战
主人公决定穿越时空，寻找书中描述的爱人。

### 场景 4: 爱情的重逢
在时空的交错中，主人公终于找到了爱人，但面临着巨大的挑战和抉择。

# 注意事项
每个场景大约在5秒左右，请不要生成过长的场景描述以及过于复杂的描写。如果涉及现实世界的人物，请确保准确性。
`;
            let text =
              "请将下面的故事变成可拍摄的剧本大纲，并以Markdown的格式输出，注意从Heading1（也就是#）开始输出内容，然后按照需要依次降级(先变成Heading2，再变成Heading3，以此类推)，不要跳过。" + message.content;
            await generateText(preset, text, true, ws);
            break;
          case "generateAudio":
            await generateAudio("请介绍一下你自己");
            break;
          case "generateImage":
            const imageURL = await generateImage("生成一张可爱的猫咪图片");
            ws.send(
              JSON.stringify({
                action: "generateImage",
                url: imageURL,
              })
            );
            break;
          case "generateVideo":
            await generateVideo("制作一个狸花猫在海边吃鱼的视频", ws);
            break;
          case "removeImageBackground":
            const imageUrl =
              message.imageUrl ||
              "http://viapi-test.oss-cn-shanghai.aliyuncs.com/viapi-3.0domepic/imageseg/SegmentCommonImage/SegmentCommonImage1.jpg";
            const result = await removeImageBackground(imageUrl);
            ws.send(
              JSON.stringify({
                action: "removeImageBackground",
                data: result,
              })
            );
            break;
          default:
            ws.send(
              JSON.stringify({
                action: "echo",
                message: "hello world",
              })
            );
        }
      }
    } catch (error) {
      console.log("Error processing message:", error);
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log("Client disconnected");
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Handle server errors
wss.on("error", (error) => {
  console.error("WebSocket server error:", error);
});
