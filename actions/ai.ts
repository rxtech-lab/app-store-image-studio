"use server";

import { generateText } from "ai";
import { backgroundModel, textModel } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { uploadBlob } from "@/lib/blob";

export async function generateBackground(prompt: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const result = await generateText({
    model: backgroundModel,
    prompt: `App Store marketing image background: ${prompt}. High quality, vibrant, suitable as a background for app screenshots. No text.`,
  });

  const imageFile = result.files.find((f) =>
    f.mediaType?.startsWith("image/")
  );
  if (!imageFile) throw new Error("No image generated");

  // Upload to blob storage
  const buffer = Buffer.from(imageFile.uint8Array);
  const file = new File([buffer], "background.png", { type: "image/png" });
  const url = await uploadBlob(
    file,
    `backgrounds/${session.user.id}/${Date.now()}.png`
  );

  return url;
}

export async function generateMarketingText(
  appDescription: string
): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { text } = await generateText({
    model: textModel,
    prompt: `Generate 5 short, compelling App Store marketing headlines for this app: "${appDescription}".

    Requirements:
    - Each headline should be 3-7 words
    - Be catchy and action-oriented
    - Highlight key benefits
    - Suitable for App Store marketing screenshots

    Return only the 5 headlines, one per line, no numbering or bullet points.`,
  });

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
}
