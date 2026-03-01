"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type Konva from "konva";
import type { CanvasState } from "@/lib/canvas/types";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { getDefaultIconCanvasState } from "@/lib/canvas/defaults";
import { uploadBackgroundImage } from "@/actions/templates";
import { useCanvasState } from "@/hooks/use-canvas-state";
import { useIconAutoSave } from "@/hooks/use-icon-auto-save";
import { useAiIconEdit } from "@/hooks/use-ai-icon-edit";
import { CanvasToolbar } from "@/components/editor/canvas-toolbar";
import { ElementProperties } from "@/components/editor/element-properties";
import { AiPromptBar } from "@/components/editor/ai-prompt-bar";
import { LayersPanel } from "@/components/editor/layers-panel";
import { IconExportPanel } from "@/components/icon/icon-export-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SidebarToggle } from "@/components/app-layout";

const CanvasEditor = dynamic(
  () =>
    import("@/components/editor/canvas-editor").then((mod) => mod.CanvasEditor),
  { ssr: false },
);

interface IconEditorClientProps {
  iconProjectId: string;
  projectName: string;
  projectDescription?: string;
  size: number;
  initialCanvasState?: CanvasState;
  initialAiMessages: unknown[];
}

export function IconEditorClient({
  iconProjectId,
  projectName,
  projectDescription,
  size,
  initialCanvasState,
  initialAiMessages,
}: IconEditorClientProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(true);
  const [isAddingImage, setIsAddingImage] = useState(false);

  const defaultState = getDefaultIconCanvasState(size);
  const { state, dispatch, undo, addText, addAccent } = useCanvasState(
    initialCanvasState ?? defaultState,
  );

  const { isSaving, isSaved, saveNow } = useIconAutoSave(
    iconProjectId,
    state,
    stageRef,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isEditing) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveNow();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedId) {
          e.preventDefault();
          dispatch({ type: "REMOVE_ELEMENT", payload: selectedId });
          setSelectedId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, undo, dispatch, saveNow]);

  const {
    sendEdit,
    stopEdit,
    clearHistory,
    isLoading: aiLoading,
    statusText,
    hasHistory,
  } = useAiIconEdit({
    iconProjectId,
    initialMessages: initialAiMessages as UIMessage[],
    canvasState: state,
    dispatch,
    stageRef,
    projectDescription,
    onComplete: saveNow,
  });

  const handleAddImage = useCallback(
    async (file: File) => {
      setIsAddingImage(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const url = await uploadBackgroundImage(formData);

        // Load image to get natural dimensions
        const img = new window.Image();
        img.src = url;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });

        // Scale to fit within canvas with padding
        const maxW = state.width * 0.6;
        const maxH = state.height * 0.6;
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;

        dispatch({
          type: "ADD_ELEMENT",
          payload: {
            id: nanoid(),
            type: "image",
            imageUrl: url,
            x: (state.width - w) / 2,
            y: (state.height - h) / 2,
            width: w,
            height: h,
            rotation: 0,
            opacity: 1,
            cornerRadius: 0,
          },
        });
      } finally {
        setIsAddingImage(false);
      }
    },
    [state.width, state.height, dispatch],
  );

  const selectedElement =
    state.elements.find((el) => el.id === selectedId) ?? null;

  return (
    <div className="flex flex-col h-full">
      {/* Site header */}
      <header className="flex items-center gap-3 border-b px-4 h-12 shrink-0">
        <SidebarToggle />
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" asChild>
          <Link href="/icon-generation">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm font-medium truncate">{projectName}</span>
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        ) : isSaved ? (
          <span className="text-xs text-muted-foreground ml-2">Saved</span>
        ) : null}
      </header>

      {/* Toolbar: canvas tools + export */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b bg-card">
        <CanvasToolbar
          backgroundColor={state.backgroundColor}
          onBackgroundColorChange={(c) =>
            dispatch({ type: "SET_BACKGROUND_COLOR", payload: c })
          }
          backgroundImageUrl={state.backgroundImageUrl}
          onRemoveBackgroundImage={() =>
            dispatch({ type: "SET_BACKGROUND_IMAGE", payload: "" })
          }
          onSetBackgroundImage={(url) =>
            dispatch({ type: "SET_BACKGROUND_IMAGE", payload: url })
          }
          onAddText={addText}
          onAddAccent={addAccent}
          showLayers={showLayers}
          onToggleLayers={() => setShowLayers((v) => !v)}
          supportTransparent
          onAddImage={handleAddImage}
          isAddingImage={isAddingImage}
        />
        <div className="flex-1" />
        <IconExportPanel
          stageRef={stageRef}
          canvasState={state}
          projectName={projectName}
        />
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layers panel */}
        {showLayers && (
          <LayersPanel
            elements={state.elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            dispatch={dispatch}
            backgroundImageUrl={state.backgroundImageUrl}
            onRemoveBackgroundImage={() =>
              dispatch({ type: "SET_BACKGROUND_IMAGE", payload: "" })
            }
          />
        )}
        {/* Canvas viewport */}
        <div className="flex-1 flex items-center justify-center relative overflow-auto bg-muted/30 p-4">
          <CanvasEditor
            state={state}
            dispatch={dispatch}
            selectedId={selectedId}
            onSelect={setSelectedId}
            stageRef={stageRef}
          />
          {/* Floating element properties */}
          {selectedElement && (
            <div className="absolute right-4 top-4 w-60 z-10">
              <ElementProperties
                element={selectedElement}
                dispatch={dispatch}
              />
            </div>
          )}
          {/* AI Edit button/prompt at bottom center */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <AiPromptBar
              onSend={sendEdit}
              onStop={stopEdit}
              onClearHistory={clearHistory}
              isLoading={aiLoading}
              statusText={statusText}
              hasHistory={hasHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
