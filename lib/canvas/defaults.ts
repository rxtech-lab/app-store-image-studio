import { IMAGE_PRESETS, type PresetKey } from "@/lib/settings";
import type { CanvasState } from "./types";

export function getDefaultCanvasState(presetKey: PresetKey): CanvasState {
  const preset = IMAGE_PRESETS[presetKey];
  return {
    width: preset.width,
    height: preset.height,
    backgroundColor: "#1a1a2e",
    elements: [],
  };
}
