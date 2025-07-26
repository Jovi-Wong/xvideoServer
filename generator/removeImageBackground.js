import axios from "axios";
import ImagesegClient from "@alicloud/imageseg20191230";
import OpenapiClient from "@alicloud/openapi-client";
import TeaUtil from "@alicloud/tea-util";
import OSS from "ali-oss";

const ossClient = new OSS({
  region: "oss-cn-hangzhou",
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  authorizationV4: true,
  bucket: "asset-viralvideo-cn",
});

let config = new OpenapiClient.Config({
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
});

config.endpoint = `imageseg.cn-shanghai.aliyuncs.com`;
const client = new ImagesegClient.default(config);

const getImageStream = async function (url) {
  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default function removeImageBackground(imageUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      let segmentCommonImageAdvanceRequest =
        new ImagesegClient.SegmentCommonImageAdvanceRequest();
      segmentCommonImageAdvanceRequest.imageURLObject = await getImageStream(
        imageUrl
      );
      let runtime = new TeaUtil.RuntimeOptions({});
      const segResult = await client.segmentCommonImageAdvance(
        segmentCommonImageAdvanceRequest,
        runtime
      );

      // Download image from the generated URL
      const segImageUrl = segResult.body.data.imageURL;
      const imageResponse = await fetch(segImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      // Generate unique filename
      const filename = `generated-image-${Date.now()}.jpeg`;

      const result = await ossClient.put(filename, Buffer.from(imageBuffer), {
        "x-oss-storage-class": "Standard",
        "x-oss-object-acl": "public-read",
        "x-oss-tagging": "project=xvideo&stage=dev",
        "x-oss-forbid-overwrite": "false",
      });
      resolve(result.url);
    } catch (error) {
      reject(error);
    }
  });
}
