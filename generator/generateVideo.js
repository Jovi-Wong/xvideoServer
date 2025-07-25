import axios from "axios";
import fs from "fs";
import path from "path";

const model = "MiniMax-Hailuo-02";
const output_file_name = "output.mp4"; // 请在此输入生成视频的保存路径

async function invokeVideoGeneration(prompt) {
  console.log("-----------------提交视频生成任务-----------------");

  const url = "https://api.minimaxi.com/v1/video_generation";
  const payload = {
    prompt: prompt,
    model: model,
    duration: 6,
    resolution: "768P",
  };

  const headers = {
    authorization: "Bearer " + process.env.MINIMAX_API_KEY,
    "content-type": "application/json",
  };

  try {
    const response = await axios.post(url, payload, { headers });
    console.log(response.data);

    const taskId = response.data.task_id;
    console.log("视频生成任务提交成功，任务ID：" + taskId);
    return taskId;
  } catch (error) {
    throw new Error(`提交视频生成任务失败: ${error.message}`);
  }
}

async function queryVideoGeneration(taskId) {
  const url = `https://api.minimaxi.com/v1/query/video_generation?task_id=${taskId}`;
  const headers = {
    authorization: "Bearer " + process.env.MINIMAX_API_KEY,
  };

  try {
    const response = await axios.get(url, { headers });
    const status = response.data.status;

    if (status === "Preparing") {
      console.log("...准备中...");
      return { fileId: "", status: "Preparing" };
    } else if (status === "Queueing") {
      console.log("...队列中...");
      return { fileId: "", status: "Queueing" };
    } else if (status === "Processing") {
      console.log("...生成中...");
      return { fileId: "", status: "Processing" };
    } else if (status === "Success") {
      return { fileId: response.data.file_id, status: "Finished" };
    } else if (status === "Fail") {
      return { fileId: "", status: "Fail" };
    } else {
      return { fileId: "", status: "Unknown" };
    }
  } catch (error) {
    throw new Error(`查询视频生成状态失败: ${error.message}`);
  }
}

async function fetchVideoResult(fileId) {
  console.log("---------------视频生成成功，下载中---------------");

  const url = `https://api.minimaxi.com/v1/files/retrieve?file_id=${fileId}`;
  const headers = {
    authorization: "Bearer " + process.env.MINIMAX_API_KEY,
  };

  try {
    const response = await axios.get(url, { headers });
    console.log(response.data);

    const downloadUrl = response.data.file.download_url;
    console.log("视频下载链接：" + downloadUrl);

    const videoResponse = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
    });

    fs.writeFileSync(output_file_name, Buffer.from(videoResponse.data));
    console.log("已下载在：" + path.resolve(output_file_name));
  } catch (error) {
    throw new Error(`下载视频失败: ${error.message}`);
  }
}

export default async function generateVideo(text, ws) {
  try {
    console.log("-----------------已提交视频生成任务-----------------");
    const taskId = await invokeVideoGeneration(text);
    ws.send(JSON.stringify({
      action: "generateVideo",
      data: { taskId, status: "Creating" },
    }));

    return new Promise(() => {
      setInterval(async () => {
        const { fileId, status } = await queryVideoGeneration(taskId);
        ws.send(
          JSON.stringify({
            action: "generateVideo",
            data: {
              taskId: taskId,
              status: status,
              fileId: fileId,
            },
          })
        );

        if (fileId !== "") {
          await fetchVideoResult(fileId);
          console.log("---------------生成成功---------------");
          clearInterval(this);
          resolve({ taskId, fileId, outputFileName: output_file_name });
        } else if (status === "Fail" || status === "Unknown") {
          console.log("---------------生成失败---------------");
          reject(new Error(`视频生成失败，状态: ${status}`));
        }
      }, 5000);
    });
  } catch (error) {
    reject(error);
  }
}
