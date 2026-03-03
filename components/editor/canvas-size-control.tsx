"use client";

import { useState } from "react";
import { IMAGE_PRESETS, type PresetKey } from "@/lib/settings";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CanvasSizeControlProps {
  width: number;
  height: number;
  onChange: (width: number, height: number) => void;
}

function detectPreset(
  width: number,
  height: number,
): PresetKey | "custom" {
  for (const [key, preset] of Object.entries(IMAGE_PRESETS)) {
    if (preset.width === width && preset.height === height) {
      return key as PresetKey;
    }
  }
  return "custom";
}

export function CanvasSizeControl({
  width,
  height,
  onChange,
}: CanvasSizeControlProps) {
  const [preset, setPreset] = useState<PresetKey | "custom">(
    detectPreset(width, height),
  );
  const [customWidth, setCustomWidth] = useState(width);
  const [customHeight, setCustomHeight] = useState(height);

  const handlePresetChange = (value: PresetKey | "custom") => {
    setPreset(value);
    if (value !== "custom") {
      const p = IMAGE_PRESETS[value];
      onChange(p.width, p.height);
    }
  };

  const handleCustomWidthChange = (w: number) => {
    setCustomWidth(w);
    if (w > 0) onChange(w, customHeight);
  };

  const handleCustomHeightChange = (h: number) => {
    setCustomHeight(h);
    if (h > 0) onChange(customWidth, h);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="h-7 w-40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(IMAGE_PRESETS).map(([key, val]) => (
            <SelectItem key={key} value={key}>
              {val.title}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {preset === "custom" ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={customWidth}
            onChange={(e) =>
              handleCustomWidthChange(Number(e.target.value) || 0)
            }
            min={1}
            max={10000}
            className="h-7 w-16 text-xs text-center px-1"
          />
          <span className="text-xs text-muted-foreground">×</span>
          <Input
            type="number"
            value={customHeight}
            onChange={(e) =>
              handleCustomHeightChange(Number(e.target.value) || 0)
            }
            min={1}
            max={10000}
            className="h-7 w-16 text-xs text-center px-1"
          />
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">
          {width}×{height}
        </span>
      )}
    </div>
  );
}
