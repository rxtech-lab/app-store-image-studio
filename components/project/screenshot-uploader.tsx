"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  uploadScreenshot,
  listScreenshots,
  deleteScreenshot,
} from "@/actions/screenshots";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ScreenshotUploaderProps {
  sectionId: string;
  projectId: string;
  index?: number;
}

interface Screenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

export function ScreenshotUploader({
  sectionId,
  projectId,
  index = 0,
}: ScreenshotUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<Screenshot[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    listScreenshots(sectionId).then(setItems);
  }, [sectionId]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (!fileArray.length) return;

      setUploading(true);
      try {
        for (const file of fileArray) {
          const formData = new FormData();
          formData.set("file", file);
          const screenshot = await uploadScreenshot(
            sectionId,
            projectId,
            formData,
          );
          setItems((prev) => [...prev, screenshot]);
        }
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [sectionId, projectId],
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) handleFiles(files);
  };

  const handleDelete = async (screenshotId: string) => {
    await deleteScreenshot(screenshotId, projectId);
    setItems((prev) => prev.filter((s) => s.id !== screenshotId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) handleFiles(files);
  };

  const hasScreenshots = items.length > 0;

  return (
    <motion.div
      className={`ml-14 rounded-lg border border-dashed transition-colors ${
        dragOver
          ? "border-primary/50 bg-primary/5"
          : "border-border/40 bg-muted/20"
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.15 + index * 0.06,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      {hasScreenshots ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Screenshots ({items.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <ImagePlus className="mr-1.5 h-3 w-3" />
              )}
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <AnimatePresence>
              {items.map((screenshot) => (
                <motion.div
                  key={screenshot.id}
                  className="relative group w-16 h-28 rounded-lg overflow-hidden border border-border/40 bg-muted shadow-xs hover:shadow-sm transition-shadow"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
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
                  className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="w-full py-6 px-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground/60" />
          )}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {uploading
                ? "Uploading..."
                : "Drop screenshots here or click to upload"}
            </p>
          </div>
        </button>
      )}
    </motion.div>
  );
}
