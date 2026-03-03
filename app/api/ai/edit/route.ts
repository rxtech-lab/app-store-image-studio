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
  createEditGenerateBackgroundTool,
  createEditAddImageElementTool,
  createScreenshotTools,
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
  const screenshots = (body.screenshots ?? []) as AvailableScreenshot[];
  const projectDescription = body.projectDescription as string | undefined;
  const projectId = body.projectId as string | undefined;
  const uiMessages = body.messages as UIMessage[];

  const systemPrompt = buildSystemPrompt(
    canvasState,
    screenshots,
    projectDescription,
  );
  const blobPrefix = projectId ?? session.user.id;

  const messages = await convertToModelMessages(cleanMessages(uiMessages));

  // Force tool use on the first request, allow text responses on follow-ups
  // (follow-ups have tool role messages from previous tool executions)
  const isFollowUp = messages.some((m) => m.role === "tool");

  const screenshotTools = createScreenshotTools({ screenshots, canvasState });

  const result = streamText({
    model: gateway(AI_CONFIG.editModel),
    system: systemPrompt,
    messages,
    toolChoice: isFollowUp ? "auto" : "required",
    stopWhen: stepCountIs(20),
    tools: {
      setBackgroundColor: setBackgroundColorTool,
      generateBackground: createEditGenerateBackgroundTool(blobPrefix),
      updateElement: updateElementTool,
      addTextElement: addTextElementTool,
      addAccentElement: addAccentElementTool,
      removeElement: removeElementTool,
      addSvgElement: addSvgElementTool,
      ...screenshotTools,
      reorderElement: reorderElementTool,
      addImageElement: createEditAddImageElementTool(blobPrefix),
      viewCanvasPreview: viewCanvasPreviewTool,
    },
  });

  return result.toUIMessageStreamResponse();
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

Available element types on canvas: text, accent (shapes), screenshot (images), svg (vector graphics).
${projectContext}
Current canvas:
${summarizeCanvasState(canvasState)}
${screenshotsList}

Screenshot tools:
- Use addScreenshotElement to place an uploaded screenshot on the canvas. ALWAYS use a screenshotId from the available list above — never use placeholder URLs.
- Use changeScreenshotImage to swap which uploaded screenshot a canvas element shows.
- Use viewScreenshot to see the actual image content of a screenshot before making design decisions.
- Use addImageElement to generate an AI image and place it as a moveable image layer on the canvas (not the background).

SVG tools:
- Use addSvgElement to add SVG vector graphics (icons, badges, styled text, decorative elements).
- SVG content must include xmlns="http://www.w3.org/2000/svg" and a viewBox attribute.
- Prefer addSvgElement over addTextElement for text that needs specific styling, gradients, or multi-line layout.
- Prefer addSvgElement over addAccentElement for shapes that need precise styling, gradients, or complex geometry.

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
