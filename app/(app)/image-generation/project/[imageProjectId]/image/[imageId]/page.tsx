import { getGeneratedImage, getImageProject } from "@/actions/image-projects";
import { ImageEditorClient } from "./editor-client";

export default async function ImageEditorPage({
  params,
}: {
  params: Promise<{ imageProjectId: string; imageId: string }>;
}) {
  const { imageProjectId, imageId } = await params;
  const [image, project] = await Promise.all([
    getGeneratedImage(imageId),
    getImageProject(imageProjectId),
  ]);

  return (
    <ImageEditorClient
      imageId={imageId}
      imageProjectId={imageProjectId}
      projectName={project.name}
      initialCanvasState={image.canvasState ?? undefined}
      initialAiMessages={(image.aiMessages ?? []) as unknown[]}
      width={image.canvasState?.width ?? project.width}
      height={image.canvasState?.height ?? project.height}
    />
  );
}
