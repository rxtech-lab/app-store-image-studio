"use client";

import { useState } from "react";
import type Konva from "konva";
import type { CanvasState } from "@/lib/canvas/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hideTransformers } from "@/lib/canvas/export-utils";
import { Download, Loader2, ChevronDown } from "lucide-react";

type ImageFormat = "png" | "webp" | "jpeg";

interface ImageExportPanelProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  canvasState: CanvasState;
  projectName: string;
}

export function ImageExportPanel({
  stageRef,
  canvasState,
  projectName,
}: ImageExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [quality, setQuality] = useState(90);

  const handleExport = async (format: ImageFormat) => {
    const stage = stageRef.current;
    if (!stage) return;

    setExporting(true);
    try {
      const restoreTransformers = hideTransformers(stage);
      const scale = stage.scaleX();
      const pixelRatio = 1 / scale;

      const ext = format === "jpeg" ? "jpg" : format;
      const mimeType = format === "jpeg" ? "image/jpeg" : `image/${format}`;

      if (format === "png") {
        // PNG: use Konva directly
        const dataUrl = stage.toDataURL({ pixelRatio, mimeType });
        restoreTransformers();
        triggerDownload(dataUrl, `${projectName}.${ext}`);
      } else {
        // WebP/JPEG: draw onto a canvas to apply quality
        const dataUrl = stage.toDataURL({ pixelRatio });
        restoreTransformers();
        const img = new window.Image();
        img.src = dataUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });

        const canvas = document.createElement("canvas");
        canvas.width = canvasState.width;
        canvas.height = canvasState.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, mimeType, quality / 100),
        );
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${projectName}.${ext}`);
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="items-center gap-2 hidden sm:flex">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Quality
        </Label>
        <Slider
          value={[quality]}
          onValueChange={([v]: number[]) => setQuality(v)}
          min={10}
          max={100}
          step={5}
          className="w-20"
        />
        <span className="text-xs text-muted-foreground tabular-nums w-7">
          {quality}
        </span>
      </div>

      <span className="text-xs text-muted-foreground hidden sm:inline">
        {canvasState.width}×{canvasState.height}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1" />
            )}
            <span className="text-xs">
              {exporting ? "Exporting..." : "Download"}
            </span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("png")}>
            PNG (lossless)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("webp")}>
            WebP (quality: {quality}%)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("jpeg")}>
            JPEG (quality: {quality}%)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
}
