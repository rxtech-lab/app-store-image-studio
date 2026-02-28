"use client";

import { IMAGE_PRESETS, type PresetKey } from "@/lib/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PresetSelectorProps {
  value: PresetKey;
  onValueChange: (value: PresetKey) => void;
}

export function PresetSelector({ value, onValueChange }: PresetSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as PresetKey)}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select device preset" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(IMAGE_PRESETS).map(([key, preset]) => (
          <SelectItem key={key} value={key}>
            {preset.title} ({preset.width}x{preset.height})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
