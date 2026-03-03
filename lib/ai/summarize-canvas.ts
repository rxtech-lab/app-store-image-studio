import type { CanvasState } from "@/lib/canvas/types";

export function summarizeCanvasState(canvasState: CanvasState): string {
  const bg =
    canvasState.backgroundColor === "transparent"
      ? "transparent"
      : canvasState.backgroundImageUrl
        ? `image (${canvasState.backgroundImageUrl.split("/").pop()})`
        : canvasState.backgroundColor;

  const lines: string[] = [
    `Canvas: ${canvasState.width}x${canvasState.height}px | bg: ${bg}`,
    ``,
    `Layers (bottom → top):`,
  ];

  if (canvasState.elements.length === 0) {
    lines.push("  (empty)");
  } else {
    canvasState.elements.forEach((el, i) => {
      const prefix = `${i + 1}.`;
      const pos = `pos:(${Math.round(el.x)},${Math.round(el.y)}) size:${Math.round(el.width)}x${Math.round(el.height)}`;
      const label = el.name ? ` "${el.name}"` : "";
      if (el.type === "text") {
        const style = [
          `${el.fontSize}px`,
          el.fontWeight !== "normal" ? el.fontWeight : "",
          el.fontStyle !== "normal" ? el.fontStyle : "",
        ]
          .filter(Boolean)
          .join(" ");
        const preview =
          el.text.length > 40 ? el.text.slice(0, 40) + "…" : el.text;
        lines.push(
          `  ${prefix} [text]${label} id:"${el.id}" | "${preview}" | ${style} ${el.fill} | ${pos}`,
        );
      } else if (el.type === "screenshot") {
        lines.push(`  ${prefix} [screenshot]${label} id:"${el.id}" | ${pos}`);
      } else if (el.type === "image") {
        lines.push(
          `  ${prefix} [image]${label} id:"${el.id}" | opacity:${el.opacity} | ${pos}`,
        );
      } else if (el.type === "accent") {
        lines.push(
          `  ${prefix} [accent/${el.shape}]${label} id:"${el.id}" | fill:${el.fill} | ${pos}`,
        );
      } else if (el.type === "svg") {
        lines.push(
          `  ${prefix} [svg]${label} id:"${el.id}" | opacity:${el.opacity} | ${pos}`,
        );
      }
    });
  }

  return lines.join("\n");
}
