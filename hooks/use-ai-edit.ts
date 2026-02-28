"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  isToolUIPart,
  getToolName,
} from "ai";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CanvasState, CanvasAction } from "@/lib/canvas/types";

interface UseAiEditOptions {
  canvasState: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

// Extract output from a completed tool part (state: "output-available")
function getToolOutput(
  part: Record<string, unknown>,
): Record<string, unknown> | null {
  if (part.state !== "output-available") return null;
  const raw = part.output;
  return raw && typeof raw === "object"
    ? (raw as Record<string, unknown>)
    : null;
}

export function useAiEdit({ canvasState, dispatch }: UseAiEditOptions) {
  const processedToolCalls = useRef(new Set<string>());
  const canvasStateRef = useRef(canvasState);
  canvasStateRef.current = canvasState;

  const [statusLog, setStatusLog] = useState<string[]>([]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/edit",
        body: () => ({ canvasState: canvasStateRef.current }),
      }),
    []
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  // Process tool results and build status log
  useEffect(() => {
    const newLogs: string[] = [];

    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (isToolUIPart(part)) {
          const toolName = getToolName(part);
          const name = toolDisplayName(toolName);
          const output = getToolOutput(part as Record<string, unknown>);

          if (output && !processedToolCalls.current.has(part.toolCallId)) {
            processedToolCalls.current.add(part.toolCallId);
            dispatchToolResult(toolName, output, dispatch);
          }

          newLogs.push(output ? name : `${name}...`);
        } else if (
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          (part as { type: string }).type === "text" &&
          "text" in part
        ) {
          const text = (part as { text: string }).text;
          if (text) newLogs.push(text);
        }
      }
    }

    if (newLogs.length > 0) {
      setStatusLog(newLogs);
    }
  }, [messages, dispatch]);

  const sendEdit = useCallback(
    (prompt: string) => {
      processedToolCalls.current.clear();
      setStatusLog([]);
      setMessages([]);
      sendMessage({ text: prompt });
    },
    [sendMessage, setMessages]
  );

  const isLoading = status === "submitted" || status === "streaming";

  // Build display text from accumulated status log
  const statusText =
    isLoading && statusLog.length === 0
      ? "Thinking..."
      : statusLog.join(" → ");

  return {
    sendEdit,
    isLoading,
    statusText: isLoading || statusLog.length > 0 ? statusText : "",
  };
}

const TOOL_LABELS: Record<string, string> = {
  setBackgroundColor: "Background color",
  generateBackground: "Generating background",
  updateElement: "Updating element",
  addTextElement: "Adding text",
  addAccentElement: "Adding shape",
  removeElement: "Removing element",
};

function toolDisplayName(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName;
}

function dispatchToolResult(
  toolName: string,
  result: Record<string, unknown>,
  dispatch: React.Dispatch<CanvasAction>
) {
  switch (toolName) {
    case "setBackgroundColor":
      dispatch({
        type: "SET_BACKGROUND_COLOR",
        payload: result.color as string,
      });
      break;
    case "generateBackground":
      dispatch({
        type: "SET_BACKGROUND_IMAGE",
        payload: result.url as string,
      });
      break;
    case "updateElement":
      dispatch({
        type: "UPDATE_ELEMENT",
        payload: result as { id: string } & Record<string, unknown>,
      });
      break;
    case "addTextElement":
    case "addAccentElement":
      dispatch({
        type: "ADD_ELEMENT",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: result as any,
      });
      break;
    case "removeElement":
      dispatch({
        type: "REMOVE_ELEMENT",
        payload: result.id as string,
      });
      break;
  }
}
