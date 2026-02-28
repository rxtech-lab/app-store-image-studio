"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
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
import { ExportButtons } from "@/components/editor/export-buttons";
import { IMAGE_PRESETS } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

const CanvasEditor = dynamic(
  () =>
    import("@/components/editor/canvas-editor").then((mod) => mod.CanvasEditor),
  { ssr: false }
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
  sectionId: string;
  presetKey: PresetKey;
  initialTemplates: Template[];
  screenshots: Screenshot[];
}

export function SectionEditorClient({
  projectId,
  projectName,
  sectionId,
  presetKey,
  initialTemplates,
  screenshots,
}: SectionEditorClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(
    templates[0] ?? null
  );
  const stageRef = useRef<Konva.Stage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const defaultState = getDefaultCanvasState(presetKey);
  const { state, dispatch, addText, addAccent, addScreenshot } =
    useCanvasState(activeTemplate?.canvasState ?? defaultState);

  const {
    sendEdit,
    isLoading: aiLoading,
    statusText,
  } = useAiEdit({ canvasState: state, dispatch });

  useAutoSave(activeTemplate?.id ?? "", state);

  const selectedElement =
    state.elements.find((el) => el.id === selectedId) ?? null;
  const preset = IMAGE_PRESETS[presetKey];

  const handleTemplateSelect = (template: Template) => {
    setActiveTemplate(template);
    const canvasState = template.canvasState ?? getDefaultCanvasState(presetKey);
    dispatch({ type: "SET_STATE", payload: canvasState });
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
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
              onAddText={addText}
              onAddAccent={addAccent}
            />
            <div className="w-px h-5 bg-border" />
            {/* Screenshot buttons inline */}
            {screenshots.length > 0 && (
              <>
                {screenshots.map((s) => (
                  <Button
                    key={s.id}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={() => {
                      const img = new window.Image();
                      img.src = s.imageUrl;
                      img.onload = () =>
                        addScreenshot(
                          s.imageUrl,
                          img.naturalWidth,
                          img.naturalHeight
                        );
                    }}
                  >
                    <ImageIcon className="mr-1 h-3 w-3" />
                    {s.originalFilename}
                  </Button>
                ))}
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
                isLoading={aiLoading}
                statusText={statusText}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
