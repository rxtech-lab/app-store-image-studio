"use client";

import { useState } from "react";
import {
  createTemplate,
  deleteTemplate,
  updateTemplateName,
} from "@/actions/templates";
import type { PresetKey } from "@/lib/settings";
import type { CanvasState } from "@/lib/canvas/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  canvasState: CanvasState | null;
  thumbnailUrl: string | null;
  aiMessages: unknown[] | null;
}

interface TemplateGalleryProps {
  templates: Template[];
  activeTemplateId: string | null;
  sectionId: string;
  projectId: string;
  presetKey: PresetKey;
  onSelect: (template: Template) => void;
  onTemplatesChange: (templates: Template[]) => void;
}

export function TemplateGallery({
  templates,
  activeTemplateId,
  sectionId,
  projectId,
  presetKey,
  onSelect,
  onTemplatesChange,
}: TemplateGalleryProps) {
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const t = await createTemplate(
        sectionId,
        presetKey,
        `Template ${templates.length + 1}`,
      );
      const newTemplates = [...templates, t as unknown as Template];
      onTemplatesChange(newTemplates);
      onSelect(t as unknown as Template);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    await deleteTemplate(templateId, sectionId, projectId);
    const newTemplates = templates.filter((t) => t.id !== templateId);
    onTemplatesChange(newTemplates);
    if (activeTemplateId === templateId && newTemplates.length > 0) {
      onSelect(newTemplates[0]);
    }
  };

  const handleRename = async (templateId: string, name: string) => {
    await updateTemplateName(templateId, name);
    onTemplatesChange(
      templates.map((t) => (t.id === templateId ? { ...t, name } : t)),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Templates</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreate}
          disabled={creating}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className={cn(
              "relative group flex-shrink-0 w-32 border rounded-md p-2 cursor-pointer hover:border-primary",
              activeTemplateId === t.id && "border-primary ring-1 ring-primary",
            )}
            onClick={() => onSelect(t)}
          >
            {t.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.thumbnailUrl}
                alt={t.name}
                className="w-full h-20 object-cover rounded mb-1"
              />
            ) : (
              <div className="w-full h-20 bg-muted rounded mb-1 flex items-center justify-center text-xs text-muted-foreground">
                Preview
              </div>
            )}
            <Input
              value={t.name}
              onChange={(e) => handleRename(t.id, e.target.value)}
              className="h-6 text-xs px-1 border-0 bg-transparent"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(t.id);
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
