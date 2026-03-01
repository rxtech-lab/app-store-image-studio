import { gateway } from "@ai-sdk/gateway";
import { AI_CONFIG } from "@/lib/settings";

export const textModel = gateway(AI_CONFIG.textModel);

// Background model - uses generateText with image generation support
export const backgroundModel = gateway(AI_CONFIG.imageModel);

// Unified edit model - uses streamText with tool use for canvas manipulation
export const editModel = gateway(AI_CONFIG.editModel);
