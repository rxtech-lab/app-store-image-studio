"use server";

import sharp from "sharp";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { ICON_EXPORT_SIZES } from "@/lib/settings";

export async function exportIconAllPlatforms(
  base64Png: string,
): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const inputBuffer = Buffer.from(base64Png, "base64");
  const zip = new JSZip();

  for (const [platform, sizes] of Object.entries(ICON_EXPORT_SIZES)) {
    const folder = zip.folder(platform)!;
    for (const { name, size } of sizes) {
      const resized = await sharp(inputBuffer)
        .resize(size, size, { fit: "cover" })
        .png()
        .toBuffer();
      const filename = `${name.replace(/[^a-zA-Z0-9@]/g, "_")}_${size}x${size}.png`;
      folder.file(filename, resized);
    }
  }

  return zip.generateAsync({ type: "uint8array" });
}

export async function exportIconLayers(
  layers: { name: string; imageUrl: string }[],
): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const zip = new JSZip();

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const res = await fetch(layer.imageUrl);
    if (!res.ok) continue;
    const buffer = Buffer.from(await res.arrayBuffer());
    const safeName = layer.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    zip.file(`${i + 1}_${safeName}.png`, buffer);
  }

  return zip.generateAsync({ type: "uint8array" });
}
