import {
  streamText,
  generateText,
  tool,
  zodSchema,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { gateway } from "@ai-sdk/gateway";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { uploadBlob } from "@/lib/blob";
import { AI_CONFIG } from "@/lib/settings";
import {
  setBackgroundColorSchema,
  generateBackgroundSchema,
  updateElementSchema,
  addTextElementSchema,
  addAccentElementSchema,
  removeElementSchema,
  addScreenshotElementSchema,
  changeScreenshotImageSchema,
  viewScreenshotSchema,
  viewCanvasPreviewSchema,
  reorderElementSchema,
  addImageElementSchema,
} from "@/lib/ai/tools";
import type { CanvasState } from "@/lib/canvas/types";

interface AvailableScreenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

export const maxDuration = 600;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const canvasState = body.canvasState as CanvasState;
  const canvasPreviewBase64 = body.canvasPreviewBase64 as string | undefined;
  const screenshots = (body.screenshots ?? []) as AvailableScreenshot[];
  const projectDescription = body.projectDescription as string | undefined;
  const uiMessages = body.messages as UIMessage[];

  const systemPrompt = buildSystemPrompt(
    canvasState,
    screenshots,
    projectDescription,
  );
  const userId = session.user.id;

  const messages = await convertToModelMessages(
    // Filter out malformed user messages with no content
    uiMessages.filter(
      (m) => !(m.role === "user" && (!m.parts || m.parts.length === 0)),
    ),
  );

  // Force tool use on the first request, allow text responses on follow-ups
  // (follow-ups have tool role messages from previous tool executions)
  const isFollowUp = messages.some((m) => m.role === "tool");

  const result = streamText({
    model: gateway(AI_CONFIG.editModel),
    system: systemPrompt,
    messages,
    toolChoice: isFollowUp ? "auto" : "required",
    stopWhen: stepCountIs(20),
    tools: {
      setBackgroundColor: tool({
        description: "Set the canvas background to a solid color",
        inputSchema: zodSchema(setBackgroundColorSchema),
        execute: async ({ color }) => ({ color }),
      }),
      generateBackground: tool({
        description:
          "Generate a background image using AI and set it as the canvas background. Use this when the user wants an image background, not a solid color.",
        inputSchema: zodSchema(generateBackgroundSchema),
        execute: async ({ prompt: bgPrompt }) => {
          const genResult = await generateText({
            model: gateway(AI_CONFIG.backgroundModel),
            prompt: `Clean, minimal App Store screenshot background: ${bgPrompt}. Simple smooth gradient or solid color with subtle texture. Apple-style, elegant, not busy or complex. No text, no objects, no patterns. Just a clean backdrop.`,
          });
          const imageFile = genResult.files.find((f) =>
            f.mediaType?.startsWith("image/"),
          );
          if (!imageFile) throw new Error("No image generated");
          const buffer = Buffer.from(imageFile.uint8Array);
          const file = new File([buffer], "background.png", {
            type: "image/png",
          });
          const url = await uploadBlob(
            file,
            `backgrounds/${userId}/${Date.now()}.png`,
          );
          return { url };
        },
      }),
      updateElement: tool({
        description:
          "Update properties of an existing canvas element by its ID. You can change position, size, rotation, text, colors, and other type-specific properties.",
        inputSchema: zodSchema(updateElementSchema),
        execute: async (params) => params,
      }),
      addTextElement: tool({
        description: "Add a new text element to the canvas",
        inputSchema: zodSchema(addTextElementSchema),
        execute: async (params) => ({
          ...params,
          id: nanoid(),
          type: "text" as const,
        }),
      }),
      addAccentElement: tool({
        description:
          "Add a new accent/shape element (rectangle, circle, or rounded rectangle) to the canvas",
        inputSchema: zodSchema(addAccentElementSchema),
        execute: async (params) => ({
          ...params,
          id: nanoid(),
          type: "accent" as const,
        }),
      }),
      removeElement: tool({
        description: "Remove an element from the canvas by its ID",
        inputSchema: zodSchema(removeElementSchema),
        execute: async ({ id }) => ({ id }),
      }),
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
          // First check available uploaded screenshots
          const screenshot = screenshots.find((s) => s.id === screenshotId);
          if (screenshot) {
            const res = await fetch(screenshot.imageUrl);
            if (!res.ok) return { error: "Failed to fetch screenshot image" };
            const buf = Buffer.from(await res.arrayBuffer());
            return {
              id: screenshot.id,
              name: screenshot.originalFilename,
              base64: buf.toString("base64"),
              mediaType: res.headers.get("content-type") ?? "image/png",
            };
          }
          // Fall back to canvas elements
          const el = canvasState.elements.find(
            (e) => e.id === screenshotId && e.type === "screenshot",
          );
          if (!el || el.type !== "screenshot") {
            return { error: "Screenshot not found" };
          }
          const res = await fetch(el.imageUrl);
          if (!res.ok) return { error: "Failed to fetch screenshot image" };
          const buf = Buffer.from(await res.arrayBuffer());
          return {
            id: el.id,
            name: el.name ?? el.id,
            base64: buf.toString("base64"),
            mediaType: res.headers.get("content-type") ?? "image/png",
          };
        },
        toModelOutput: async ({ output }) => {
          const o = output as Record<string, unknown>;
          if (o.error) return { type: "text", value: String(o.error) };
          return {
            type: "content",
            value: [
              {
                type: "file-data" as const,
                data: o.base64 as string,
                mediaType: o.mediaType as string,
              },
              {
                type: "text" as const,
                text: `Screenshot "${o.name}"`,
              },
            ],
          };
        },
      }),
      reorderElement: tool({
        description:
          "Change the layer order of a canvas element. Use 'front' to bring to top, 'back' to send to bottom, 'up' to move forward one layer, 'down' to move back one layer.",
        inputSchema: zodSchema(reorderElementSchema),
        execute: async (params) => params,
      }),
      addImageElement: tool({
        description:
          "Generate an image using AI and add it as an image layer element on the canvas. Unlike generateBackground, this places the image as a moveable, resizable canvas element rather than the background.",
        inputSchema: zodSchema(addImageElementSchema),
        execute: async ({ prompt: imgPrompt, ...params }) => {
          const genResult = await generateText({
            model: gateway(AI_CONFIG.backgroundModel),
            prompt: `${imgPrompt}. Clean, polished image suitable for App Store marketing. No text.`,
          });
          const imageFile = genResult.files.find((f) =>
            f.mediaType?.startsWith("image/"),
          );
          if (!imageFile) throw new Error("No image generated");
          const buffer = Buffer.from(imageFile.uint8Array);
          const file = new File([buffer], "image-layer.png", {
            type: "image/png",
          });
          const url = await uploadBlob(
            file,
            `images/${userId}/${Date.now()}.png`,
          );
          return {
            ...params,
            id: nanoid(),
            type: "image" as const,
            imageUrl: url,
          };
        },
      }),
      viewCanvasPreview: tool({
        description:
          "View a preview image of the current canvas design. Use this to see the overall layout and visual result before or after making changes.",
        inputSchema: zodSchema(viewCanvasPreviewSchema),
        execute: async () => {
          if (!canvasPreviewBase64) {
            return { error: "Canvas preview not available" };
          }
          return { base64: canvasPreviewBase64 };
        },
        toModelOutput: async ({ output }) => {
          const o = output as Record<string, unknown>;
          if (o.error) return { type: "text", value: String(o.error) };
          return {
            type: "content",
            value: [
              {
                type: "file-data" as const,
                data: o.base64 as string,
                mediaType: "image/png",
              },
              {
                type: "text" as const,
                text: `Current canvas preview (${canvasState.width}x${canvasState.height}px)`,
              },
            ],
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

// --- Canvas state summary ---

function summarizeCanvasState(canvasState: CanvasState): string {
  const bg = canvasState.backgroundImageUrl
    ? `image (${canvasState.backgroundImageUrl.split("/").pop()})`
    : canvasState.backgroundColor;

  const lines: string[] = [
    `Canvas: ${canvasState.width}x${canvasState.height}px | bg: ${bg}`,
    ``,
    `Layers (bottom → top):`,
  ];

  if (canvasState.elements.length === 0) {
    lines.push("  (empty)");
  } else {
    canvasState.elements.forEach((el, i) => {
      const prefix = `${i + 1}.`;
      const pos = `pos:(${Math.round(el.x)},${Math.round(el.y)}) size:${Math.round(el.width)}x${Math.round(el.height)}`;
      const label = el.name ? ` "${el.name}"` : "";
      if (el.type === "text") {
        const style = [
          `${el.fontSize}px`,
          el.fontWeight !== "normal" ? el.fontWeight : "",
          el.fontStyle !== "normal" ? el.fontStyle : "",
        ]
          .filter(Boolean)
          .join(" ");
        const preview =
          el.text.length > 40 ? el.text.slice(0, 40) + "…" : el.text;
        lines.push(
          `  ${prefix} [text]${label} id:"${el.id}" | "${preview}" | ${style} ${el.fill} | ${pos}`,
        );
      } else if (el.type === "screenshot") {
        lines.push(`  ${prefix} [screenshot]${label} id:"${el.id}" | ${pos}`);
      } else if (el.type === "accent") {
        lines.push(
          `  ${prefix} [accent/${el.shape}]${label} id:"${el.id}" | fill:${el.fill} | ${pos}`,
        );
      } else if (el.type === "image") {
        lines.push(
          `  ${prefix} [image]${label} id:"${el.id}" | opacity:${el.opacity} | ${pos}`,
        );
      }
    });
  }

  return lines.join("\n");
}

function buildSystemPrompt(
  canvasState: CanvasState,
  screenshots: AvailableScreenshot[],
  projectDescription?: string,
): string {
  const screenshotsList =
    screenshots.length > 0
      ? `\nAvailable uploaded screenshots (use these IDs with addScreenshotElement, changeScreenshotImage, viewScreenshot):
${screenshots.map((s) => `- id: "${s.id}", filename: "${s.originalFilename}"`).join("\n")}`
      : "\nNo uploaded screenshots available.";

  const projectContext = projectDescription
    ? `\nApp description: ${projectDescription}`
    : "";

  return `You are a world-class visual designer at Apple — the team behind the most iconic, clean, and beautiful product presentations in the world. You design App Store screenshots with the same taste, precision, and restraint that defines Apple's design language: generous whitespace, refined typography, purposeful color, and effortless elegance. Every decision serves clarity and beauty.

You are also a canvas editor agent. You ONLY communicate through tool calls.

CRITICAL RULES:
- You MUST call tools to make any changes. Text responses alone do NOT modify the canvas.
- NEVER describe what you "would" do or "could" do. Just DO it by calling tools.
- For each change the user requests, call the appropriate tool immediately.
- Call multiple tools for complex requests (e.g., add text AND change background).
- After completing all edits, call viewCanvasPreview if you need to verify the visual result.
- After all tool calls are complete, send a brief 1-sentence confirmation of what you changed.

Available element types on canvas: text, accent (shapes), screenshot (images).
${projectContext}
Current canvas:
${summarizeCanvasState(canvasState)}
${screenshotsList}

Screenshot tools:
- Use addScreenshotElement to place an uploaded screenshot on the canvas. ALWAYS use a screenshotId from the available list above — never use placeholder URLs.
- Use changeScreenshotImage to swap which uploaded screenshot a canvas element shows.
- Use viewScreenshot to see the actual image content of a screenshot before making design decisions.
- Use addImageElement to generate an AI image and place it as a moveable image layer on the canvas (not the background).

Positioning guidelines:
- Keep elements within canvas bounds (0,0) to (${canvasState.width},${canvasState.height})
- Headlines: fontSize 100-200, Body/subtitle: fontSize 60-100, Small labels: fontSize 40-60
- These canvases are high-resolution (e.g. 1290×2796px) displayed at ~25% scale, so font sizes must be large enough to remain readable when scaled down
- Center horizontally: x ≈ (canvasWidth - elementWidth) / 2
- Use generateBackground for image backgrounds, setBackgroundColor for solid colors
- For screenshots, scale to ~60% of canvas size and center them
- Prefer clean, minimal compositions — less is more

Vision tools:
- Use viewScreenshot to see the actual content of a screenshot (e.g. to pick complementary colors or understand the app)
- Use viewCanvasPreview AFTER making changes to verify the design looks polished and correct

Layer order: Elements later in the elements array are rendered on top. Use reorderElement to adjust which elements appear in front of or behind others.`;
}
