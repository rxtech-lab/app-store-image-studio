import type Konva from "konva";

/**
 * Temporarily hides all Transformer nodes on a Konva stage so that
 * selection handles are not included in exported images.
 * Returns a restore function that makes them visible again.
 */
export function hideTransformers(stage: Konva.Stage): () => void {
  const transformers = stage.find("Transformer");
  transformers.forEach((tr) => tr.visible(false));
  return () => {
    transformers.forEach((tr) => tr.visible(true));
  };
}
