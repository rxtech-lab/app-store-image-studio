import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { gateway } from "@ai-sdk/gateway";
import { auth } from "@/lib/auth";
import { AI_CONFIG } from "@/lib/settings";
import { summarizeCanvasState } from "@/lib/ai/summarize-canvas";
import { cleanMessages } from "@/lib/ai/clean-messages";
import {
  setBackgroundColorTool,
  updateElementTool,
  addTextElementTool,
  addAccentElementTool,
  removeElementTool,
  addSvgElementTool,
  reorderElementTool,
  viewCanvasPreviewTool,
  createImageEditAddImageElementTool,
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

  const messages = await convertToModelMessages(cleanMessages(uiMessages));

  const isFollowUp = messages.some((m) => m.role === "tool");

  const result = streamText({
    model: gateway(AI_CONFIG.editModel),
    system: systemPrompt,
    messages,
    toolChoice: isFollowUp ? "auto" : "required",
    stopWhen: stepCountIs(20),
    tools: {
      setBackgroundColor: setBackgroundColorTool,
      updateElement: updateElementTool,
      addTextElement: addTextElementTool,
      addAccentElement: addAccentElementTool,
      removeElement: removeElementTool,
      addImageElement: createImageEditAddImageElementTool(blobPrefix),
      addSvgElement: addSvgElementTool,
      reorderElement: reorderElementTool,
      viewCanvasPreview: viewCanvasPreviewTool,
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
- updateElement: Update element properties (position, size, style, svgContent)
- addSvgElement: Add SVG vector graphics to the canvas. This is the PRIMARY tool for adding text, shapes, icons, badges, logos, decorative elements, and any vector content. Generate complete valid SVG markup.
- addTextElement: Add a simple plain text element (only use when addSvgElement is not appropriate, e.g. for basic single-line labels)
- addAccentElement: Add basic shapes — PREFER addSvgElement over this for any shape that needs precise styling, gradients, or complex geometry
- addImageElement: Generate and add AI image layers — set transparentBackground=true for foreground subjects (icons, objects), false for scenes/backgrounds; set size based on element aspect ratio
- removeElement: Remove elements
- reorderElement: Change layer order
- viewCanvasPreview: View current canvas state

TOOL PREFERENCE:
- ALWAYS prefer addSvgElement over addTextElement and addAccentElement. SVG gives you full control over styling, gradients, multiple shapes, and complex layouts in a single element.
- Use addSvgElement for: text (styled, multi-line, or decorative), shapes (rectangles, circles, stars, badges, ribbons), icons, logos, and any vector content.
- Only fall back to addTextElement for the simplest plain text, and addAccentElement for a trivial solid-color rectangle/circle.

SVG GUIDELINES:
- SVG content must include xmlns="http://www.w3.org/2000/svg" and a viewBox attribute matching the element's width/height.
- Use <text> for text, <rect>/<circle>/<path>/<polygon> for shapes within the SVG.
- Set appropriate fill colors, font-size, font-family, font-weight, and text-anchor in SVG attributes.
- For centered text, use text-anchor="middle" with x at 50% of viewBox width.

Current canvas:
${summarizeCanvasState(canvasState)}

Canvas dimensions: ${canvasState.width}x${canvasState.height}px

Positioning guidelines:
- Keep elements within canvas bounds (0,0) to (${canvasState.width},${canvasState.height})
- Center horizontally: x ≈ (canvasWidth - elementWidth) / 2
- Center vertically: y ≈ (canvasHeight - elementHeight) / 2

Layer order: Elements later in the elements array are rendered on top. Use reorderElement to adjust layering.`;
}
