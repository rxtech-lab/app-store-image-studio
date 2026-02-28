"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type Konva from "konva";
import type { PresetKey } from "@/lib/settings";
import type { CanvasState } from "@/lib/canvas/types";
import { getDefaultCanvasState } from "@/lib/canvas/defaults";
import { useCanvasState } from "@/hooks/use-canvas-state";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useAiEdit } from "@/hooks/use-ai-edit";
import { CanvasToolbar } from "@/components/editor/canvas-toolbar";
import { ElementProperties } from "@/components/editor/element-properties";
import { TemplateStrip } from "@/components/editor/template-strip";
import { AiPromptBar } from "@/components/editor/ai-prompt-bar";
import { LayersPanel } from "@/components/editor/layers-panel";
import { ExportButtons } from "@/components/editor/export-buttons";
import { Button } from "@/components/ui/button";
import { IMAGE_PRESETS } from "@/lib/settings";
import { ScreenshotsDialog } from "@/components/editor/screenshots-dialog";
import { ArrowLeft, Loader2 } from "lucide-react";

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
  presetKey: PresetKey;
  initialTemplates: Template[];
  screenshots: Screenshot[];
}

export function SectionEditorClient({
  projectId,
  projectName,
  projectDescription,
  sectionId,
  presetKey,
  initialTemplates,
  screenshots,
}: SectionEditorClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(
    templates[0] ?? null,
  );
  const stageRef = useRef<Konva.Stage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(true);

  const defaultState = getDefaultCanvasState(presetKey);
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
    isLoading: aiLoading,
    statusText,
  } = useAiEdit({
    canvasState: state,
    dispatch,
    stageRef,
    screenshots,
    projectDescription,
    onComplete: saveNow,
  });

  const selectedElement =
    state.elements.find((el) => el.id === selectedId) ?? null;
  const preset = IMAGE_PRESETS[presetKey];

  const handleTemplateSelect = (template: Template) => {
    setActiveTemplate(template);
    const canvasState =
      template.canvasState ?? getDefaultCanvasState(presetKey);
    dispatch({ type: "SET_STATE", payload: canvasState });
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Site header */}
      <header className="flex items-center gap-3 border-b px-4 h-12 shrink-0">
        <Button variant="ghost" size="icon-xs" asChild>
          <Link href={`/project/${projectId}`}>
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

      {/* Template strip */}
      <TemplateStrip
        templates={templates}
        activeTemplateId={activeTemplate?.id ?? null}
        sectionId={sectionId}
        projectId={projectId}
        presetKey={presetKey}
        onSelect={handleTemplateSelect}
        onTemplatesChange={setTemplates}
      />

      {!activeTemplate ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Create a template to start editing</p>
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
                  isLoading={aiLoading}
                  statusText={statusText}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
