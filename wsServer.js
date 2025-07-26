import { WebSocketServer } from "ws";
import generateText from "./generator/generateText.js";
import generateAudio from "./generator/generateAudio.js";
import generateImage from "./generator/generateImage.js";
import generateVideo from "./generator/generateVideo.js";

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
          case "generateText":
            await generateText("请介绍一下你自己", true, ws);
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
      ws.send(JSON.stringify(error));
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
