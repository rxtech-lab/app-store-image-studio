"use client";

import { useState } from "react";
import type Konva from "konva";
import type { CanvasState } from "@/lib/canvas/types";
import {
  exportIconAllPlatforms,
  exportIconSingle,
  exportIconLayers,
} from "@/actions/icon-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hideTransformers } from "@/lib/canvas/export-utils";
import {
  Download,
  Loader2,
  Layers,
  ChevronDown,
  ImageDown,
} from "lucide-react";

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
  const [exportingSingle, setExportingSingle] = useState(false);
  const [exportingLayers, setExportingLayers] = useState(false);
  const [cornerRadius, setCornerRadius] = useState(0);

  const isExporting = exportingAll || exportingSingle || exportingLayers;

  const getStageBase64 = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const restoreTransformers = hideTransformers(stage);
    const scale = stage.scaleX();
    const pixelRatio = 1 / scale;
    const dataUrl = stage.toDataURL({ pixelRatio });
    restoreTransformers();
    return dataUrl.split(",")[1];
  };

  const handleExportAllPlatforms = async () => {
    const base64 = getStageBase64();
    if (!base64) return;

    setExportingAll(true);
    try {
      const zipData = await exportIconAllPlatforms(base64, cornerRadius);

      const blob = new Blob([new Uint8Array(zipData)], {
        type: "application/zip",
      });
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

  const handleExportSingle = async () => {
    const base64 = getStageBase64();
    if (!base64) return;

    setExportingSingle(true);
    try {
      const size = canvasState.width;
      const pngData = await exportIconSingle(base64, size, cornerRadius);

      const blob = new Blob([new Uint8Array(pngData)], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${projectName}-icon-${size}x${size}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingSingle(false);
    }
  };

  const handleExportLayers = async () => {
    const stage = stageRef.current;
    if (!stage || canvasState.elements.length === 0) return;

    setExportingLayers(true);
    try {
      const restoreTransformers = hideTransformers(stage);
      const scale = stage.scaleX();
      const pixelRatio = 1 / scale;
      const layer = stage.getLayers()[0];
      if (!layer) return;

      // Collect all top-level element nodes
      const elementNodes = canvasState.elements.map((el) => {
        const node = layer.findOne(`#${el.id}`);
        return { element: el, node };
      });

      // Find background nodes (not part of elements array)
      const allNodes = layer.getChildren();
      const backgroundNodes = allNodes.filter(
        (node) => !canvasState.elements.some((el) => el.id === node.id()),
      );

      const layerImages: { name: string; base64: string }[] = [];

      // Hide all element nodes first
      for (const { node } of elementNodes) {
        if (node) node.visible(false);
      }
      // Hide background nodes
      for (const node of backgroundNodes) {
        node.visible(false);
      }

      // Render each element individually
      // For groups, the entire group (with all children) renders as one layer
      for (let i = 0; i < elementNodes.length; i++) {
        const { element, node } = elementNodes[i];
        if (!node) continue;

        node.visible(true);
        layer.draw();

        const dataUrl = stage.toDataURL({ pixelRatio });
        const base64 = dataUrl.split(",")[1];
        const name =
          element.name ||
          (element.type === "group"
            ? `group_${i + 1}`
            : `layer_${i + 1}`);
        layerImages.push({ name, base64 });

        node.visible(false);
      }

      // Restore all visibility
      for (const { node } of elementNodes) {
        if (node) node.visible(true);
      }
      for (const node of backgroundNodes) {
        node.visible(true);
      }
      restoreTransformers();
      layer.draw();

      if (layerImages.length === 0) return;

      const zipData = await exportIconLayers(
        layerImages.map((l) => ({ name: l.name, base64: l.base64 })),
      );

      const blob = new Blob([new Uint8Array(zipData)], {
        type: "application/zip",
      });
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

  // Max corner radius is half the icon size (fully rounded)
  const maxRadius = Math.floor(canvasState.width / 2);

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Corner radius control */}
      <div className="items-center gap-2 hidden sm:flex">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Radius
        </Label>
        <Slider
          value={[cornerRadius]}
          onValueChange={([v]: number[]) => setCornerRadius(v)}
          min={0}
          max={maxRadius}
          step={1}
          className="w-20"
        />
        <Input
          type="number"
          value={cornerRadius}
          onChange={(e) => {
            const v = Math.max(0, Math.min(maxRadius, Number(e.target.value) || 0));
            setCornerRadius(v);
          }}
          min={0}
          max={maxRadius}
          className="h-6 w-12 text-xs text-center px-1 tabular-nums"
        />
      </div>

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
          <DropdownMenuItem onClick={handleExportSingle}>
            <ImageDown className="h-3.5 w-3.5 mr-2" />
            Single Icon (PNG)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportAllPlatforms}>
            <Download className="h-3.5 w-3.5 mr-2" />
            All Platforms
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportLayers}>
            <Layers className="h-3.5 w-3.5 mr-2" />
            Liquid Glass Layers
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
