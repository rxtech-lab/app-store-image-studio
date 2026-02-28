"use client";

import type { TextElement } from "@/lib/canvas/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Inter",
  "SF Pro Display",
  "Roboto",
];

interface TextControlsProps {
  element: TextElement;
  onChange: (attrs: Partial<TextElement>) => void;
}

export function TextControls({ element, onChange }: TextControlsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Text Content</Label>
        <textarea
          value={element.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none min-h-15"
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Font Family</Label>
        <Select
          value={element.fontFamily}
          onValueChange={(v) => onChange({ fontFamily: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Font Size</Label>
          <Input
            type="number"
            value={element.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="h-8"
            min={8}
            max={400}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Line Height</Label>
          <Input
            type="number"
            value={element.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="h-8"
            min={0.5}
            max={3}
            step={0.1}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Color</Label>
        <Input
          type="color"
          value={element.fill}
          onChange={(e) => onChange({ fill: e.target.value })}
          className="w-full h-8 p-0.5 cursor-pointer"
        />
      </div>

      <div className="flex gap-1">
        <Button
          variant={element.fontWeight === "bold" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() =>
            onChange({
              fontWeight: element.fontWeight === "bold" ? "normal" : "bold",
            })
          }
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={element.fontStyle === "italic" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() =>
            onChange({
              fontStyle: element.fontStyle === "italic" ? "normal" : "italic",
            })
          }
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          variant={element.align === "left" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onChange({ align: "left" })}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={element.align === "center" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onChange({ align: "center" })}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={element.align === "right" ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onChange({ align: "right" })}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
