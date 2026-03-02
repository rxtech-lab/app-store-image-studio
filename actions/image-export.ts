"use server";

import sharp from "sharp";
import JSZip from "jszip";
import { auth } from "@/lib/auth";

export type ImageFormat = "png" | "webp" | "jpeg";

export async function exportImage(
  base64: string,
  width: number,
  height: number,
  format: ImageFormat = "png",
  quality: number = 90,
): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const inputBuffer = Buffer.from(base64, "base64");
  let pipeline = sharp(inputBuffer).resize(width, height, { fit: "cover" });

  switch (format) {
    case "png":
      pipeline = pipeline.png();
      break;
    case "webp":
      pipeline = pipeline.webp({ quality });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({ quality });
      break;
  }

  const buffer = await pipeline.toBuffer();
  return new Uint8Array(buffer);
}

export async function exportAllImages(
  images: { base64: string; name: string }[],
  format: ImageFormat = "png",
  quality: number = 90,
): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const zip = new JSZip();
  const ext = format === "jpeg" ? "jpg" : format;

  for (const img of images) {
    const inputBuffer = Buffer.from(img.base64, "base64");
    let pipeline = sharp(inputBuffer);

    switch (format) {
      case "png":
        pipeline = pipeline.png();
        break;
      case "webp":
        pipeline = pipeline.webp({ quality });
        break;
      case "jpeg":
        pipeline = pipeline.jpeg({ quality });
        break;
    }

    const buffer = await pipeline.toBuffer();
    const safeName = img.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    zip.file(`${safeName}.${ext}`, buffer);
  }

  return zip.generateAsync({ type: "uint8array" });
}
