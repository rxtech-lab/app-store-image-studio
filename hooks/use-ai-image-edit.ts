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
import { hideTransformers } from "@/lib/canvas/export-utils";
import { saveGeneratedImageAiMessages } from "@/actions/image-projects";
import { useCanvasPreviewTool } from "./use-canvas-preview-tool";

interface UseAiImageEditOptions {
  imageId: string;
  initialMessages?: UIMessage[];
  canvasState: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  stageRef: React.RefObject<Konva.Stage | null>;
  onComplete?: () => void;
  onSaveMessages?: (messages: UIMessage[]) => void;
}

function getToolOutput(
  part: Record<string, unknown>,
): Record<string, unknown> | null {
  if (part.state !== "output-available") return null;
  const raw = part.output;
  return raw && typeof raw === "object"
    ? (raw as Record<string, unknown>)
    : null;
}

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

export function useAiImageEdit({
  imageId,
  initialMessages: initialMessagesProp,
  canvasState,
  dispatch,
  stageRef,
  onComplete,
  onSaveMessages,
}: UseAiImageEditOptions) {
  const processedToolCalls = useRef(new Set<string>());
  const canvasStateRef = useRef(canvasState);
  canvasStateRef.current = canvasState;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const imageIdRef = useRef(imageId);
  imageIdRef.current = imageId;
  const initialMessagesRef = useRef(initialMessagesProp);
  initialMessagesRef.current = initialMessagesProp;

  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [aiText, setAiText] = useState("");
  const interactionStartRef = useRef(0);

  const capturePreview = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const restoreTransformers = hideTransformers(stage);
    const scale = stage.scaleX();
    const dataUrl = stage.toDataURL({ pixelRatio: 1 / scale });
    restoreTransformers();
    return dataUrl.replace(/^data:image\/\w+;base64,/, "");
  }, [stageRef]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/image-edit",
        body: () => ({
          canvasState: canvasStateRef.current,
          imageId: imageIdRef.current,
        }),
      }),
    [],
  );

  const shouldAutoSend = useCallback(
    ({ messages: msgs }: { messages: UIMessage[] }) => {
      return lastAssistantMessageIsCompleteWithToolCalls({ messages: msgs });
    },
    [],
  );

  const { messages, sendMessage, status, setMessages, stop, addToolOutput } =
    useChat({
      transport,
      sendAutomaticallyWhen: shouldAutoSend,
    });

  const stopRef = useRef(stop);
  stopRef.current = stop;

  useCanvasPreviewTool({
    messages,
    capturePreview,
    addToolOutput,
    projectId: imageId,
  });

  useEffect(() => {
    processedToolCalls.current = new Set();
    const msgs = initialMessagesRef.current ?? [];
    if (msgs.length > 0) {
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
  }, [imageId]);

  useEffect(() => {
    const newLogs: string[] = [];
    let latestText = "";
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
          if (text) latestText = text;
        }
      }
    }

    if (newLogs.length > 0) {
      setStatusLog(newLogs);
    }
    setAiText(latestText);
  }, [messages, dispatch]);

  const sendEdit = useCallback(
    (prompt: string, imageUrls?: string[]) => {
      interactionStartRef.current = messages.length;
      setStatusLog([]);
      setAiText("");

      const files: { type: "file"; mediaType: "image/png"; url: string }[] = [];
      if (imageUrls) {
        for (const u of imageUrls) {
          files.push({ type: "file", mediaType: "image/png", url: u });
        }
      }

      sendMessage({
        text: prompt,
        files: files.length > 0 ? files : undefined,
      });
    },
    [sendMessage, messages.length],
  );

  const stopEdit = useCallback(() => {
    stop();
  }, [stop]);

  const onSaveMessagesRef = useRef(onSaveMessages);
  onSaveMessagesRef.current = onSaveMessages;

  const clearHistory = useCallback(() => {
    processedToolCalls.current.clear();
    setStatusLog([]);
    setAiText("");
    setMessages([]);
    interactionStartRef.current = 0;
    if (onSaveMessagesRef.current) {
      onSaveMessagesRef.current([]);
    } else if (imageIdRef.current) {
      saveGeneratedImageAiMessages(imageIdRef.current, []);
    }
  }, [setMessages]);

  const hasPendingToolCalls =
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant" &&
    messages[messages.length - 1].parts.some(
      (part) => isToolUIPart(part) && part.state === "input-available",
    );
  const willAutoSend =
    status === "ready" && shouldAutoSend({ messages });
  const isLoading =
    status === "submitted" ||
    status === "streaming" ||
    hasPendingToolCalls ||
    willAutoSend;
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (
      wasLoadingRef.current &&
      !isLoading &&
      processedToolCalls.current.size > 0
    ) {
      onCompleteRef.current?.();
      if (messages.length > 0) {
        const sanitized = sanitizeForStorage(messages);
        const trimmed = sanitized.slice(-20);
        if (onSaveMessagesRef.current) {
          onSaveMessagesRef.current(trimmed);
        } else if (imageIdRef.current) {
          saveGeneratedImageAiMessages(imageIdRef.current, trimmed);
        }
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, messages]);

  const statusText =
    isLoading && statusLog.length === 0 ? "Thinking..." : statusLog.join(" → ");

  return {
    sendEdit,
    stopEdit,
    clearHistory,
    isLoading,
    statusText: isLoading || statusLog.length > 0 ? statusText : "",
    aiText: isLoading || aiText ? aiText : "",
    hasHistory: messages.length > 0 && !isLoading,
  };
}

const TOOL_LABELS: Record<string, string> = {
  setBackgroundColor: "Background color",
  updateElement: "Updating element",
  addTextElement: "Adding text",
  addAccentElement: "Adding shape",
  addSvgElement: "Adding SVG",
  addImageElement: "Generating image layer",
  removeElement: "Removing element",
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
    case "updateElement":
      dispatch({
        type: "UPDATE_ELEMENT",
        payload: result as { id: string } & Record<string, unknown>,
      });
      break;
    case "addTextElement":
    case "addAccentElement":
    case "addSvgElement":
    case "addImageElement":
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
