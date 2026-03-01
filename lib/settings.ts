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

export const ICON_EXPORT_SIZES = {
  ios: [
    { name: "App Store", size: 1024 },
    { name: "iPhone @3x", size: 180 },
    { name: "iPhone @2x", size: 120 },
    { name: "iPad Pro @2x", size: 167 },
    { name: "iPad @2x", size: 152 },
    { name: "Spotlight @3x", size: 87 },
    { name: "Spotlight @2x", size: 80 },
    { name: "Settings @3x", size: 60 },
    { name: "Settings @2x", size: 40 },
  ],
  macos: [
    { name: "1024", size: 1024 },
    { name: "512", size: 512 },
    { name: "256", size: 256 },
    { name: "128", size: 128 },
    { name: "64", size: 64 },
    { name: "32", size: 32 },
    { name: "16", size: 16 },
  ],
  android: [
    { name: "Play Store", size: 512 },
    { name: "xxxhdpi", size: 192 },
    { name: "xxhdpi", size: 144 },
    { name: "xhdpi", size: 96 },
    { name: "hdpi", size: 72 },
    { name: "mdpi", size: 48 },
  ],
  watchos: [{ name: "App Store", size: 1024 }],
} as const;

export type IconPlatform = keyof typeof ICON_EXPORT_SIZES;

export const AI_CONFIG = {
  imageModel: "google/gemini-3.1-flash-image-preview",
  iconImageModel: "openai/gpt-image-1.5",
  textModel: "google/gemini-3.1-flash-image-preview",
  editModel: "minimax/minimax-m2.5",
} as const;
