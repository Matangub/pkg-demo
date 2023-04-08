import axios from "axios";

// const workerEndpoint = "https://upload-worker.react-scanner.workers.dev"
const partSize = 10 * 1024 * 1024;

export async function uploadFile(
    file: Blob, 
    {workerEndpoint, orgToken, recordKey}: {workerEndpoint: string, orgToken: string, recordKey: string}
) {
  const url = `${workerEndpoint}/${recordKey}`;

  // Create the multipart upload
  const { uploadId } = await axios.post(`${url}?action=mpu-create`, null, {
    params: { orgToken },
  }).then((res) => res.data);

  const partCount = Math.ceil(file.size / partSize);
  const uploadedParts: any[] = [];

  // Upload each part in parallel
  await Promise.all(
    Array.from({ length: partCount }).map(async (_, index) => {
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);
      const part = await uploadPart(url, uploadId, index + 1, blob, orgToken);
      uploadedParts[index] = part;
    })
  );

  // Complete the multipart upload
  const response = await axios.post(
    url,
    { parts: uploadedParts },
    {
      params: { action: "mpu-complete", uploadId, orgToken },
      headers: { "Content-Type": "application/json" },
    //   paramsSerializer: (params) => {
    //     // Serialize the nested "parts" array as a comma-separated list of JSON-encoded strings
    //     const parts = params.parts.map((part: any) => JSON.stringify(part)).join(",");
    //     return Object.entries({ ...params, parts })
    //       .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    //       .join("&");
    //   },
    }
  );

  if (response.status === 200) {
    console.log("🎉 Successfully completed multipart upload");
  } else {
    console.error("Error completing multipart upload:", response.statusText);
  }
}

async function uploadPart(
  url: string,
  uploadId: string,
  partNumber: number,
  data: Blob,
  orgToken: string
) {
    const blobContent = await data.text();
  const response = await axios.put(
    url,
    blobContent,
    {
      params: { action: "mpu-uploadpart", uploadId, partNumber, orgToken },
      headers: { "Content-Type": "application/octet-stream" },
    }
  );

  if (response.status === 200) {
    return response.data;
  } else {
    console.error(`Error uploading part ${partNumber}:`, response.statusText);
    throw new Error(`Error uploading part ${partNumber}: ${response.statusText}`);
  }
}
