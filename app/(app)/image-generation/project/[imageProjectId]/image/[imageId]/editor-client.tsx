"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import type { CanvasState } from "@/lib/canvas/types";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { getDefaultImageCanvasState } from "@/lib/canvas/defaults";
import { uploadBackgroundImage } from "@/actions/templates";
import { useCanvasState } from "@/hooks/use-canvas-state";
import { useImageAutoSave } from "@/hooks/use-image-auto-save";
import { useAiImageEdit } from "@/hooks/use-ai-image-edit";
import { CanvasToolbar } from "@/components/editor/canvas-toolbar";
import { AiPromptBar } from "@/components/editor/ai-prompt-bar";
import { SvgEditorDialog } from "@/components/editor/svg-editor-dialog";
import { ImageExportPanel } from "@/components/image-gen/image-export-panel";
import { CanvasSizeControl } from "@/components/image-gen/canvas-size-control";
import { EditorLayout } from "@/components/editor/editor-layout";
import type { SvgElement } from "@/lib/canvas/types";

const CanvasEditor = dynamic(
  () =>
    import("@/components/editor/canvas-editor").then((mod) => mod.CanvasEditor),
  { ssr: false },
);

interface ImageEditorClientProps {
  imageId: string;
  imageProjectId: string;
  projectName: string;
  initialCanvasState?: CanvasState;
  initialAiMessages: unknown[];
  width: number;
  height: number;
}

export function ImageEditorClient({
  imageId,
  imageProjectId,
  projectName,
  initialCanvasState,
  initialAiMessages,
  width,
  height,
}: ImageEditorClientProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showLayers, setShowLayers] = useState(true);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [svgEditId, setSvgEditId] = useState<string | null>(null);

  const defaultState = getDefaultImageCanvasState(width, height);
  const { state, dispatch, undo, addText, addAccent } = useCanvasState(
    initialCanvasState ?? defaultState,
  );

  const { isSaving, isSaved, saveNow } = useImageAutoSave(
    imageId,
    state,
    stageRef,
  );

  const handleSelect = useCallback(
    (id: string | null) => setSelectedIds(id ? [id] : []),
    [],
  );

  const handleMultiSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

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
      } else if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(state.elements.map((el) => el.id));
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "g") {
        e.preventDefault();
        if (
          selectedIds.length === 1 &&
          state.elements.find((el) => el.id === selectedIds[0])?.type === "group"
        ) {
          dispatch({ type: "UNGROUP_ELEMENT", payload: selectedIds[0] });
          setSelectedIds([]);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        if (selectedIds.length >= 2) {
          dispatch({ type: "GROUP_ELEMENTS", payload: selectedIds });
          setSelectedIds([]);
        }
      } else if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          for (const id of selectedIds) {
            dispatch({ type: "REMOVE_ELEMENT", payload: id });
          }
          setSelectedIds([]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, undo, dispatch, saveNow, state.elements]);

  const {
    sendEdit,
    stopEdit,
    clearHistory,
    isLoading: aiLoading,
    statusText,
    aiText,
    hasHistory,
  } = useAiImageEdit({
    imageId,
    initialMessages: initialAiMessages as UIMessage[],
    canvasState: state,
    dispatch,
    stageRef,
    onComplete: saveNow,
  });

  const handleAddImage = useCallback(
    async (file: File) => {
      setIsAddingImage(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const url = await uploadBackgroundImage(formData);

        const img = new window.Image();
        img.src = url;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });

        const maxW = state.width * 0.6;
        const maxH = state.height * 0.6;
        const scale = Math.min(
          maxW / img.naturalWidth,
          maxH / img.naturalHeight,
          1,
        );
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

  const handleCanvasSizeChange = useCallback(
    (newWidth: number, newHeight: number) => {
      const scaleX = newWidth / state.width;
      const scaleY = newHeight / state.height;
      dispatch({
        type: "SET_STATE",
        payload: {
          ...state,
          width: newWidth,
          height: newHeight,
          elements: state.elements.map((el) => ({
            ...el,
            x: el.x * scaleX,
            y: el.y * scaleY,
            width: el.width * scaleX,
            height: el.height * scaleY,
          })),
        },
      });
    },
    [state, dispatch],
  );

  const selectedElement =
    selectedIds.length === 1
      ? (state.elements.find((el) => el.id === selectedIds[0]) ?? null)
      : null;

  return (
    <EditorLayout
      backHref={`/image-generation/project/${imageProjectId}`}
      title={projectName}
      isSaving={isSaving}
      isSaved={isSaved}
      menus={[
        {
          label: "File",
          items: [{ label: "Save", shortcut: "⌘S", onClick: saveNow }],
        },
      ]}
      toolbarLeft={
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
          onAddImage={handleAddImage}
          isAddingImage={isAddingImage}
        />
      }
      toolbarRight={
        <>
          <CanvasSizeControl
            width={state.width}
            height={state.height}
            onChange={handleCanvasSizeChange}
          />
          <ImageExportPanel
            stageRef={stageRef}
            canvasState={state}
            projectName={projectName}
          />
        </>
      }
      showLayers={showLayers}
      layersProps={{
        elements: state.elements,
        selectedIds,
        onSelect: handleSelect,
        onMultiSelect: handleMultiSelect,
        dispatch,
        onSvgEdit: setSvgEditId,
        backgroundImageUrl: state.backgroundImageUrl,
        onRemoveBackgroundImage: () =>
          dispatch({ type: "SET_BACKGROUND_IMAGE", payload: "" }),
      }}
      selectedElement={selectedElement}
      dispatch={dispatch}
      onSvgEdit={setSvgEditId}
    >
      <CanvasEditor
        state={state}
        dispatch={dispatch}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        stageRef={stageRef}
        onSvgEdit={setSvgEditId}
      />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <AiPromptBar
          onSend={sendEdit}
          onStop={stopEdit}
          onClearHistory={clearHistory}
          isLoading={aiLoading}
          statusText={statusText}
          aiText={aiText}
          hasHistory={hasHistory}
        />
      </div>
      {svgEditId && (() => {
        const svgEl = state.elements.find((el) => el.id === svgEditId && el.type === "svg") as SvgElement | undefined;
        if (!svgEl) return null;
        return (
          <SvgEditorDialog
            open
            onOpenChange={(open) => { if (!open) setSvgEditId(null); }}
            svgContent={svgEl.svgContent}
            onSave={(svgContent) => {
              dispatch({ type: "UPDATE_ELEMENT", payload: { id: svgEditId, svgContent } });
              setSvgEditId(null);
            }}
          />
        );
      })()}
    </EditorLayout>
  );
}
