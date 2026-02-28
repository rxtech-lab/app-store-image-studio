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
});

export const addTextElementSchema = z.object({
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

export const addImageElementSchema = z.object({
  prompt: z
    .string()
    .describe("Description of the image to generate for this layer"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  cornerRadius: z.number().default(0),
});
