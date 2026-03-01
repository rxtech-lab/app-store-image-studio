import sharp from "sharp";

/**
 * Remove chromakey green (#00FF00) background from an image buffer.
 * Uses HSV color space detection to identify green pixels and set them transparent.
 */
export async function removeGreenScreen(
  inputBuffer: Buffer,
): Promise<Buffer> {
  const image = sharp(inputBuffer);
  const { width, height } = await image.metadata();

  if (!width || !height) {
    throw new Error("Could not read image dimensions");
  }

  // Extract raw RGBA pixel data
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);

  // First pass: create green mask
  const mask = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];

    // Convert RGB to HSV
    const rN = r / 255;
    const gN = g / 255;
    const bN = b / 255;

    const max = Math.max(rN, gN, bN);
    const min = Math.min(rN, gN, bN);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === gN) {
        h = 60 * (((bN - rN) / delta) + 2);
      } else if (max === rN) {
        h = 60 * (((gN - bN) / delta) % 6);
      } else {
        h = 60 * (((rN - gN) / delta) + 4);
      }
    }
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;

    // Check if pixel is green: hue ~120deg, high saturation, high brightness
    const hueDiff = Math.abs(h - 120);
    if (hueDiff < 30 && s > 40 && v > 40) {
      mask[i] = 1;
    }
  }

  // Dilation pass: expand mask by 1 pixel to catch anti-aliased edges
  const dilatedMask = new Uint8Array(mask);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 1) continue;
      // Check 4-connected neighbors
      if (
        (x > 0 && mask[y * width + (x - 1)] === 1) ||
        (x < width - 1 && mask[y * width + (x + 1)] === 1) ||
        (y > 0 && mask[(y - 1) * width + x] === 1) ||
        (y < height - 1 && mask[(y + 1) * width + x] === 1)
      ) {
        // Check if this edge pixel has green tint (more relaxed thresholds)
        const offset = (y * width + x) * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        if (g > r && g > b) {
          dilatedMask[y * width + x] = 1;
        }
      }
    }
  }

  // Apply mask: set alpha to 0 for green pixels
  for (let i = 0; i < width * height; i++) {
    if (dilatedMask[i] === 1) {
      const offset = i * 4;
      pixels[offset + 3] = 0; // Set alpha to 0
    }
  }

  // Write back as PNG with alpha
  return sharp(Buffer.from(pixels.buffer), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}
