import {
  streamText,
  generateText,
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
  generateBackgroundSchema,
  updateElementSchema,
  addTextElementSchema,
  addAccentElementSchema,
  removeElementSchema,
  viewCanvasPreviewSchema,
  reorderElementSchema,
  addImageElementSchema,
  generateIconConceptSchema,
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
          const result = await generateImage({
            model: gateway.image(AI_CONFIG.iconImageModel),
            prompt: `Clean, minimal icon background: ${bgPrompt}. Simple smooth gradient or solid color. Apple-style, elegant. No text, no objects, no patterns.`,
            size: "1024x1024",
          });
          const buffer = Buffer.from(result.images[0].base64, "base64");
          const file = new File([buffer], "background.png", {
            type: "image/png",
          });
          const url = await uploadBlob(
            file,
            `icon-backgrounds/${blobPrefix}/${Date.now()}.png`,
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
        description:
          "Add a new accent/shape element to the canvas. Add descriptive name to the layer as well.",
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
          "Generate an image layer with a transparent background using AI, and add it to the canvas. Pass the concept image URL as referenceImageUrl to maintain visual consistency.",
        inputSchema: zodSchema(addImageElementSchema),
        execute: async ({
          prompt: imgPrompt,
          referenceImageUrl,
          ...params
        }) => {
          const promptText = `${imgPrompt}. STYLE: Flat 2D vector illustration. Solid fills, no textures, no gradients within shapes. Like an SVG icon or SF Symbol — pure geometric shapes with flat solid colors. Absolutely NO 3D, NO realistic rendering, NO shadows, NO highlights, NO reflections, NO skeuomorphism, NO perspective. Just flat colored shapes on a single plane.`;

          console.log("Generating image with prompt:", promptText);
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
          const file = new File([buffer], "icon-layer.png", {
            type: "image/png",
          });
          const url = await uploadBlob(
            file,
            `icon-layers/${blobPrefix}/${Date.now()}.png`,
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
      generateIconConcept: tool({
        description:
          "Generate a complete icon concept image as a visual reference. This does NOT add anything to the canvas — it only shows you the concept so you can then decompose it into layers using addImageElement. Always call this FIRST when creating a new icon. When the canvas already has layers, pass the canvasPreviewUrl from viewCanvasPreview so the concept builds on the existing design.",
        inputSchema: zodSchema(generateIconConceptSchema),
        execute: async ({ prompt: conceptPrompt, canvasPreviewUrl }) => {
          const styleGuide = `Style: Flat 2D, minimal, Apple-style app icon. Bold solid colors, simple geometric shapes, clean vector look. Square format, no rounded corners. No text unless specified. NOT realistic, NOT 3D, NOT photographic.`;

          let genResult;
          if (canvasPreviewUrl) {
            const res = await fetch(canvasPreviewUrl);
            const imageBuffer = Buffer.from(await res.arrayBuffer());
            genResult = await generateText({
              model: gateway(AI_CONFIG.imageModel),
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "image",
                      image: imageBuffer,
                    },
                    {
                      type: "text",
                      text: `This is the current canvas design. Based on this existing design, generate an improved/updated complete app icon concept: ${conceptPrompt}. ${styleGuide}`,
                    },
                  ],
                },
              ],
            });
          } else {
            genResult = await generateText({
              model: gateway(AI_CONFIG.imageModel),
              prompt: `Design a complete app icon: ${conceptPrompt}. ${styleGuide}`,
            });
          }

          const imageFile = genResult.files.find((f) =>
            f.mediaType?.startsWith("image/"),
          );
          if (!imageFile) throw new Error("No image generated");
          const buffer = Buffer.from(imageFile.uint8Array);
          const file = new File([buffer], "icon-concept.png", {
            type: "image/png",
          });
          const url = await uploadBlob(
            file,
            `icon-concepts/${blobPrefix}/${Date.now()}.png`,
          );
          return { url };
        },
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

Available element types: text, image (AI-generated with transparent background).
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
