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
import { saveIconAiMessages } from "@/actions/icon-projects";
import { useCanvasPreviewTool } from "./use-canvas-preview-tool";

interface UseAiIconEditOptions {
  iconProjectId: string;
  initialMessages?: UIMessage[];
  canvasState: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  stageRef: React.RefObject<Konva.Stage | null>;
  projectDescription?: string;
  onComplete?: () => void;
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

export function useAiIconEdit({
  iconProjectId,
  initialMessages: initialMessagesProp,
  canvasState,
  dispatch,
  stageRef,
  projectDescription,
  onComplete,
}: UseAiIconEditOptions) {
  const processedToolCalls = useRef(new Set<string>());
  const canvasStateRef = useRef(canvasState);
  canvasStateRef.current = canvasState;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const projectIdRef = useRef(iconProjectId);
  projectIdRef.current = iconProjectId;
  const initialMessagesRef = useRef(initialMessagesProp);
  initialMessagesRef.current = initialMessagesProp;

  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [conceptImage, setConceptImage] = useState<string | null>(null);
  const conceptUrlRef = useRef<string | null>(null);
  const interactionStartRef = useRef(0);

  const capturePreview = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const scale = stage.scaleX();
    const dataUrl = stage.toDataURL({ pixelRatio: 1 / scale });
    return dataUrl.replace(/^data:image\/\w+;base64,/, "");
  }, [stageRef]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/icon-edit",
        body: () => ({
          canvasState: canvasStateRef.current,
          canvasPreview: capturePreview(),
          projectDescription,
          projectId: projectIdRef.current,
        }),
      }),
    [projectDescription],
  );

  const shouldAutoSend = useCallback(
    ({ messages: msgs }: { messages: UIMessage[] }) => {
      if (!lastAssistantMessageIsCompleteWithToolCalls({ messages: msgs }))
        return false;
      // Pause after concept generation so user can confirm or regen
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === "assistant") {
        const toolParts = lastMsg.parts.filter((p) => isToolUIPart(p));
        if (
          toolParts.length > 0 &&
          toolParts.every((p) => getToolName(p) === "generateIconConcept")
        ) {
          return false;
        }
      }
      return true;
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

  // Handle viewCanvasPreview as a client-side tool
  useCanvasPreviewTool({
    messages,
    capturePreview,
    addToolOutput,
    projectId: iconProjectId,
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
  }, [iconProjectId]);

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
            if (toolName === "generateIconConcept" && output.url) {
              const url = output.url as string;
              conceptUrlRef.current = url;
              setConceptImage(url);
              // Stop the stream and strip base64 from messages to prevent context bloat
              stopRef.current();
              queueMicrotask(() => {
                setMessages((prev) => sanitizeForStorage(prev));
              });
            } else {
              dispatchToolResult(
                toolName,
                output,
                dispatch,
                canvasStateRef.current,
              );
            }
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
      const url = conceptUrlRef.current;
      if (url) {
        // User typed feedback while concept is showing — treat as guided regen
        setConceptImage(null);
        conceptUrlRef.current = null;
      }
      interactionStartRef.current = messages.length;
      setStatusLog([]);
      sendMessage({
        text: url
          ? `${prompt}. Here is the previous concept for reference — regenerate based on this feedback.`
          : prompt,
        files: url
          ? [{ type: "file" as const, mediaType: "image/png", url }]
          : undefined,
      });
    },
    [sendMessage, messages.length],
  );

  const stopEdit = useCallback(() => {
    stop();
  }, [stop]);

  const clearHistory = useCallback(() => {
    processedToolCalls.current.clear();
    conceptUrlRef.current = null;
    setConceptImage(null);
    setStatusLog([]);
    setMessages([]);
    interactionStartRef.current = 0;
    if (projectIdRef.current) {
      saveIconAiMessages(projectIdRef.current, []);
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
      if (projectIdRef.current && messages.length > 0) {
        const sanitized = sanitizeForStorage(messages);
        const trimmed = sanitized.slice(-20);
        saveIconAiMessages(projectIdRef.current, trimmed);
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, messages]);

  const statusText =
    isLoading && statusLog.length === 0 ? "Thinking..." : statusLog.join(" → ");

  const dismissConcept = useCallback(() => setConceptImage(null), []);

  const confirmConcept = useCallback(() => {
    const url = conceptUrlRef.current;
    setConceptImage(null);
    conceptUrlRef.current = null;
    interactionStartRef.current = messages.length;
    setStatusLog([]);
    sendMessage({
      text: "Concept approved. Now decompose this concept into layers: use setBackgroundColor for the background, then call addImageElement multiple times for each visual element.",
      files: url
        ? [
            {
              type: "file" as const,
              mediaType: "image/png",
              url,
            },
          ]
        : undefined,
    });
  }, [sendMessage, messages.length]);

  const regenConcept = useCallback(() => {
    const url = conceptUrlRef.current;
    setConceptImage(null);
    conceptUrlRef.current = null;
    interactionStartRef.current = messages.length;
    setStatusLog([]);
    sendMessage({
      text: "Regenerate the concept with a different style and approach. Try a completely different composition. Here is the previous concept for reference — make something noticeably different.",
      files: url
        ? [
            {
              type: "file" as const,
              mediaType: "image/png",
              url,
            },
          ]
        : undefined,
    });
  }, [sendMessage, messages.length]);

  return {
    sendEdit,
    stopEdit,
    clearHistory,
    isLoading,
    statusText: isLoading || statusLog.length > 0 ? statusText : "",
    hasHistory: messages.length > 0 && !isLoading,
    conceptImage,
    dismissConcept,
    confirmConcept,
    regenConcept,
  };
}

const TOOL_LABELS: Record<string, string> = {
  setBackgroundColor: "Background color",
  generateBackground: "Generating background",
  generateIconConcept: "Generating concept",
  updateElement: "Updating element",
  addTextElement: "Adding text",
  addAccentElement: "Adding shape",
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
