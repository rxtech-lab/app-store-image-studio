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
          "Generate an image layer with a transparent background using AI, and add it to the canvas. The image will be generated with a green screen background and automatically processed to have transparency.",
        inputSchema: zodSchema(addImageElementSchema),
        execute: async ({ prompt: imgPrompt, ...params }) => {
          // Generate with chromakey green background
          const genResult = await generateText({
            model: gateway(AI_CONFIG.backgroundModel),
            prompt: `${imgPrompt}. STYLE: Flat 2D vector illustration. Solid fills, no textures, no gradients within shapes. Like an SVG icon or SF Symbol — pure geometric shapes with flat solid colors. Absolutely NO 3D, NO realistic rendering, NO shadows, NO highlights, NO reflections, NO skeuomorphism, NO perspective. Just flat colored shapes on a single plane. IMPORTANT: The subject must NOT contain any green, lime, or teal colors — avoid all shades of green entirely. BACKGROUND: Solid flat uniform chromakey green #00FF00. The entire background must be this single pure green color with NO variation. The subject should have sharp, clean edges against the green background.`,
          });
          const imageFile = genResult.files.find((f) =>
            f.mediaType?.startsWith("image/"),
          );
          if (!imageFile) throw new Error("No image generated");

          // Remove green screen to create transparency
          const rawBuffer = Buffer.from(imageFile.uint8Array);
          const transparentBuffer = await removeGreenScreen(rawBuffer);

          const file = new File(
            [new Uint8Array(transparentBuffer)],
            "icon-layer.png",
            {
              type: "image/png",
            },
          );
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
      generateIconConcept: tool({
        description:
          "Generate a complete icon concept image as a visual reference. This does NOT add anything to the canvas — it only shows you the concept so you can then decompose it into layers using addImageElement. Always call this FIRST when creating a new icon.",
        inputSchema: zodSchema(generateIconConceptSchema),
        execute: async ({ prompt: conceptPrompt }) => {
          const genResult = await generateText({
            model: gateway(AI_CONFIG.backgroundModel),
            prompt: `Design a complete app icon: ${conceptPrompt}. Style: Flat 2D, minimal, Apple-style app icon. Bold solid colors, simple geometric shapes, clean vector look. Square format, no rounded corners. No text unless specified. NOT realistic, NOT 3D, NOT photographic.`,
          });
          const imageFile = genResult.files.find((f) =>
            f.mediaType?.startsWith("image/"),
          );
          if (!imageFile) throw new Error("No concept image generated");
          const base64 = Buffer.from(imageFile.uint8Array).toString("base64");
          return { base64 };
        },
        toModelOutput: async ({ output }) => {
          const o = output as Record<string, unknown>;
          if (!o.base64) return { type: "text", value: "Failed to generate concept" };
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
                text: "Icon concept generated. Now decompose this into separate layers using setBackgroundColor and multiple addImageElement calls. Each addImageElement should describe ONE element from this concept.",
              },
            ],
          };
        },
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

  return `You are a senior icon designer at Apple. You think in terms of composition, color harmony, and visual hierarchy — not just "put an image on a background." Before making any icon, you mentally plan the layers, colors, and overall feel. You design icons that are FLAT, SIMPLE, and ICONIC — like the best iOS/macOS app icons.

You are a canvas editor agent. You ONLY communicate through tool calls.

CRITICAL RULES:
- You MUST call tools to make any changes. Text responses alone do NOT modify the canvas.
- NEVER describe what you "would" do or "could" do. Just DO it by calling tools.
- For each change the user requests, call the appropriate tool immediately.
- ALWAYS call addImageElement MULTIPLE TIMES to build layered icons — never just once.
- After completing all edits, call viewCanvasPreview to verify the visual result.
- After all tool calls are complete, send a brief 1-sentence confirmation of what you changed.

TWO-PHASE ICON DESIGN WORKFLOW:
When creating a new icon, ALWAYS follow these two phases:

PHASE 1 — CONCEPT: Call generateIconConcept first to generate a complete icon as a visual reference.
PHASE 2 — BUILD: Look at the concept image and decompose it into layers. Use setBackgroundColor for the background, then call addImageElement MULTIPLE TIMES — once for each visual element you see in the concept.

LAYER BUILDING RULES:
- ALWAYS use addImageElement for ALL visual elements. NEVER use addAccentElement.
- addImageElement generates flat 2D vector-style images with transparent backgrounds.
- Each addImageElement prompt should describe ONE element from the concept — not the entire icon.
- You MUST create AT LEAST 2-3 image layers. A single addImageElement call is NOT acceptable.
- NEVER create rounded corners, borders, or icon masks — Xcode/Android Studio handles that automatically.
- AVOID green colors in prompts — green is removed during transparency processing.
- Only use addTextElement when the user explicitly asks for text.

EXAMPLE — "storage" app icon:
Phase 1: generateIconConcept("A storage app icon with a blue background, white hard drive symbol with a download arrow")
Phase 2 (after seeing the concept):
1. setBackgroundColor: "#0A84FF"
2. addImageElement: "A large flat white circle, centered" (background shape from concept)
3. addImageElement: "A flat minimal hard drive symbol, simple geometric rectangles stacked" (main symbol from concept)
4. addImageElement: "A small flat white downward arrow" (detail from concept)

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
