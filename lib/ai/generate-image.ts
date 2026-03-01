import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { uploadBlob } from "@/lib/blob";
import { AI_CONFIG } from "@/lib/settings";

/**
 * Generate an image using AI and upload it to blob storage.
 * Returns the public URL of the uploaded image.
 */
export async function generateAndUploadImage(opts: {
  prompt: string;
  filename: string;
  blobPath: string;
}): Promise<string> {
  const genResult = await generateText({
    model: gateway(AI_CONFIG.imageModel),
    prompt: opts.prompt,
  });
  const imageFile = genResult.files.find((f) =>
    f.mediaType?.startsWith("image/"),
  );
  if (!imageFile) throw new Error("No image generated");
  const buffer = Buffer.from(imageFile.uint8Array);
  const file = new File([buffer], opts.filename, { type: "image/png" });
  return uploadBlob(file, opts.blobPath);
}
