"use server";

import JSZip from "jszip";
import { auth } from "@/lib/auth";

interface ImageEntry {
  filename: string;
  base64: string;
}

export async function exportZip(images: ImageEntry[]): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const zip = new JSZip();

  for (const img of images) {
    const buffer = Buffer.from(img.base64, "base64");
    zip.file(img.filename, buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "uint8array" });
  return zipBuffer;
}
