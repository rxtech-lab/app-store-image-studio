"use client";

import { useState } from "react";
import type Konva from "konva";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileArchive } from "lucide-react";

interface ExportButtonsProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  canvasWidth: number;
  canvasHeight: number;
  projectName: string;
}

export function ExportButtons({
  stageRef,
  canvasWidth,
  canvasHeight,
  projectName,
}: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportSingle = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const scale = stage.scaleX();
    const pixelRatio = 1 / scale;

    const uri = stage.toDataURL({ pixelRatio });
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
      const scale = stage.scaleX();
      const pixelRatio = 1 / scale;
      const dataUrl = stage.toDataURL({ pixelRatio });
      const base64 = dataUrl.split(",")[1];

      const zip = new JSZip();
      zip.file(`${projectName}.png`, base64, { base64: true });
      const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

      const blob = new Blob([zipBuffer], {
        type: "application/zip",
      });
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
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {canvasWidth}x{canvasHeight}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={handleExportSingle}
        title="Export PNG"
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        <span className="text-xs">PNG</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={handleExportZip}
        disabled={exporting}
        title="Export ZIP"
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <FileArchive className="h-3.5 w-3.5 mr-1" />
        )}
        <span className="text-xs">ZIP</span>
      </Button>
    </div>
  );
}
