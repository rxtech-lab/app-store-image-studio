"use client";

import { useEffect, useRef } from "react";
import { isToolUIPart, getToolName } from "ai";
import type { UIMessage } from "ai";
import { uploadBlobClient } from "@/lib/blob-client";

interface UseCanvasPreviewToolOptions {
  messages: UIMessage[];
  capturePreview: () => string | undefined;
  addToolOutput: (opts: {
    tool: never;
    toolCallId: string;
    output: never;
  }) => void;
  projectId: string;
}

export function useCanvasPreviewTool({
  messages,
  capturePreview,
  addToolOutput,
  projectId,
}: UseCanvasPreviewToolOptions) {
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const pendingPreviewRef = useRef(new Set<string>());

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (!isToolUIPart(part)) continue;
        const p = part as unknown as Record<string, unknown>;
        if (
          getToolName(part) === "viewCanvasPreview" &&
          p.state === "input-available" &&
          !pendingPreviewRef.current.has(p.toolCallId as string)
        ) {
          const toolCallId = p.toolCallId as string;
          pendingPreviewRef.current.add(toolCallId);
          const base64 = capturePreview();
          if (!base64) {
            addToolOutput({
              tool: "viewCanvasPreview" as never,
              toolCallId,
              output: { error: "Canvas preview not available" } as never,
            });
          } else {
            const bytes = Uint8Array.from(atob(base64), (c) =>
              c.charCodeAt(0),
            );
            const file = new File([bytes], "canvas-preview.png", {
              type: "image/png",
            });
            const prefix = projectIdRef.current ?? "";
            uploadBlobClient(file, `canvas-previews/${prefix}/${Date.now()}.png`)
              .then((url) => {
                addToolOutput({
                  tool: "viewCanvasPreview" as never,
                  toolCallId,
                  output: { url } as never,
                });
              })
              .catch((err) => {
                console.error("[viewCanvasPreview] upload failed:", err);
                addToolOutput({
                  tool: "viewCanvasPreview" as never,
                  toolCallId,
                  output: { error: "Upload failed" } as never,
                });
              });
          }
        }
      }
    }
  }, [messages, capturePreview, addToolOutput]);
}
