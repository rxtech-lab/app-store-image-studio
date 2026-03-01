import { IMAGE_PRESETS, type PresetKey } from "@/lib/settings";
import type { CanvasState } from "./types";

export function getDefaultCanvasState(
  presetKey: PresetKey | "custom",
  customWidth?: number | null,
  customHeight?: number | null,
): CanvasState {
  if (presetKey === "custom") {
    return {
      width: customWidth ?? 1290,
      height: customHeight ?? 2796,
      backgroundColor: "#1a1a2e",
      elements: [],
    };
  }
  const preset = IMAGE_PRESETS[presetKey];
  return {
    width: preset.width,
    height: preset.height,
    backgroundColor: "#1a1a2e",
    elements: [],
  };
}

export function resolvePresetDimensions(
  presetKey: string,
  customWidth?: number | null,
  customHeight?: number | null,
): { width: number; height: number; title: string } {
  if (presetKey === "custom") {
    return {
      width: customWidth ?? 1290,
      height: customHeight ?? 2796,
      title: "Custom",
    };
  }
  const preset = IMAGE_PRESETS[presetKey as PresetKey];
  if (!preset) {
    return { width: 1290, height: 2796, title: presetKey };
  }
  return { width: preset.width, height: preset.height, title: preset.title };
}
