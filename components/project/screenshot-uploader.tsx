"use client";

import { useRef, useState, useEffect } from "react";
import {
  uploadScreenshot,
  listScreenshots,
  deleteScreenshot,
} from "@/actions/screenshots";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";

interface ScreenshotUploaderProps {
  sectionId: string;
  projectId: string;
}

interface Screenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

export function ScreenshotUploader({
  sectionId,
  projectId,
}: ScreenshotUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<Screenshot[]>([]);

  useEffect(() => {
    listScreenshots(sectionId).then(setItems);
  }, [sectionId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.set("file", file);
        const screenshot = await uploadScreenshot(sectionId, projectId, formData);
        setItems((prev) => [...prev, screenshot]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (screenshotId: string) => {
    await deleteScreenshot(screenshotId, projectId);
    setItems((prev) => prev.filter((s) => s.id !== screenshotId));
  };

  return (
    <div className="pl-4 border-l-2 border-muted">
      <div className="flex flex-wrap gap-3 items-center">
        {items.map((screenshot) => (
          <div
            key={screenshot.id}
            className="relative group w-20 h-36 rounded-md overflow-hidden border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshot.imageUrl}
              alt={screenshot.originalFilename}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(screenshot.id)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Screenshots
          </Button>
        </div>
      </div>
    </div>
  );
}
