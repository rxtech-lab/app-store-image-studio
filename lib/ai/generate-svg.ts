import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { AI_CONFIG } from "@/lib/settings";

/**
 * Generate SVG code from a text description using an AI model.
 * Returns a clean, valid SVG string.
 */
export async function generateSvg(prompt: string): Promise<string> {
  const result = await generateText({
    model: gateway(AI_CONFIG.textModel),
    system: `You are an SVG generation expert. Generate clean, valid SVG code based on the user's description.

RULES:
- Output ONLY the SVG code, nothing else. No markdown, no explanation, no code fences.
- Start with <svg and end with </svg>
- Use a viewBox attribute (e.g., viewBox="0 0 100 100") for scalability — do NOT use fixed width/height attributes on the root <svg> element
- Use simple, clean shapes and paths
- Use solid colors, not gradients unless specifically requested
- Keep the SVG minimal and optimized — avoid unnecessary attributes
- Do not include comments, metadata, or XML declarations
- Ensure all elements are visible within the viewBox
- Use descriptive fill colors (hex values like #FF5733)`,
    prompt: `Generate an SVG for: ${prompt}`,
  });

  let svg = result.text.trim();

  // Strip markdown code fences if present
  if (svg.startsWith("```")) {
    svg = svg.replace(/^```(?:svg|xml)?\n?/, "").replace(/\n?```$/, "");
  }

  // Validate basic SVG structure
  if (!svg.startsWith("<svg") || !svg.endsWith("</svg>")) {
    throw new Error("Generated output is not valid SVG");
  }

  return svg;
}
