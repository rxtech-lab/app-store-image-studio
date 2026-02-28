"use client";

import { useState } from "react";
import {
  createTemplate,
  deleteTemplate,
  updateTemplateName,
} from "@/actions/templates";
import type { PresetKey } from "@/lib/settings";
import type { CanvasState } from "@/lib/canvas/types";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";

interface Template {
  id: string;
  name: string;
  canvasState: CanvasState | null;
  thumbnailUrl: string | null;
}

interface TemplateStripProps {
  templates: Template[];
  activeTemplateId: string | null;
  sectionId: string;
  projectId: string;
  presetKey: PresetKey;
  onSelect: (template: Template) => void;
  onTemplatesChange: (templates: Template[]) => void;
}

export function TemplateStrip({
  templates,
  activeTemplateId,
  sectionId,
  projectId,
  presetKey,
  onSelect,
  onTemplatesChange,
}: TemplateStripProps) {
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
    <div className="flex items-end gap-3 px-4 py-3 border-b bg-card overflow-x-auto">
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
                "relative group shrink-0 w-28 cursor-pointer",
                "rounded-xl p-1.5",
              )}
              onClick={() => onSelect(t)}
            >
              {/* Active indicator ring — animated separately */}
              {activeTemplateId === t.id && (
                <motion.div
                  layoutId="active-ring"
                  className="absolute inset-0 rounded-xl ring-2 ring-primary/40 bg-primary/8"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              {/* Thumbnail */}
              <motion.div
                className="relative aspect-9/16 w-full rounded-lg overflow-hidden mb-1.5 bg-muted"
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
            "shrink-0 w-28 rounded-xl border-2 border-dashed border-muted-foreground/20",
            "flex items-center justify-center cursor-pointer",
            "hover:bg-accent/40",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
          style={{ aspectRatio: "9/16", padding: "0.375rem" }}
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
  );
}
