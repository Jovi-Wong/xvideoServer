import { WebSocketServer } from "ws";
import dotenv from "dotenv";

import generateText from "./generator/generateText.js";

dotenv.config();

const PORT = 8080;

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

// Handle new connections
wss.on("connection", (ws, req) => {
  console.log("New client connected from:", req.socket.remoteAddress);

  // Send welcome message to new client
  // ws.send(
  //   JSON.stringify({
  //     type: "welcome",
  //     message: "Connected to WebSocket server",
  //   })
  // );

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
          // default:
          //   ws.send(
          //     JSON.stringify({
          //       type: "echo",
          //       message: message?.choices[0]?.delta?.content || "",
          //     })
          //   );
          //   break;
        }
      }
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
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
