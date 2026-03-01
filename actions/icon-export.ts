"use server";

import sharp from "sharp";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { ICON_EXPORT_SIZES } from "@/lib/settings";

async function applyCornerRadius(
  imageBuffer: Buffer,
  size: number,
  cornerRadius: number,
): Promise<Buffer> {
  if (cornerRadius <= 0) return imageBuffer;
  const rx = Math.min(cornerRadius, size / 2);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="white"/></svg>`,
  );
  return sharp(imageBuffer)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

export async function exportIconAllPlatforms(
  base64Png: string,
  cornerRadius: number = 0,
): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const inputBuffer = Buffer.from(base64Png, "base64");
  const zip = new JSZip();

  for (const [platform, sizes] of Object.entries(ICON_EXPORT_SIZES)) {
    const folder = zip.folder(platform)!;
    for (const { name, size } of sizes) {
      let resized = await sharp(inputBuffer)
        .resize(size, size, { fit: "cover" })
        .png()
        .toBuffer();
      if (cornerRadius > 0) {
        // Scale corner radius proportionally to the output size
        const scaledRadius = Math.round(cornerRadius * (size / 1024));
        resized = await applyCornerRadius(resized, size, scaledRadius);
      }
      const filename = `${name.replace(/[^a-zA-Z0-9@]/g, "_")}_${size}x${size}.png`;
      folder.file(filename, resized);
    }
  }

  return zip.generateAsync({ type: "uint8array" });
}

export async function exportIconSingle(
  base64Png: string,
  size: number,
  cornerRadius: number = 0,
): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const inputBuffer = Buffer.from(base64Png, "base64");
  let resized = await sharp(inputBuffer)
    .resize(size, size, { fit: "cover" })
    .png()
    .toBuffer();

  if (cornerRadius > 0) {
    resized = await applyCornerRadius(resized, size, cornerRadius);
  }

  return new Uint8Array(resized);
}

export async function exportIconLayers(
  layers: { name: string; base64: string }[],
): Promise<Uint8Array> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const zip = new JSZip();

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const buffer = Buffer.from(layer.base64, "base64");
    const safeName = layer.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    zip.file(`${i + 1}_${safeName}.png`, buffer);
  }

  return zip.generateAsync({ type: "uint8array" });
}
