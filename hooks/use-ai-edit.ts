"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CanvasState, CanvasAction } from "@/lib/canvas/types";

interface UseAiEditOptions {
  canvasState: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
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
        if (part.type === "dynamic-tool") {
          const name = toolDisplayName(part.toolName);

          // Dispatch tool results
          if (
            part.state === "output-available" &&
            !processedToolCalls.current.has(part.toolCallId)
          ) {
            processedToolCalls.current.add(part.toolCallId);
            dispatchToolResult(
              part.toolName,
              part.output as Record<string, unknown>,
              dispatch
            );
          }

          // Build status
          if (part.state === "input-streaming" || part.state === "input-available") {
            newLogs.push(`${name}...`);
          } else if (part.state === "output-available") {
            newLogs.push(name);
          }
        } else if (part.type === "text" && part.text) {
          newLogs.push(part.text);
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
  const statusText = isLoading && statusLog.length === 0
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
