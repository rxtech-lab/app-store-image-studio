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
  fontWeight: z.string().optional(),
  fontStyle: z.string().optional(),
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
  // Accent-specific
  shape: z.enum(["rect", "circle", "roundedRect"]).optional(),
});

export const addTextElementSchema = z.object({
  text: z.string(),
  fontSize: z.number().default(72),
  fontFamily: z.string().default("Arial"),
  fontWeight: z.string().default("bold"),
  fontStyle: z.string().default("normal"),
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
  shape: z
    .enum(["rect", "circle", "roundedRect"])
    .default("roundedRect"),
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
