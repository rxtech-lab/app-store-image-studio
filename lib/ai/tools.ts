import { z } from "zod";
import { tool, zodSchema, generateImage, generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { nanoid } from "nanoid";
import { uploadBlob } from "@/lib/blob";
import { AI_CONFIG } from "@/lib/settings";
import { generateAndUploadImage } from "@/lib/ai/generate-image";
import type { CanvasState } from "@/lib/canvas/types";

export const setBackgroundColorSchema = z.object({
  color: z.string().describe("Hex color string, e.g. '#1a1a2e'"),
});

export const generateBackgroundSchema = z.object({
  prompt: z
    .string()
    .describe("Description of the background image to generate"),
});

export const updateElementSchema = z.object({
  id: z.string().describe("The element ID to update"),
  name: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  // Text-specific
  text: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z
    .enum([
      "normal",
      "bold",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
    ])
    .optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  fill: z.string().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  lineHeight: z.number().optional(),
  // Screenshot-specific
  cornerRadius: z.number().optional(),
  shadowEnabled: z.boolean().optional(),
  shadowColor: z.string().optional(),
  shadowBlur: z.number().optional(),
  shadowOffsetX: z.number().optional(),
  shadowOffsetY: z.number().optional(),
  // Image layer-specific
  opacity: z.number().min(0).max(1).optional(),
  // Accent-specific
  shape: z.enum(["rect", "circle", "roundedRect"]).optional(),
  // SVG-specific
  svgContent: z.string().optional(),
});

export const addTextElementSchema = z.object({
  name: z
    .string()
    .describe("Descriptive name for this text layer")
    .optional(),
  text: z.string(),
  fontSize: z.number().default(100),
  fontFamily: z.string().default("Arial"),
  fontWeight: z
    .enum([
      "normal",
      "bold",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
    ])
    .default("bold"),
  fontStyle: z.enum(["normal", "italic"]).default("normal"),
  fill: z.string().default("#ffffff"),
  align: z.enum(["left", "center", "right"]).default("center"),
  lineHeight: z.number().default(1.2),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number().default(100),
  rotation: z.number().default(0),
});

export const addAccentElementSchema = z.object({
  name: z
    .string()
    .describe("Descriptive name for this shape layer")
    .optional(),
  shape: z.enum(["rect", "circle", "roundedRect"]).default("roundedRect"),
  fill: z.string().default("#ffffff20"),
  cornerRadius: z.number().default(20),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
});

export const removeElementSchema = z.object({
  id: z.string().describe("The element ID to remove"),
});

export const addScreenshotElementSchema = z.object({
  screenshotId: z
    .string()
    .describe(
      "The ID of the uploaded screenshot to add (from the available screenshots list in the system prompt)",
    ),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  cornerRadius: z.number().default(20),
  shadowEnabled: z.boolean().default(true),
  shadowColor: z.string().default("#00000040"),
  shadowBlur: z.number().default(20),
  shadowOffsetX: z.number().default(0),
  shadowOffsetY: z.number().default(10),
});

export const changeScreenshotImageSchema = z.object({
  id: z
    .string()
    .describe("The ID of the screenshot element on canvas to change"),
  screenshotId: z
    .string()
    .describe(
      "The ID of the uploaded screenshot to swap to (from the available screenshots list)",
    ),
});

export const viewScreenshotSchema = z.object({
  screenshotId: z
    .string()
    .describe(
      "The ID of an uploaded screenshot to view (from the available screenshots list), or the ID of a screenshot element already on canvas",
    ),
});

export const viewCanvasPreviewSchema = z.object({
  reason: z
    .string()
    .optional()
    .describe("Brief reason for wanting to see the current canvas design"),
});

export const reorderElementSchema = z.object({
  id: z.string().describe("The element ID to reorder"),
  direction: z
    .enum(["up", "down", "front", "back"])
    .describe(
      "Layer direction: 'up' moves forward one step, 'down' moves back one step, 'front' brings to the very top, 'back' sends to the very bottom",
    ),
});

export const generateIconConceptSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Description of the complete icon to generate as a concept reference. Describe the full icon including background, main subject, and details.",
    ),
  canvasPreviewUrl: z
    .string()
    .describe(
      "URL of the current canvas preview image (from viewCanvasPreview result). Pass this when the canvas already has layers so the concept builds on the existing design.",
    )
    .optional(),
});

export const addSvgElementSchema = z.object({
  name: z
    .string()
    .describe("Descriptive name for this SVG layer")
    .optional(),
  svgContent: z
    .string()
    .describe(
      "Complete SVG markup string. Must be a valid SVG with xmlns attribute, e.g. '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\">...</svg>'",
    ),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
});

export const addImageElementSchema = z.object({
  name: z
    .string()
    .describe("Descriptive name for this image layer")
    .optional(),
  prompt: z
    .string()
    .describe("Description of the image to generate for this layer"),
  referenceImageUrl: z
    .string()
    .describe(
      "URL of a reference image (e.g. the concept image) to guide the generation style and composition",
    )
    .optional(),
  transparentBackground: z
    .boolean()
    .default(true)
    .describe(
      "Whether the generated image should have a transparent background. Use true for foreground subjects (icons, characters, objects, logos). Use false for full background scenes, textures, or illustrations that fill the entire element.",
    ),
  size: z
    .enum(["1024x1024", "1536x1024", "1024x1536"])
    .default("1024x1024")
    .describe(
      "Image generation resolution. Choose based on element aspect ratio: '1536x1024' for landscape (width > height), '1024x1536' for portrait (height > width), '1024x1024' for square or near-square elements.",
    ),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  cornerRadius: z.number().default(0),
});

// ─── Stateless tools (identical across all routes) ─────────────────

export const setBackgroundColorTool = tool({
  description:
    "Set the canvas background to a solid color. Use 'transparent' for a transparent background.",
  inputSchema: zodSchema(setBackgroundColorSchema),
  execute: async ({ color }) => ({ color }),
});

export const updateElementTool = tool({
  description:
    "Update properties of an existing canvas element by its ID. You can change position, size, rotation, text, colors, and other type-specific properties.",
  inputSchema: zodSchema(updateElementSchema),
  execute: async (params) => params,
});

export const addTextElementTool = tool({
  description: "Add a new text element to the canvas",
  inputSchema: zodSchema(addTextElementSchema),
  execute: async (params) => ({
    ...params,
    id: nanoid(),
    type: "text" as const,
  }),
});

export const addAccentElementTool = tool({
  description:
    "Add a new accent/shape element (rectangle, circle, or rounded rectangle) to the canvas. Add descriptive name to the layer as well.",
  inputSchema: zodSchema(addAccentElementSchema),
  execute: async (params) => ({
    ...params,
    id: nanoid(),
    type: "accent" as const,
  }),
});

export const removeElementTool = tool({
  description: "Remove an element from the canvas by its ID",
  inputSchema: zodSchema(removeElementSchema),
  execute: async ({ id }) => ({ id }),
});

export const addSvgElementTool = tool({
  description:
    "Add an SVG element to the canvas. Use this for text with specific styling, icons, badges, logos, or any vector graphics. Prefer this over addTextElement when the user asks for SVG text or styled text elements.",
  inputSchema: zodSchema(addSvgElementSchema),
  execute: async (params) => ({
    ...params,
    id: nanoid(),
    type: "svg" as const,
  }),
});

export const reorderElementTool = tool({
  description:
    "Change the layer order of a canvas element. Use 'front' to bring to top, 'back' to send to bottom, 'up' to move forward one layer, 'down' to move back one layer.",
  inputSchema: zodSchema(reorderElementSchema),
  execute: async (params) => params,
});

export const viewCanvasPreviewTool = tool({
  description:
    "View a preview image of the current canvas design. Use this to see the overall layout and visual result before or after making changes.",
  inputSchema: zodSchema(viewCanvasPreviewSchema),
});

// ─── Context-dependent tool factories ──────────────────────────────

interface AvailableScreenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

export function createEditGenerateBackgroundTool(blobPrefix: string) {
  return tool({
    description:
      "Generate a background image using AI and set it as the canvas background. Use this when the user wants an image background, not a solid color.",
    inputSchema: zodSchema(generateBackgroundSchema),
    execute: async ({ prompt: bgPrompt }) => {
      const url = await generateAndUploadImage({
        prompt: `Clean, minimal App Store screenshot background: ${bgPrompt}. Simple smooth gradient or solid color with subtle texture. Apple-style, elegant, not busy or complex. No text, no objects, no patterns. Just a clean backdrop.`,
        filename: "background.png",
        blobPath: `backgrounds/${blobPrefix}/${Date.now()}.png`,
      });
      return { url };
    },
  });
}

export function createIconGenerateBackgroundTool(blobPrefix: string) {
  return tool({
    description:
      "Generate a background image using AI and set it as the canvas background.",
    inputSchema: zodSchema(generateBackgroundSchema),
    execute: async ({ prompt: bgPrompt }) => {
      const result = await generateImage({
        model: gateway.image(AI_CONFIG.iconImageModel),
        prompt: `Clean, minimal icon background: ${bgPrompt}. Simple smooth gradient or solid color. Apple-style, elegant. No text, no objects, no patterns.`,
        size: "1024x1024",
      });
      const buffer = Buffer.from(result.images[0].base64, "base64");
      const file = new File([buffer], "background.png", {
        type: "image/png",
      });
      const url = await uploadBlob(
        file,
        `icon-backgrounds/${blobPrefix}/${Date.now()}.png`,
      );
      return { url };
    },
  });
}

export function createEditAddImageElementTool(blobPrefix: string) {
  return tool({
    description:
      "Generate an image using AI and add it as an image layer element on the canvas. Unlike generateBackground, this places the image as a moveable, resizable canvas element rather than the background.",
    inputSchema: zodSchema(addImageElementSchema),
    execute: async ({ prompt: imgPrompt, ...params }) => {
      const url = await generateAndUploadImage({
        prompt: `${imgPrompt}. Clean, polished image suitable for App Store marketing. No text.`,
        filename: "image-layer.png",
        blobPath: `images/${blobPrefix}/${Date.now()}.png`,
      });
      return {
        ...params,
        id: nanoid(),
        type: "image" as const,
        imageUrl: url,
      };
    },
  });
}

export function createIconAddImageElementTool(blobPrefix: string) {
  return tool({
    description:
      "Generate an image layer with a transparent background using AI, and add it to the canvas. Pass the concept image URL as referenceImageUrl to maintain visual consistency.",
    inputSchema: zodSchema(addImageElementSchema),
    execute: async ({ prompt: imgPrompt, referenceImageUrl, ...params }) => {
      const promptText = `${imgPrompt}. STYLE: Flat 2D vector illustration. Solid fills, no textures, no gradients within shapes. Like an SVG icon or SF Symbol — pure geometric shapes with flat solid colors. Absolutely NO 3D, NO realistic rendering, NO shadows, NO highlights, NO reflections, NO skeuomorphism, NO perspective. Just flat colored shapes on a single plane.`;

      let referenceBuffer: Buffer | undefined;
      if (referenceImageUrl) {
        const res = await fetch(referenceImageUrl);
        referenceBuffer = Buffer.from(await res.arrayBuffer());
      }

      const result = await generateImage({
        model: gateway.image(AI_CONFIG.iconImageModel),
        prompt: referenceBuffer
          ? { text: promptText, images: [referenceBuffer] }
          : promptText,
        size: "1024x1024",
        providerOptions: {
          openai: { background: "transparent", output_format: "png" },
        },
      });

      const buffer = Buffer.from(result.images[0].base64, "base64");
      const file = new File([buffer], "icon-layer.png", {
        type: "image/png",
      });
      const url = await uploadBlob(
        file,
        `icon-layers/${blobPrefix}/${Date.now()}.png`,
      );
      return {
        ...params,
        id: nanoid(),
        type: "image" as const,
        imageUrl: url,
      };
    },
  });
}

export function createImageEditAddImageElementTool(blobPrefix: string) {
  return tool({
    description:
      "Generate an image layer using AI and add it to the canvas. Choose transparentBackground based on subject type (true for icons/objects, false for background scenes), and size based on the element's aspect ratio.",
    inputSchema: zodSchema(addImageElementSchema),
    execute: async ({
      prompt: imgPrompt,
      referenceImageUrl,
      transparentBackground,
      size,
      ...params
    }) => {
      const promptText = `${imgPrompt}. High quality, detailed.`;

      let referenceBuffer: Buffer | undefined;
      if (referenceImageUrl) {
        const res = await fetch(referenceImageUrl);
        referenceBuffer = Buffer.from(await res.arrayBuffer());
      }

      const result = await generateImage({
        model: gateway.image(AI_CONFIG.iconImageModel),
        prompt: referenceBuffer
          ? { text: promptText, images: [referenceBuffer] }
          : promptText,
        size: size ?? "1024x1024",
        providerOptions: {
          openai: {
            background: transparentBackground ? "transparent" : "opaque",
            output_format: "png",
          },
        },
      });

      const buffer = Buffer.from(result.images[0].base64, "base64");
      const file = new File([buffer], "image-layer.png", {
        type: "image/png",
      });
      const url = await uploadBlob(
        file,
        `image-gen-layers/${blobPrefix}/${Date.now()}.png`,
      );
      return {
        ...params,
        id: nanoid(),
        type: "image" as const,
        imageUrl: url,
      };
    },
  });
}

export function createScreenshotTools(opts: {
  screenshots: AvailableScreenshot[];
  canvasState: CanvasState;
}) {
  const { screenshots, canvasState } = opts;

  return {
    addScreenshotElement: tool({
      description:
        "Add an uploaded screenshot image to the canvas. You MUST use a screenshotId from the available screenshots list. Scale the screenshot to fit nicely on the canvas (typically 60% of canvas size).",
      inputSchema: zodSchema(addScreenshotElementSchema),
      execute: async ({ screenshotId, ...params }) => {
        const screenshot = screenshots.find((s) => s.id === screenshotId);
        if (!screenshot) {
          return {
            error: `Screenshot with id "${screenshotId}" not found in available screenshots`,
          };
        }
        return {
          ...params,
          id: nanoid(),
          type: "screenshot" as const,
          imageUrl: screenshot.imageUrl,
          name: screenshot.originalFilename,
        };
      },
    }),
    changeScreenshotImage: tool({
      description:
        "Change which uploaded screenshot image a canvas screenshot element displays. Use this to swap a screenshot element to show a different uploaded screenshot.",
      inputSchema: zodSchema(changeScreenshotImageSchema),
      execute: async ({ id, screenshotId }) => {
        const el = canvasState.elements.find(
          (e) => e.id === id && e.type === "screenshot",
        );
        if (!el)
          return { error: `Screenshot element "${id}" not found on canvas` };
        const screenshot = screenshots.find((s) => s.id === screenshotId);
        if (!screenshot) {
          return {
            error: `Screenshot with id "${screenshotId}" not found in available screenshots`,
          };
        }
        return {
          id,
          imageUrl: screenshot.imageUrl,
          name: screenshot.originalFilename,
        };
      },
    }),
    viewScreenshot: tool({
      description:
        "View the actual image of an uploaded screenshot. Use this to understand the app screenshot content before making design decisions. Pass a screenshotId from the available screenshots list.",
      inputSchema: zodSchema(viewScreenshotSchema),
      execute: async ({ screenshotId }) => {
        const screenshot = screenshots.find((s) => s.id === screenshotId);
        if (screenshot) {
          return {
            id: screenshot.id,
            name: screenshot.originalFilename,
            imageUrl: screenshot.imageUrl,
          };
        }
        const el = canvasState.elements.find(
          (e) => e.id === screenshotId && e.type === "screenshot",
        );
        if (!el || el.type !== "screenshot") {
          return { error: "Screenshot not found" };
        }
        return {
          id: el.id,
          name: el.name ?? el.id,
          imageUrl: el.imageUrl,
        };
      },
    }),
  };
}

export function createGenerateIconConceptTool(blobPrefix: string) {
  return tool({
    description:
      "Generate a complete icon concept image as a visual reference. This does NOT add anything to the canvas — it only shows you the concept so you can then decompose it into layers using addImageElement. Always call this FIRST when creating a new icon. When the canvas already has layers, pass the canvasPreviewUrl from viewCanvasPreview so the concept builds on the existing design.",
    inputSchema: zodSchema(generateIconConceptSchema),
    execute: async ({ prompt: conceptPrompt, canvasPreviewUrl }) => {
      const styleGuide = `Style: Flat 2D, minimal, Apple-style app icon. Bold solid colors, simple geometric shapes, clean vector look. Square format, no rounded corners. No text unless specified. NOT realistic, NOT 3D, NOT photographic.`;

      let genResult;
      if (canvasPreviewUrl) {
        const res = await fetch(canvasPreviewUrl);
        const imageBuffer = Buffer.from(await res.arrayBuffer());
        genResult = await generateText({
          model: gateway(AI_CONFIG.imageModel),
          messages: [
            {
              role: "user",
              content: [
                { type: "image", image: imageBuffer },
                {
                  type: "text",
                  text: `This is the current canvas design. Based on this existing design, generate an improved/updated complete app icon concept: ${conceptPrompt}. ${styleGuide}`,
                },
              ],
            },
          ],
        });
      } else {
        genResult = await generateText({
          model: gateway(AI_CONFIG.imageModel),
          prompt: `Design a complete app icon: ${conceptPrompt}. ${styleGuide}`,
        });
      }

      const imageFile = genResult.files.find((f) =>
        f.mediaType?.startsWith("image/"),
      );
      if (!imageFile) throw new Error("No image generated");
      const buffer = Buffer.from(imageFile.uint8Array);
      const file = new File([buffer], "icon-concept.png", {
        type: "image/png",
      });
      const url = await uploadBlob(
        file,
        `icon-concepts/${blobPrefix}/${Date.now()}.png`,
      );
      return { url };
    },
  });
}
