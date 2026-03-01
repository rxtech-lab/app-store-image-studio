"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type Konva from "konva";
import type { PresetKey } from "@/lib/settings";
import type { CanvasState } from "@/lib/canvas/types";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { getDefaultCanvasState } from "@/lib/canvas/defaults";
import { uploadBackgroundImage } from "@/actions/templates";
import { useCanvasState } from "@/hooks/use-canvas-state";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useAiEdit } from "@/hooks/use-ai-edit";
import { createTemplate } from "@/actions/templates";
import { CanvasToolbar } from "@/components/editor/canvas-toolbar";
import { ElementProperties } from "@/components/editor/element-properties";
import { TemplateStrip } from "@/components/editor/template-strip";
import { AiPromptBar } from "@/components/editor/ai-prompt-bar";
import { LayersPanel } from "@/components/editor/layers-panel";
import { ExportButtons } from "@/components/editor/export-buttons";
import { Button } from "@/components/ui/button";
import { ScreenshotsDialog } from "@/components/editor/screenshots-dialog";
import { ArrowLeft, Loader2, LayoutTemplate, Plus } from "lucide-react";
import { SidebarToggle } from "@/components/app-layout";

const CanvasEditor = dynamic(
  () =>
    import("@/components/editor/canvas-editor").then((mod) => mod.CanvasEditor),
  { ssr: false },
);

interface Template {
  id: string;
  name: string;
  canvasState: CanvasState | null;
  thumbnailUrl: string | null;
  aiMessages: unknown[] | null;
}

interface Screenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

interface SectionEditorClientProps {
  projectId: string;
  projectName: string;
  projectDescription?: string;
  sectionId: string;
  presetKey: PresetKey | "custom";
  customWidth?: number | null;
  customHeight?: number | null;
  initialTemplates: Template[];
  screenshots: Screenshot[];
}

export function SectionEditorClient({
  projectId,
  projectName,
  projectDescription,
  sectionId,
  presetKey,
  customWidth,
  customHeight,
  initialTemplates,
  screenshots,
}: SectionEditorClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(
    templates[0] ?? null,
  );
  const stageRef = useRef<Konva.Stage | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showLayers, setShowLayers] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [isAddingImage, setIsAddingImage] = useState(false);

  const defaultState = getDefaultCanvasState(
    presetKey,
    customWidth,
    customHeight,
  );
  const { state, dispatch, undo, addText, addAccent, addScreenshot } =
    useCanvasState(activeTemplate?.canvasState ?? defaultState);

  const handleThumbnailSaved = (templateId: string, url: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, thumbnailUrl: url } : t)),
    );
  };

  const handleStateSaved = (templateId: string, savedState: CanvasState) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, canvasState: savedState } : t,
      ),
    );
  };

  const { isSaving, isSaved, saveNow } = useAutoSave(
    activeTemplate?.id ?? "",
    state,
    stageRef,
    handleThumbnailSaved,
    handleStateSaved,
  );

  const handleSelect = useCallback(
    (id: string | null) => setSelectedIds(id ? [id] : []),
    [],
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
      } else if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(state.elements.map((el) => el.id));
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
  } = useAiEdit({
    templateId: activeTemplate?.id ?? "",
    initialMessages: (activeTemplate?.aiMessages ?? []) as UIMessage[],
    canvasState: state,
    dispatch,
    stageRef,
    screenshots,
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

        const img = new window.Image();
        img.src = url;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });

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
    selectedIds.length === 1
      ? (state.elements.find((el) => el.id === selectedIds[0]) ?? null)
      : null;

  const handleTemplateSelect = (template: Template) => {
    setActiveTemplate(template);
    const canvasState =
      template.canvasState ??
      getDefaultCanvasState(presetKey, customWidth, customHeight);
    dispatch({ type: "SET_STATE", payload: canvasState });
    setSelectedIds([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Site header */}
      <header className="flex items-center gap-3 border-b px-4 h-12 shrink-0">
        <SidebarToggle />
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" asChild>
          <Link href={`/appstore-marketing-image/project/${projectId}`}>
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

      {!activeTemplate && !templates.length ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
          <LayoutTemplate className="h-10 w-10 text-muted-foreground/40" />
          <p>Create a template to start editing</p>
          <Button
            onClick={async () => {
              const t = await createTemplate(
                sectionId,
                presetKey,
                "Template 1",
                customWidth,
                customHeight,
              );
              const newTemplate = t as unknown as Template;
              setTemplates([newTemplate]);
              setActiveTemplate(newTemplate);
              dispatch({
                type: "SET_STATE",
                payload:
                  newTemplate.canvasState ??
                  getDefaultCanvasState(presetKey, customWidth, customHeight),
              });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <>
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
              showTemplates={showTemplates}
              onToggleTemplates={() => setShowTemplates((v) => !v)}
              onAddImage={handleAddImage}
              isAddingImage={isAddingImage}
            />
            <div className="w-px h-5 bg-border" />
            {/* Screenshots dialog */}
            {screenshots.length > 0 && (
              <>
                <ScreenshotsDialog
                  screenshots={screenshots}
                  onAdd={addScreenshot}
                />
                <div className="w-px h-5 bg-border" />
              </>
            )}
            <div className="flex-1" />
            <ExportButtons
              stageRef={stageRef}
              canvasWidth={state.width}
              canvasHeight={state.height}
              projectName={projectName}
            />
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Template sidebar */}
            <TemplateStrip
              templates={templates}
              activeTemplateId={activeTemplate?.id ?? null}
              sectionId={sectionId}
              projectId={projectId}
              presetKey={presetKey}
              customWidth={customWidth}
              customHeight={customHeight}
              onSelect={handleTemplateSelect}
              onTemplatesChange={setTemplates}
              collapsed={!showTemplates}
              onToggleCollapse={() => setShowTemplates((v) => !v)}
            />
            {/* Layers panel */}
            {showLayers && (
              <LayersPanel
                elements={state.elements}
                selectedIds={selectedIds}
                onSelect={handleSelect}
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
                selectedIds={selectedIds}
                onSelect={handleSelect}
                stageRef={stageRef}
                screenshots={screenshots}
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
                  aiText={aiText}
                  hasHistory={hasHistory}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
