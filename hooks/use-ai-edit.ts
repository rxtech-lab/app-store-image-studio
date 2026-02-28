"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  isToolUIPart,
  getToolName,
} from "ai";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type Konva from "konva";
import type { CanvasState, CanvasAction } from "@/lib/canvas/types";

interface AvailableScreenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

interface UseAiEditOptions {
  canvasState: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  stageRef: React.RefObject<Konva.Stage | null>;
  screenshots: AvailableScreenshot[];
  projectDescription?: string;
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

export function useAiEdit({
  canvasState,
  dispatch,
  stageRef,
  screenshots,
  projectDescription,
}: UseAiEditOptions) {
  const processedToolCalls = useRef(new Set<string>());
  const canvasStateRef = useRef(canvasState);
  canvasStateRef.current = canvasState;

  const [statusLog, setStatusLog] = useState<string[]>([]);

  const capturePreview = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const scale = stage.scaleX();
    const dataUrl = stage.toDataURL({ pixelRatio: 1 / scale });
    // Strip the data:image/png;base64, prefix
    return dataUrl.replace(/^data:image\/\w+;base64,/, "");
  }, [stageRef]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/edit",
        body: () => ({
          canvasState: canvasStateRef.current,
          canvasPreviewBase64: capturePreview(),
          screenshots,
          projectDescription,
        }),
      }),
    [capturePreview, screenshots, projectDescription],
  );

  const { messages, sendMessage, status, setMessages, stop } = useChat({
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
            dispatchToolResult(
              toolName,
              output,
              dispatch,
              canvasStateRef.current,
            );
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
    [sendMessage, setMessages],
  );

  const stopEdit = useCallback(() => {
    stop();
  }, [stop]);

  const isLoading = status === "submitted" || status === "streaming";

  // Build display text from accumulated status log
  const statusText =
    isLoading && statusLog.length === 0 ? "Thinking..." : statusLog.join(" → ");

  return {
    sendEdit,
    stopEdit,
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
  addScreenshotElement: "Adding screenshot",
  changeScreenshotImage: "Changing screenshot",
  addImageElement: "Generating image layer",
  removeElement: "Removing element",
  viewScreenshot: "Viewing screenshot",
  viewCanvasPreview: "Viewing canvas",
  reorderElement: "Reordering layer",
};

function toolDisplayName(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName;
}

function dispatchToolResult(
  toolName: string,
  result: Record<string, unknown>,
  dispatch: React.Dispatch<CanvasAction>,
  canvasState: CanvasState,
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
    case "addImageElement":
      dispatch({
        type: "ADD_ELEMENT",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: result as any,
      });
      break;
    case "addScreenshotElement":
      if (!result.error) {
        dispatch({
          type: "ADD_ELEMENT",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: result as any,
        });
      }
      break;
    case "changeScreenshotImage":
      if (!result.error) {
        dispatch({
          type: "UPDATE_ELEMENT",
          payload: result as { id: string } & Record<string, unknown>,
        });
      }
      break;
    case "removeElement":
      dispatch({
        type: "REMOVE_ELEMENT",
        payload: result.id as string,
      });
      break;
    case "reorderElement": {
      const id = result.id as string;
      const direction = result.direction as "up" | "down" | "front" | "back";
      if (direction === "up" || direction === "down") {
        dispatch({ type: "REORDER_ELEMENT", payload: { id, direction } });
      } else {
        const els = canvasState.elements;
        const idx = els.findIndex((el) => el.id === id);
        if (idx !== -1) {
          const reordered = els.filter((el) => el.id !== id);
          if (direction === "front") reordered.push(els[idx]);
          else reordered.unshift(els[idx]);
          dispatch({ type: "SET_ELEMENTS", payload: reordered });
        }
      }
      break;
    }
  }
}
