export const IMAGE_PRESETS = {
  "iphone-6.7": {
    title: 'iPhone 6.7"',
    width: 1290,
    height: 2796,
  },
  "iphone-6.5": {
    title: 'iPhone 6.5"',
    width: 1284,
    height: 2778,
  },
  "iphone-5.5": {
    title: 'iPhone 5.5"',
    width: 1242,
    height: 2208,
  },
  "ipad-12.9": {
    title: 'iPad 12.9"',
    width: 2048,
    height: 2732,
  },
  "ipad-11": {
    title: 'iPad 11"',
    width: 1668,
    height: 2388,
  },
  mac: {
    title: "Mac",
    width: 2880,
    height: 1800,
  },
} as const;

export type PresetKey = keyof typeof IMAGE_PRESETS;

export const AI_CONFIG = {
  backgroundModel: "google/gemini-3.1-flash-image-preview",
  textModel: "google/gemini-3.1-flash-image-preview",
  editModel: "minimax/minimax-m2.5",
} as const;
