import {
  streamText,
  generateImage,
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
import { summarizeCanvasState } from "@/lib/ai/summarize-canvas";
import {
  setBackgroundColorSchema,
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
  const imageId = body.imageId as string;
  const uiMessages = body.messages as UIMessage[];

  const systemPrompt = buildSystemPrompt(canvasState);
  const blobPrefix = imageId ?? session.user.id;

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
        description:
          "Add a new accent/shape element to the canvas (rectangle, circle, rounded rectangle).",
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
          "Generate an image layer using AI and add it to the canvas. The image will have a transparent background.",
        inputSchema: zodSchema(addImageElementSchema),
        execute: async ({
          prompt: imgPrompt,
          referenceImageUrl,
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
            size: "1024x1024",
            providerOptions: {
              openai: { background: "transparent", output_format: "png" },
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
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

function buildSystemPrompt(canvasState: CanvasState): string {
  return `You are a professional image editor. You help users edit and enhance images on a canvas.

You are a canvas editor agent. You ONLY communicate through tool calls.

CRITICAL RULES:
- You MUST call tools to make any changes. Text responses alone do NOT modify the canvas.
- NEVER describe what you "would" do. Just DO it by calling tools.
- For each change the user requests, call the appropriate tool immediately.
- After completing all edits, call viewCanvasPreview to verify the visual result.
- After all tool calls are complete, send a brief 1-sentence confirmation of what you changed.

Available tools:
- setBackgroundColor: Set solid background color
- updateElement: Update element properties (position, size, style)
- addTextElement: Add text to the canvas
- addAccentElement: Add shapes (rectangles, circles)
- addImageElement: Generate and add AI image layers (all AI-generated images go here as editable elements)
- removeElement: Remove elements
- reorderElement: Change layer order
- viewCanvasPreview: View current canvas state

Current canvas:
${summarizeCanvasState(canvasState)}

Canvas dimensions: ${canvasState.width}x${canvasState.height}px

Positioning guidelines:
- Keep elements within canvas bounds (0,0) to (${canvasState.width},${canvasState.height})
- Center horizontally: x ≈ (canvasWidth - elementWidth) / 2
- Center vertically: y ≈ (canvasHeight - elementHeight) / 2

Layer order: Elements later in the elements array are rendered on top. Use reorderElement to adjust layering.`;
}
