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
  createIconGenerateBackgroundTool,
  createIconAddImageElementTool,
  createGenerateIconConceptTool,
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
  const projectDescription = body.projectDescription as string | undefined;
  const projectId = body.projectId as string | undefined;
  const uiMessages = body.messages as UIMessage[];

  const systemPrompt = buildSystemPrompt(canvasState, projectDescription);
  const blobPrefix = projectId ?? session.user.id;

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
      generateBackground: createIconGenerateBackgroundTool(blobPrefix),
      updateElement: updateElementTool,
      addTextElement: addTextElementTool,
      addAccentElement: addAccentElementTool,
      removeElement: removeElementTool,
      addSvgElement: addSvgElementTool,
      addImageElement: createIconAddImageElementTool(blobPrefix),
      reorderElement: reorderElementTool,
      generateIconConcept: createGenerateIconConceptTool(blobPrefix),
      viewCanvasPreview: viewCanvasPreviewTool,
    },
  });

  return result.toUIMessageStreamResponse();
}

function buildSystemPrompt(
  canvasState: CanvasState,
  projectDescription?: string,
): string {
  const projectContext = projectDescription
    ? `\nApp description: ${projectDescription}`
    : "";

  return `You are a senior icon designer at Apple. You think in terms of composition, color harmony, and visual hierarchy — not just "put an image on a background." Before making any icon, you mentally plan the layers, colors, and overall feel. You design icons that are FLAT, SIMPLE, and ICONIC — like the best iOS/macOS app icons.

You are a canvas editor agent. You ONLY communicate through tool calls.

CRITICAL RULES:
- You MUST call tools to make any changes. Text responses alone do NOT modify the canvas.
- NEVER describe what you "would" do or "could" do. Just DO it by calling tools.
- For each change the user requests, call the appropriate tool immediately.
- Build layered icons using multiple addImageElement calls for SEPARATE visual elements — but NEVER split a single cohesive object into parts.
- After completing all edits, call viewCanvasPreview to verify the visual result.
- After all tool calls are complete, send a brief 1-sentence confirmation of what you changed.

TWO-PHASE ICON DESIGN WORKFLOW:
When creating a new icon, ALWAYS follow these two phases:

PHASE 0 — VIEW (when canvas has existing layers): If the canvas already has elements/layers, call viewCanvasPreview FIRST to see the current design before generating a concept. Then pass the preview URL as canvasPreviewUrl to generateIconConcept so the new concept builds on the existing design.
PHASE 1 — CONCEPT: Call generateIconConcept to generate a complete icon as a visual reference. If you viewed the canvas in Phase 0, pass the canvasPreviewUrl from the viewCanvasPreview result.
PHASE 2 — BUILD: Look at the concept image and recreate it with layers. Use setBackgroundColor for the background, then call addImageElement for each SEPARATE visual element. Keep cohesive objects together as one image — only split into layers when elements are truly independent (e.g. a background shape vs. a foreground symbol).

LAYER BUILDING RULES:
- ALWAYS use addImageElement for ALL visual elements. NEVER use addAccentElement.
- addImageElement generates flat 2D vector-style images with transparent backgrounds natively (no post-processing needed).
- When calling addImageElement, ALWAYS pass the concept image URL as referenceImageUrl so the generated layers match the concept's style and colors.
- NEVER split a single cohesive image into multiple parts. If the concept shows one object (e.g. a camera, a shield, a music note), generate it as ONE addImageElement call — do NOT separate it into pieces like "the body", "the lens", "the button".
- Use MULTIPLE addImageElement calls only for truly SEPARATE visual elements that are layered on top of each other (e.g. a background circle + an icon symbol on top + a small badge).
- "Layered" means distinct objects stacked/overlapping — NOT decomposing one object into fragments.
- NEVER create rounded corners, borders, or icon masks — Xcode/Android Studio handles that automatically.
- Only use addTextElement when the user explicitly asks for text.

SVG SUPPORT:
- Use addSvgElement for simple geometric shapes, icons, badges, or styled text that don't need AI-generated imagery.
- SVG content must include xmlns="http://www.w3.org/2000/svg" and a viewBox attribute.
- Prefer addSvgElement over addAccentElement for shapes that need precise styling, gradients, or complex geometry.
- For icon design, use addImageElement for main visual elements and addSvgElement for supplementary shapes/text.

EXAMPLE — "storage" app icon:
Phase 1: generateIconConcept("A storage app icon with a blue background, white hard drive symbol with a download arrow")
Phase 2 (after seeing the concept):
1. setBackgroundColor: "#0A84FF"
2. addImageElement: "A large flat white circle, centered" (separate background shape)
3. addImageElement: "A flat minimal hard drive symbol with a small downward arrow, simple geometric design" (the main symbol as ONE cohesive image — do NOT split the drive and arrow into separate layers)

ICON DESIGN PRINCIPLES:
- Canvas: ${canvasState.width}x${canvasState.height}px (square)
- NO rounded corners or icon masks — the OS handles icon shaping
- Full-bleed square — content and background fill the entire canvas
- FLAT 2D only — no 3D, no realistic rendering, no shadows, no skeuomorphism
- Bold, simple, readable at small sizes
- Strong silhouettes, 2-3 colors maximum
- Think SF Symbols, Apple icon design language

Available element types: text, image (AI-generated with transparent background), svg (vector graphics).
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
