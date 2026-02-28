import { put, del } from "@vercel/blob";

export async function uploadBlob(
  file: File,
  pathname: string,
): Promise<string> {
  const blob = await put(pathname, file, {
    access: "public",
    allowOverwrite: true,
  });
  return blob.url;
}

export async function deleteBlob(url: string): Promise<void> {
  await del(url);
}
