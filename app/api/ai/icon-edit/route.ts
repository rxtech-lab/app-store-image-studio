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
import { removeGreenScreen } from "@/lib/image/remove-green-screen";
import {
  setBackgroundColorSchema,
  generateBackgroundSchema,
  updateElementSchema,
  addTextElementSchema,
  addAccentElementSchema,
  removeElementSchema,
  viewCanvasPreviewSchema,
  reorderElementSchema,
  addImageElementSchema,
} from "@/lib/ai/tools";
import type { CanvasState } from "@/lib/canvas/types";

export const maxDuration = 600;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const canvasState = body.canvasState as CanvasState;
  const canvasPreviewBase64 = body.canvasPreviewBase64 as string | undefined;
  const projectDescription = body.projectDescription as string | undefined;
  const uiMessages = body.messages as UIMessage[];

  const systemPrompt = buildSystemPrompt(canvasState, projectDescription);
  const userId = session.user.id;

  const messages = await convertToModelMessages(
    uiMessages.filter(
      (m) => !(m.role === "user" && (!m.parts || m.parts.length === 0)),
    ),
  );

  const isFollowUp = messages.some((m) => m.role === "tool");

  const result = streamText({
    model: gateway(AI_CONFIG.editModel),
    system: systemPrompt,
    messages,
    toolChoice: isFollowUp ? "auto" : "required",
    stopWhen: stepCountIs(20),
    tools: {
      setBackgroundColor: tool({
        description:
          "Set the canvas background to a solid color. Use 'transparent' for a transparent background.",
        inputSchema: zodSchema(setBackgroundColorSchema),
        execute: async ({ color }) => ({ color }),
      }),
      generateBackground: tool({
        description:
          "Generate a background image using AI and set it as the canvas background.",
        inputSchema: zodSchema(generateBackgroundSchema),
        execute: async ({ prompt: bgPrompt }) => {
          const genResult = await generateText({
            model: gateway(AI_CONFIG.backgroundModel),
            prompt: `Clean, minimal icon background: ${bgPrompt}. Simple smooth gradient or solid color. Apple-style, elegant. No text, no objects, no patterns.`,
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
            `icon-backgrounds/${userId}/${Date.now()}.png`,
          );
          return { url };
        },
      }),
      updateElement: tool({
        description:
          "Update properties of an existing canvas element by its ID.",
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
        description: "Add a new accent/shape element to the canvas",
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
      addImageElement: tool({
        description:
          "Generate an image layer with a transparent background using AI, and add it to the canvas. The image will be generated with a green screen background and automatically processed to have transparency.",
        inputSchema: zodSchema(addImageElementSchema),
        execute: async ({ prompt: imgPrompt, ...params }) => {
          // Generate with chromakey green background
          const genResult = await generateText({
            model: gateway(AI_CONFIG.backgroundModel),
            prompt: `${imgPrompt}. BACKGROUND: Solid, flat, uniform chromakey green color. Use EXACTLY hex color #00FF00 (RGB 0, 255, 0). The entire background must be this single pure green color with NO variation, NO gradients, NO shadows, NO lighting effects. The subject should have sharp, clean edges against the green background. No green hues in the subject itself.`,
          });
          const imageFile = genResult.files.find((f) =>
            f.mediaType?.startsWith("image/"),
          );
          if (!imageFile) throw new Error("No image generated");

          // Remove green screen to create transparency
          const rawBuffer = Buffer.from(imageFile.uint8Array);
          const transparentBuffer = await removeGreenScreen(rawBuffer);

          const file = new File([transparentBuffer], "icon-layer.png", {
            type: "image/png",
          });
          const url = await uploadBlob(
            file,
            `icon-layers/${userId}/${Date.now()}.png`,
          );
          return {
            ...params,
            id: nanoid(),
            type: "image" as const,
            imageUrl: url,
          };
        },
      }),
      reorderElement: tool({
        description:
          "Change the layer order of a canvas element. Use 'front' to bring to top, 'back' to send to bottom.",
        inputSchema: zodSchema(reorderElementSchema),
        execute: async (params) => params,
      }),
      viewCanvasPreview: tool({
        description:
          "View a preview image of the current canvas design. Use this to verify the visual result.",
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

function summarizeCanvasState(canvasState: CanvasState): string {
  const bg =
    canvasState.backgroundColor === "transparent"
      ? "transparent"
      : canvasState.backgroundImageUrl
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
      } else if (el.type === "image") {
        lines.push(
          `  ${prefix} [image]${label} id:"${el.id}" | opacity:${el.opacity} | ${pos}`,
        );
      } else if (el.type === "accent") {
        lines.push(
          `  ${prefix} [accent/${el.shape}]${label} id:"${el.id}" | fill:${el.fill} | ${pos}`,
        );
      }
    });
  }

  return lines.join("\n");
}

function buildSystemPrompt(
  canvasState: CanvasState,
  projectDescription?: string,
): string {
  const projectContext = projectDescription
    ? `\nApp description: ${projectDescription}`
    : "";

  return `You are a world-class icon designer — the team behind Apple's iconic app icons. You create beautiful, memorable, and distinctive app icons with clean shapes, bold colors, and perfect composition. Every icon you design is instantly recognizable and works beautifully at all sizes from 16px to 1024px.

You are a canvas editor agent for designing app icons. You ONLY communicate through tool calls.

CRITICAL RULES:
- You MUST call tools to make any changes. Text responses alone do NOT modify the canvas.
- NEVER describe what you "would" do or "could" do. Just DO it by calling tools.
- For each change the user requests, call the appropriate tool immediately.
- Call multiple tools for complex requests.
- After completing all edits, call viewCanvasPreview if you need to verify the visual result.
- After all tool calls are complete, send a brief 1-sentence confirmation of what you changed.

ICON DESIGN PRINCIPLES:
- Icons are square canvases (${canvasState.width}x${canvasState.height}px)
- Use addImageElement to generate image layers — these are created with transparent backgrounds
- Layer multiple transparent images to build up the icon composition
- Keep designs simple, bold, and readable at small sizes
- Use strong, distinctive silhouettes
- Limit to 2-3 colors maximum
- Avoid fine details that won't be visible at small sizes
- The background can be a solid color, transparent, or a gradient image
- Set background to "transparent" with setBackgroundColor for transparent backgrounds

Available element types: text, accent (shapes), image (AI-generated with transparent background).
${projectContext}
Current canvas:
${summarizeCanvasState(canvasState)}

Positioning guidelines:
- Keep elements within canvas bounds (0,0) to (${canvasState.width},${canvasState.height})
- Center horizontally: x ≈ (canvasWidth - elementWidth) / 2
- Center vertically: y ≈ (canvasHeight - elementHeight) / 2
- For icon design, center the main subject and leave some padding around edges
- Text in icons should be large and bold (fontSize 200+ for readability at small sizes)

Layer order: Elements later in the elements array are rendered on top. Use reorderElement to adjust layering.`;
}
