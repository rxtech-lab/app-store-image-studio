import { getImageProject } from "@/actions/image-projects";
import { ProjectClient } from "./project-client";

export default async function ImageProjectPage({
  params,
}: {
  params: Promise<{ imageProjectId: string }>;
}) {
  const { imageProjectId } = await params;
  const project = await getImageProject(imageProjectId);

  return <ProjectClient project={project} />;
}
