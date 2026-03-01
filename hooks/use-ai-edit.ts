"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  isToolUIPart,
  getToolName,
} from "ai";
import type { UIMessage } from "ai";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type Konva from "konva";
import type { CanvasState, CanvasAction } from "@/lib/canvas/types";
import { saveAiMessages } from "@/actions/templates";
import { useCanvasPreviewTool } from "./use-canvas-preview-tool";

interface AvailableScreenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

interface UseAiEditOptions {
  templateId: string;
  initialMessages?: UIMessage[];
  canvasState: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  stageRef: React.RefObject<Konva.Stage | null>;
  screenshots: AvailableScreenshot[];
  projectDescription?: string;
  onComplete?: () => void;
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

/**
 * Strip base64 image data from tool outputs before saving to DB.
 */
function sanitizeForStorage(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => ({
    ...msg,
    parts: msg.parts.map((part) => {
      const p = part as unknown as Record<string, unknown>;
      if (
        p.type === "tool-invocation" &&
        p.output &&
        typeof p.output === "object"
      ) {
        const output = p.output as Record<string, unknown>;
        if ("base64" in output) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { base64, ...rest } = output;
          return { ...p, output: rest } as typeof part;
        }
      }
      return part;
    }),
  }));
}

export function useAiEdit({
  templateId,
  initialMessages: initialMessagesProp,
  canvasState,
  dispatch,
  stageRef,
  screenshots,
  projectDescription,
  onComplete,
}: UseAiEditOptions) {
  const processedToolCalls = useRef(new Set<string>());
  const canvasStateRef = useRef(canvasState);
  canvasStateRef.current = canvasState;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const templateIdRef = useRef(templateId);
  templateIdRef.current = templateId;
  const initialMessagesRef = useRef(initialMessagesProp);
  initialMessagesRef.current = initialMessagesProp;

  const [statusLog, setStatusLog] = useState<string[]>([]);
  // Track where the current interaction starts so we only show new status logs
  const interactionStartRef = useRef(0);

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
          screenshots,
          projectDescription,
          projectId: templateIdRef.current,
        }),
      }),
    [screenshots, projectDescription],
  );

  const { messages, sendMessage, status, setMessages, stop, addToolOutput } =
    useChat({
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  // Handle viewCanvasPreview as a client-side tool
  useCanvasPreviewTool({
    messages,
    capturePreview,
    addToolOutput,
    projectId: templateId,
  });

  // Load saved messages when template changes
  useEffect(() => {
    processedToolCalls.current = new Set();
    const msgs = initialMessagesRef.current ?? [];
    if (msgs.length > 0) {
      // Pre-populate processedToolCalls so we don't re-dispatch old results
      for (const msg of msgs) {
        if (msg.role === "assistant") {
          for (const part of msg.parts) {
            if (isToolUIPart(part)) {
              const p = part as unknown as Record<string, unknown>;
              processedToolCalls.current.add(p.toolCallId as string);
            }
          }
        }
      }
      setMessages(msgs);
      interactionStartRef.current = msgs.length;
    } else {
      setMessages([]);
      interactionStartRef.current = 0;
    }
    setStatusLog([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  // Process tool results and build status log (only from current interaction)
  useEffect(() => {
    const newLogs: string[] = [];
    const startIdx = interactionStartRef.current;

    for (let i = startIdx; i < messages.length; i++) {
      const message = messages[i];
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (isToolUIPart(part)) {
          const toolName = getToolName(part);
          const name = toolDisplayName(toolName);
          const p = part as unknown as Record<string, unknown>;
          const output = getToolOutput(p);

          if (
            output &&
            !processedToolCalls.current.has(p.toolCallId as string)
          ) {
            processedToolCalls.current.add(p.toolCallId as string);
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
      // Mark the start of a new interaction for status log display
      interactionStartRef.current = messages.length;
      setStatusLog([]);
      sendMessage({ text: prompt });
    },
    [sendMessage, messages.length],
  );

  const stopEdit = useCallback(() => {
    stop();
  }, [stop]);

  const clearHistory = useCallback(() => {
    processedToolCalls.current.clear();
    setStatusLog([]);
    setMessages([]);
    interactionStartRef.current = 0;
    if (templateIdRef.current) {
      saveAiMessages(templateIdRef.current, []);
    }
  }, [setMessages]);

  const isLoading = status === "submitted" || status === "streaming";
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (
      wasLoadingRef.current &&
      !isLoading &&
      processedToolCalls.current.size > 0
    ) {
      onCompleteRef.current?.();
      // Save messages to DB (last 20, with base64 stripped)
      if (templateIdRef.current && messages.length > 0) {
        const sanitized = sanitizeForStorage(messages);
        const trimmed = sanitized.slice(-20);
        saveAiMessages(templateIdRef.current, trimmed);
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, messages]);

  // Build display text from accumulated status log
  const statusText =
    isLoading && statusLog.length === 0 ? "Thinking..." : statusLog.join(" → ");

  return {
    sendEdit,
    stopEdit,
    clearHistory,
    isLoading,
    statusText: isLoading || statusLog.length > 0 ? statusText : "",
    hasHistory: messages.length > 0 && !isLoading,
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
