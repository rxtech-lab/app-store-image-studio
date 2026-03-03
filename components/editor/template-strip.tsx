"use client";

import { useState, useMemo, useCallback } from "react";
import {
  createTemplate,
  deleteTemplate,
  updateTemplateName,
} from "@/actions/templates";
import type { PresetKey } from "@/lib/settings";
import { resolvePresetDimensions } from "@/lib/canvas/defaults";
import type { CanvasState } from "@/lib/canvas/types";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Template {
  id: string;
  name: string;
  canvasState: CanvasState | null;
  thumbnailUrl: string | null;
  aiMessages: unknown[] | null;
}

interface TemplateStripProps {
  templates: Template[];
  activeTemplateId: string | null;
  sectionId: string;
  projectId: string;
  presetKey: PresetKey | "custom";
  customWidth?: number | null;
  customHeight?: number | null;
  onSelect: (template: Template) => void;
  onTemplatesChange: (templates: Template[]) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function TemplateStrip({
  templates,
  activeTemplateId,
  sectionId,
  projectId,
  presetKey,
  customWidth,
  customHeight,
  onSelect,
  onTemplatesChange,
  collapsed,
  onToggleCollapse,
}: TemplateStripProps) {
  const [creating, setCreating] = useState(false);

  const presetAspectRatio = useMemo(() => {
    const { width, height } = resolvePresetDimensions(
      presetKey,
      customWidth,
      customHeight,
    );
    return `${width} / ${height}`;
  }, [presetKey, customWidth, customHeight]);

  const getTemplateAspectRatio = useCallback(
    (t: Template) => {
      const w = t.canvasState?.width;
      const h = t.canvasState?.height;
      if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
        return `${w} / ${h}`;
      }
      return presetAspectRatio;
    },
    [presetAspectRatio],
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const t = await createTemplate(
        sectionId,
        presetKey,
        `Template ${templates.length + 1}`,
        customWidth,
        customHeight,
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

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 border-r bg-card flex flex-col items-center py-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={onToggleCollapse}>
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Show Templates</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="w-40 shrink-0 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Templates
        </h3>
        {onToggleCollapse && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onToggleCollapse}
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {templates.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -12 }}
                transition={{
                  layout: { type: "spring", stiffness: 500, damping: 35 },
                  opacity: { duration: 0.2 },
                  scale: { type: "spring", stiffness: 400, damping: 25 },
                  y: { type: "spring", stiffness: 400, damping: 25 },
                  delay: i * 0.03,
                }}
                className={cn(
                  "relative group cursor-pointer",
                  "rounded-xl p-1.5",
                )}
                onClick={() => onSelect(t)}
              >
                {/* Active indicator ring */}
                {activeTemplateId === t.id && (
                  <motion.div
                    layoutId="active-ring"
                    className="absolute inset-0 rounded-xl ring-2 ring-primary/40 bg-primary/8"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                {/* Thumbnail */}
                <motion.div
                  className="relative w-full rounded-lg overflow-hidden mb-1.5 bg-muted"
                  style={{ aspectRatio: getTemplateAspectRatio(t) }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {t.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.thumbnailUrl}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/60">
                      Preview
                    </div>
                  )}
                </motion.div>

                {/* Name */}
                <Input
                  value={t.name}
                  onChange={(e) => handleRename(t.id, e.target.value)}
                  className="relative h-5 text-[10px] font-medium px-1 border-0 bg-transparent text-center truncate"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Delete */}
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${t.name}"?`)) {
                      handleDelete(t.id);
                    }
                  }}
                >
                  <Trash2 className="h-2.5 w-2.5 text-white" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add button */}
          <motion.button
            layout
            whileHover={{ scale: 1.04, borderColor: "rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "w-full rounded-xl border-2 border-dashed border-muted-foreground/20",
              "flex items-center justify-center cursor-pointer",
              "hover:bg-accent/40",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
            style={{ aspectRatio: presetAspectRatio, padding: "0.375rem" }}
            onClick={handleCreate}
            disabled={creating}
          >
            <motion.div
              animate={creating ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Plus className="h-5 w-5 text-muted-foreground/50" />
            </motion.div>
          </motion.button>
        </LayoutGroup>
      </div>
    </div>
  );
}
