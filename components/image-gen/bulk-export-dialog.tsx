"use client";

import { useState } from "react";
import { exportAllImages, type ImageFormat } from "@/actions/image-export";
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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Loader2 } from "lucide-react";

interface BulkExportDialogProps {
  images: { id: string; imageUrl: string; prompt: string | null }[];
  selectedIds: Set<string>;
  projectName: string;
}

export function BulkExportDialog({
  images,
  selectedIds,
  projectName,
}: BulkExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState(90);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");

  const targetImages =
    selectedIds.size > 0
      ? images.filter((img) => selectedIds.has(img.id))
      : images;

  const handleExport = async () => {
    if (targetImages.length === 0) return;

    setExporting(true);
    setProgress("Preparing images...");

    try {
      // Fetch all images and convert to base64
      const imageData: { base64: string; name: string }[] = [];

      for (let i = 0; i < targetImages.length; i++) {
        const img = targetImages[i];
        setProgress(`Processing image ${i + 1} of ${targetImages.length}...`);

        const res = await fetch(img.imageUrl);
        const arrayBuffer = await res.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer)),
        );

        const name =
          img.prompt?.slice(0, 50).replace(/[^a-zA-Z0-9 ]/g, "") ||
          `image_${i + 1}`;
        imageData.push({ base64, name });
      }

      setProgress("Creating ZIP...");
      const zipData = await exportAllImages(imageData, format, quality);

      const blob = new Blob([new Uint8Array(zipData)], {
        type: "application/zip",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${projectName}-images.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } finally {
      setExporting(false);
      setProgress("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={images.length === 0}>
          <Download className="mr-2 h-3.5 w-3.5" />
          Export{selectedIds.size > 0 ? ` (${selectedIds.size})` : " All"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Export {targetImages.length} Image
            {targetImages.length !== 1 ? "s" : ""}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as ImageFormat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (lossless)</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(format === "webp" || format === "jpeg") && (
            <div className="space-y-2">
              <Label>Quality: {quality}%</Label>
              <Slider
                value={[quality]}
                onValueChange={([v]: number[]) => setQuality(v)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          )}

          {progress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progress}
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={exporting}>Cancel</AlertDialogCancel>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export as ZIP
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
