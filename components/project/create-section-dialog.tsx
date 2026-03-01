"use client";

import { useState } from "react";
import { createSection } from "@/actions/sections";
import { IMAGE_PRESETS, type PresetKey } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Smartphone,
  Tablet,
  Monitor,
  Check,
  Settings2,
} from "lucide-react";

interface CreateSectionDialogProps {
  projectId: string;
}

function getDeviceIcon(presetKey: string, className: string) {
  if (presetKey.startsWith("iphone"))
    return <Smartphone className={className} />;
  if (presetKey.startsWith("ipad")) return <Tablet className={className} />;
  if (presetKey === "custom") return <Settings2 className={className} />;
  return <Monitor className={className} />;
}

export function CreateSectionDialog({ projectId }: CreateSectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PresetKey | "custom">("iphone-6.7");
  const [customWidth, setCustomWidth] = useState(1290);
  const [customHeight, setCustomHeight] = useState(2796);
  const [creating, setCreating] = useState(false);

  const isCustom = preset === "custom";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Template</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a device preset or enter custom dimensions.
          </p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2.5 py-4">
          {Object.entries(IMAGE_PRESETS).map(([key, p]) => {
            const isSelected = preset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key as PresetKey)}
                className={`relative flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/60 hover:border-border hover:bg-muted/30"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md shrink-0 ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {getDeviceIcon(key, "h-4.5 w-4.5")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.width} × {p.height}
                  </p>
                </div>
                {isSelected && (
                  <Check className="absolute top-3 right-3 h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
          {/* Custom size option */}
          <button
            type="button"
            onClick={() => setPreset("custom")}
            className={`relative flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all cursor-pointer col-span-2 ${
              isCustom
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border/60 hover:border-border hover:bg-muted/30"
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-md shrink-0 ${
                isCustom
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/60 text-muted-foreground"
              }`}
            >
              <Settings2 className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Custom Size</p>
              <p className="text-xs text-muted-foreground">
                Enter your own dimensions
              </p>
            </div>
            {isCustom && (
              <Check className="absolute top-3 right-3 h-4 w-4 text-primary" />
            )}
          </button>
        </div>

        {isCustom && (
          <div className="flex items-center gap-3 pb-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Width (px)
              </label>
              <Input
                type="number"
                min={100}
                max={10000}
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
              />
            </div>
            <span className="text-muted-foreground/40 mt-5">×</span>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Height (px)
              </label>
              <Input
                type="number"
                min={100}
                max={10000}
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setCreating(true);
              if (isCustom) {
                await createSection(
                  projectId,
                  "custom",
                  customWidth,
                  customHeight,
                );
              } else {
                await createSection(projectId, preset);
              }
              setCreating(false);
              setOpen(false);
            }}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
