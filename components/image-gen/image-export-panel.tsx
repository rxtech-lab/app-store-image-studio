"use client";

import { useState } from "react";
import type Konva from "konva";
import type { CanvasState } from "@/lib/canvas/types";
import { exportImage, type ImageFormat } from "@/actions/image-export";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2, ChevronDown } from "lucide-react";

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

  const getStageBase64 = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const scale = stage.scaleX();
    const pixelRatio = 1 / scale;
    const dataUrl = stage.toDataURL({ pixelRatio });
    return dataUrl.split(",")[1];
  };

  const handleExport = async (format: ImageFormat) => {
    const base64 = getStageBase64();
    if (!base64) return;

    setExporting(true);
    try {
      const data = await exportImage(
        base64,
        canvasState.width,
        canvasState.height,
        format,
        quality,
      );

      const ext = format === "jpeg" ? "jpg" : format;
      const mimeType = format === "jpeg" ? "image/jpeg" : `image/${format}`;
      const blob = new Blob([new Uint8Array(data)], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${projectName}.${ext}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Quality control */}
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
