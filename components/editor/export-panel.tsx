"use client";

import { useState } from "react";
import type Konva from "konva";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { hideTransformers } from "@/lib/canvas/export-utils";
import { Download, Loader2, FileArchive } from "lucide-react";

interface ExportPanelProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  canvasWidth: number;
  canvasHeight: number;
  projectName: string;
}

export function ExportPanel({
  stageRef,
  canvasWidth,
  canvasHeight,
  projectName,
}: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportSingle = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const restoreTransformers = hideTransformers(stage);
    const scale = stage.scaleX();
    const pixelRatio = 1 / scale;

    const uri = stage.toDataURL({ pixelRatio });
    restoreTransformers();
    const link = document.createElement("a");
    link.download = `${projectName}.png`;
    link.href = uri;
    link.click();
  };

  const handleExportZip = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    setExporting(true);
    try {
      const restoreTransformers = hideTransformers(stage);
      const scale = stage.scaleX();
      const pixelRatio = 1 / scale;
      const dataUrl = stage.toDataURL({ pixelRatio });
      restoreTransformers();
      const base64 = dataUrl.split(",")[1];

      const zip = new JSZip();
      zip.file(`${projectName}.png`, base64, { base64: true });
      const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

      const blob = new Blob([zipBuffer], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${projectName}-images.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-card">
      <h3 className="font-medium text-sm">Export</h3>
      <p className="text-xs text-muted-foreground">
        {canvasWidth} x {canvasHeight}px
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportSingle}>
          <Download className="mr-2 h-4 w-4" />
          PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportZip}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileArchive className="mr-2 h-4 w-4" />
          )}
          ZIP
        </Button>
      </div>
    </div>
  );
}
