"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Type,
  Square,
  Circle,
  RectangleHorizontal,
  Layers,
  ImageOff,
  ImagePlus,
  Loader2,
  LayoutTemplate,
  Image as ImageIcon,
} from "lucide-react";
import { uploadBackgroundImage } from "@/actions/templates";

interface CanvasToolbarProps {
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  backgroundImageUrl?: string;
  onRemoveBackgroundImage?: () => void;
  onSetBackgroundImage?: (url: string) => void;
  onAddText: () => void;
  onAddAccent: (shape: "rect" | "circle" | "roundedRect") => void;
  showLayers: boolean;
  onToggleLayers: () => void;
  showTemplates?: boolean;
  onToggleTemplates?: () => void;
  supportTransparent?: boolean;
  onAddImage?: (file: File) => void;
  isAddingImage?: boolean;
}

export function CanvasToolbar({
  backgroundColor,
  onBackgroundColorChange,
  backgroundImageUrl,
  onRemoveBackgroundImage,
  onSetBackgroundImage,
  onAddText,
  onAddAccent,
  showLayers,
  onToggleLayers,
  showTemplates,
  onToggleTemplates,
  supportTransparent,
  onAddImage,
  isAddingImage,
}: CanvasToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageLayerInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSetBackgroundImage) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadBackgroundImage(formData);
      onSetBackgroundImage(url);
    } finally {
      setIsUploading(false);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      {onToggleTemplates && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showTemplates ? "default" : "ghost"}
                size="icon-xs"
                onClick={onToggleTemplates}
              >
                <LayoutTemplate className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Templates</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showLayers ? "default" : "ghost"}
              size="icon-xs"
              onClick={onToggleLayers}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle Layers</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="w-px h-5 bg-border" />
      {supportTransparent && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={backgroundColor === "transparent" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() =>
                  onBackgroundColorChange(
                    backgroundColor === "transparent" ? "#1a1a2e" : "transparent",
                  )
                }
              >
                <span className="h-4 w-4 inline-flex items-center justify-center text-xs font-mono">T</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {backgroundColor === "transparent"
                ? "Set solid background"
                : "Transparent background"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <input
        type="color"
        value={backgroundColor === "transparent" ? "#000000" : backgroundColor}
        onChange={(e) => onBackgroundColorChange(e.target.value)}
        className="w-7 h-7 p-0.5 cursor-pointer rounded border border-border"
        title="Background color"
        disabled={backgroundColor === "transparent"}
      />
      {onSetBackgroundImage && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isUploading ? "Uploading..." : "Set Background Image"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBgUpload}
      />
      {backgroundImageUrl && onRemoveBackgroundImage && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  if (window.confirm("Remove background image?")) {
                    onRemoveBackgroundImage();
                  }
                }}
              >
                <ImageOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Remove Background Image
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onAddText}
        title="Add Text"
      >
        <Type className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onAddAccent("rect")}
        title="Add Rectangle"
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onAddAccent("circle")}
        title="Add Circle"
      >
        <Circle className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onAddAccent("roundedRect")}
        title="Add Rounded Rectangle"
      >
        <RectangleHorizontal className="h-4 w-4" />
      </Button>
      {onAddImage && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => imageLayerInputRef.current?.click()}
                  disabled={isAddingImage}
                >
                  {isAddingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isAddingImage ? "Uploading..." : "Add Image Layer"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={imageLayerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAddImage(file);
              if (imageLayerInputRef.current)
                imageLayerInputRef.current.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
