import { getIconProject } from "@/actions/icon-projects";
import { IconEditorClient } from "./editor-client";

export default async function IconEditorPage({
  params,
}: {
  params: Promise<{ iconProjectId: string }>;
}) {
  const { iconProjectId } = await params;
  const project = await getIconProject(iconProjectId);

  return (
    <IconEditorClient
      iconProjectId={iconProjectId}
      projectName={project.name}
      projectDescription={project.description ?? undefined}
      size={project.size}
      initialCanvasState={project.canvasState ?? undefined}
      initialAiMessages={(project.aiMessages ?? []) as unknown[]}
    />
  );
}
