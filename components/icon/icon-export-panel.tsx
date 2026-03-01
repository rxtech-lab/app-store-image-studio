"use client";

import { useState } from "react";
import type Konva from "konva";
import type { CanvasState } from "@/lib/canvas/types";
import { exportIconAllPlatforms, exportIconLayers } from "@/actions/icon-export";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2, Layers, ChevronDown } from "lucide-react";

interface IconExportPanelProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  canvasState: CanvasState;
  projectName: string;
}

export function IconExportPanel({
  stageRef,
  canvasState,
  projectName,
}: IconExportPanelProps) {
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingLayers, setExportingLayers] = useState(false);

  const isExporting = exportingAll || exportingLayers;

  const handleExportAllPlatforms = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    setExportingAll(true);
    try {
      const scale = stage.scaleX();
      const pixelRatio = 1 / scale;
      const dataUrl = stage.toDataURL({ pixelRatio });
      const base64 = dataUrl.split(",")[1];

      const zipData = await exportIconAllPlatforms(base64);

      const blob = new Blob([zipData], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${projectName}-icons.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingAll(false);
    }
  };

  const handleExportLayers = async () => {
    const layers = canvasState.elements
      .filter((el) => el.type === "image" || el.type === "screenshot")
      .map((el, i) => ({
        name: ("name" in el && el.name) || `layer_${i + 1}`,
        imageUrl: (el as { imageUrl: string }).imageUrl,
      }));

    if (layers.length === 0) return;

    setExportingLayers(true);
    try {
      const zipData = await exportIconLayers(layers);

      const blob = new Blob([zipData], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${projectName}-layers.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingLayers(false);
    }
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {canvasState.width}x{canvasState.height}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1" />
            )}
            <span className="text-xs">
              {isExporting ? "Exporting..." : "Download"}
            </span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-75">
          <DropdownMenuItem onClick={handleExportAllPlatforms}>
            <Download className="h-3.5 w-3.5 mr-2" />
            All Platforms
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportLayers}>
            <Layers className="h-3.5 w-3.5 mr-2" />
            Liquid Glass Layers
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
