"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createImageProject } from "@/actions/image-projects";
import { IMAGE_GEN_PRESETS, type ImageGenPresetKey } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";

export function CreateImageProjectDialog() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<ImageGenPresetKey | "custom">(
    "square-1024",
  );
  const [customWidth, setCustomWidth] = useState(1024);
  const [customHeight, setCustomHeight] = useState(1024);
  const router = useRouter();

  const dimensions =
    preset === "custom"
      ? { width: customWidth, height: customHeight }
      : IMAGE_GEN_PRESETS[preset];

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Image Project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Image Project</AlertDialogTitle>
        </AlertDialogHeader>
        <form
          action={async (formData) => {
            formData.set("width", String(dimensions.width));
            formData.set("height", String(dimensions.height));
            const project = await createImageProject(formData);
            setOpen(false);
            router.push(`/image-generation/project/${project.id}`);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="img-name">Project Name</Label>
            <Input
              id="img-name"
              name="name"
              required
              placeholder="My Image Project"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="img-description">Description (optional)</Label>
            <Textarea
              id="img-description"
              name="description"
              placeholder="Describe what images you want to generate..."
            />
          </div>
          <div className="space-y-2">
            <Label>Canvas Size</Label>
            <Select
              value={preset}
              onValueChange={(v) =>
                setPreset(v as ImageGenPresetKey | "custom")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(IMAGE_GEN_PRESETS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.title} ({val.width}×{val.height})
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {preset === "custom" && (
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={customWidth}
                    onChange={(e) =>
                      setCustomWidth(Number(e.target.value) || 1)
                    }
                    min={1}
                    max={4096}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={customHeight}
                    onChange={(e) =>
                      setCustomHeight(Number(e.target.value) || 1)
                    }
                    min={1}
                    max={4096}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {dimensions.width}×{dimensions.height}px
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit">Create</AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
