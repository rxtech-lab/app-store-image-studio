"use client";

import { Button } from "@/components/ui/button";
import { Type, Square, Circle, RectangleHorizontal } from "lucide-react";

interface CanvasToolbarProps {
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onAddText: () => void;
  onAddAccent: (shape: "rect" | "circle" | "roundedRect") => void;
}

export function CanvasToolbar({
  backgroundColor,
  onBackgroundColorChange,
  onAddText,
  onAddAccent,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <input
        type="color"
        value={backgroundColor}
        onChange={(e) => onBackgroundColorChange(e.target.value)}
        className="w-7 h-7 p-0.5 cursor-pointer rounded border border-border"
        title="Background color"
      />
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
    </div>
  );
}
