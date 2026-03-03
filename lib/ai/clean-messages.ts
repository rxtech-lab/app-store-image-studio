import type { UIMessage } from "ai";

/**
 * Remove incomplete tool invocations from UI messages to prevent
 * AI_MissingToolResultsError when converting to model messages.
 * Tool parts use type `tool-${toolName}` and must have state "output-available" to be complete.
 */
export function cleanMessages(messages: UIMessage[]): UIMessage[] {
  return messages
    .filter(
      (m) => !(m.role === "user" && (!m.parts || m.parts.length === 0)),
    )
    .map((msg) => {
      if (msg.role !== "assistant") return msg;
      const cleanParts = msg.parts.filter((part) => {
        const p = part as unknown as Record<string, unknown>;
        if ("toolCallId" in p && p.state !== "output-available") {
          return false;
        }
        return true;
      });
      return { ...msg, parts: cleanParts };
    })
    .filter((msg) => msg.parts.length > 0);
}
