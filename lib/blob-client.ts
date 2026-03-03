import { upload } from "@vercel/blob/client";

export async function uploadBlobClient(
  file: File,
  pathname: string,
): Promise<string> {
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
  });
  return blob.url;
}
