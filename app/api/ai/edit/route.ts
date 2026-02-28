import {
  streamText,
  generateText,
  tool,
  zodSchema,
  convertToModelMessages,
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
  const uiMessages = body.messages as UIMessage[];

  const systemPrompt = buildSystemPrompt(canvasState);
  const userId = session.user.id;

  const messages = await convertToModelMessages(uiMessages);

  // Force tool use on the first request, allow text responses on follow-ups
  // (follow-ups have tool role messages from previous tool executions)
  const isFollowUp = messages.some((m) => m.role === "tool");

  const result = streamText({
    model: gateway(AI_CONFIG.editModel),
    system: systemPrompt,
    messages,
    toolChoice: isFollowUp ? "auto" : "required",
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
            prompt: `App Store marketing image background: ${bgPrompt}. High quality, vibrant, suitable as a background for app screenshots. No text.`,
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
    },
  });

  return result.toUIMessageStreamResponse();
}

function buildSystemPrompt(canvasState: CanvasState): string {
  return `You are a canvas editor agent. You ONLY communicate through tool calls.

CRITICAL RULES:
- You MUST call tools to make any changes. Text responses alone do NOT modify the canvas.
- NEVER describe what you "would" do or "could" do. Just DO it by calling tools.
- For each change the user requests, call the appropriate tool immediately.
- Call multiple tools for complex requests (e.g., add text AND change background).
- After all tool calls are complete, send a brief 1-sentence confirmation of what you changed.

Available element types on canvas: text, accent (shapes), screenshot (images).

Canvas: ${canvasState.width}x${canvasState.height}px (origin top-left)

Current state:
${JSON.stringify(canvasState, null, 2)}

Positioning guidelines:
- Keep elements within canvas bounds (0,0) to (${canvasState.width},${canvasState.height})
- Headlines: fontSize 60-120, Body: fontSize 24-48
- Center horizontally: x ≈ (canvasWidth - elementWidth) / 2
- Use generateBackground for image backgrounds, setBackgroundColor for solid colors`;
}
