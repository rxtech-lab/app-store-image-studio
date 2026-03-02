"use client";

import { useRef, useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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

// ── Color helpers ────────────────────────────────────────────────────────────

function parseColor(color: string): { hex: string; opacityPct: number } {
  if (color === "transparent") return { hex: "#1a1a2e", opacityPct: 0 };

  const rgba = color.match(
    /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/,
  );
  if (rgba) {
    const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map(Number);
    const a = rgba[4] !== undefined ? parseFloat(rgba[4]) : 1;
    const hex =
      "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    return { hex, opacityPct: Math.round(a * 100) };
  }

  return { hex: color.startsWith("#") ? color : "#ffffff", opacityPct: 100 };
}

function buildColor(hex: string, opacityPct: number): string {
  if (opacityPct === 0) return "transparent";
  if (opacityPct === 100) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${(opacityPct / 100).toFixed(2)})`;
}

// ── BgColorPicker ────────────────────────────────────────────────────────────

function BgColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const { hex, opacityPct } = parseColor(color);
  // Remembers the last solid hex so clicking "Transparent" and then back restores it
  const lastHexRef = useRef(opacityPct > 0 ? hex : "#1a1a2e");
  if (opacityPct > 0) lastHexRef.current = hex;
  const displayHex = opacityPct === 0 ? lastHexRef.current : hex;

  return (
    <PopoverPrimitive.Root>
      <TooltipProvider>
        <Tooltip>
          <PopoverPrimitive.Trigger asChild>
            <TooltipTrigger asChild>
              <button
                className="w-7 h-7 rounded border border-border relative overflow-hidden shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Background color"
                style={{
                  backgroundImage: [
                    "linear-gradient(45deg, #ccc 25%, transparent 25%)",
                    "linear-gradient(-45deg, #ccc 25%, transparent 25%)",
                    "linear-gradient(45deg, transparent 75%, #ccc 75%)",
                    "linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  ].join(","),
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: opacityPct === 0 ? "transparent" : color }}
                />
              </button>
            </TooltipTrigger>
          </PopoverPrimitive.Trigger>
          <TooltipContent side="bottom">Background color</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={8}
          className="z-50 rounded-lg border bg-popover p-3 shadow-md w-48 space-y-3"
        >
          {/* Transparent / Color toggle */}
          <div className="flex gap-1.5">
            {/* Transparent option */}
            <button
              onClick={() => {
                lastHexRef.current = displayHex;
                onChange("transparent");
              }}
              className={`flex-1 h-8 rounded border-2 relative overflow-hidden cursor-pointer transition-colors ${
                opacityPct === 0
                  ? "border-primary"
                  : "border-border hover:border-muted-foreground"
              }`}
              style={{
                backgroundImage: [
                  "linear-gradient(45deg, #ccc 25%, transparent 25%)",
                  "linear-gradient(-45deg, #ccc 25%, transparent 25%)",
                  "linear-gradient(45deg, transparent 75%, #ccc 75%)",
                  "linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                ].join(","),
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
              }}
              title="Transparent"
            />
            {/* Solid color option */}
            <button
              type="button"
              onClick={() => { if (opacityPct === 0) onChange(displayHex); }}
              className={`flex-1 flex items-center gap-1.5 h-8 px-1.5 rounded border-2 bg-background transition-colors ${
                opacityPct > 0
                  ? "border-primary"
                  : "border-border hover:border-muted-foreground cursor-pointer"
              }`}
            >
              <input
                type="color"
                value={displayHex}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  onChange(buildColor(e.target.value, opacityPct === 0 ? 100 : opacityPct))
                }
                className="w-5 h-5 p-0 cursor-pointer rounded border-0 shrink-0 bg-transparent"
              />
              <span className="text-xs text-muted-foreground font-mono truncate">
                {displayHex}
              </span>
            </button>
          </div>

          {/* Opacity row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Opacity</span>
              <span className="text-xs font-mono tabular-nums">
                {opacityPct}%
              </span>
            </div>
            <Slider
              value={[opacityPct]}
              onValueChange={([v]) => onChange(buildColor(displayHex, v))}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <PopoverPrimitive.Arrow className="fill-border" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ── CanvasToolbar ────────────────────────────────────────────────────────────

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
  /** @deprecated transparent background is always supported via the color picker */
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

      {/* Background color picker (color + opacity, supports transparent) */}
      <BgColorPicker
        color={backgroundColor}
        onChange={onBackgroundColorChange}
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
            <TooltipContent side="bottom">Remove Background Image</TooltipContent>
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
