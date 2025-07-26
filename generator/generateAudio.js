import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";

dotenv.config();

export default function generateAudio(text) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Generating audio with text:", text);
      const response = await axios.post(
        `https://api.minimaxi.com/v1/t2a_v2?GroupId=${process.env.MINIMAX_GROUP_ID}`,
        {
          model: "speech-02-hd",
          text: text,
          stream: false,
          voice_setting: {
            voice_id: "male-qn-qingse",
            speed: 1,
            vol: 1,
            pitch: 0,
            emotion: "happy",
          },
          pronunciation_dict: {
            tone: ["处理/(chu3)(li3)", "危险/dangerous"],
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
            channel: 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Audio generation response:", response.data);
      // Check if response has data and audio
      if (response?.data?.data?.audio) {
        console.log("Audio data received, processing...");
        const hexAudio = response.data.data.audio;
        const audioBuffer = Buffer.from(hexAudio, 'hex');
        
        // Generate filename with timestamp
        const timestamp = Date.now();
        const filename = `audio_${timestamp}.mp3`;
        const filepath = `./audio/${filename}`;

        console.log("Saving audio to:", filepath);
        
        const audioDir = path.dirname(filepath);
        if (!fs.existsSync(audioDir)) {
          fs.mkdirSync(audioDir, { recursive: true });
        }
        
        console.log(`Audio directory exists or created: ${audioDir}`);
        // Write audio file
        fs.writeFileSync(filepath, audioBuffer);
        
        // Add filepath to response data for reference
        response.data.local_file_path = filepath;
      }
      resolve(response.data);
    } catch (error) {
      console.error("Error generating audio:", error);
      reject(error);
    }
  });
}
