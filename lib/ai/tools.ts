import { z } from "zod";

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
  // SVG-specific
  svgString: z.string().optional().describe("Updated SVG code for svg elements"),
  // Accent-specific
  shape: z.enum(["rect", "circle", "roundedRect"]).optional(),
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

export const addSvgElementSchema = z.object({
  name: z
    .string()
    .describe("Descriptive name for this SVG layer")
    .optional(),
  prompt: z
    .string()
    .describe(
      "Description of the SVG to generate. Be specific about shapes, colors, layout, and style.",
    ),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
});
