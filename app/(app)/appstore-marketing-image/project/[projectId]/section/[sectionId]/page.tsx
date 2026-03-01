import { getProject } from "@/actions/projects";
import { getSection } from "@/actions/sections";
import { listTemplates } from "@/actions/templates";
import { listScreenshots } from "@/actions/screenshots";
import { SectionEditorClient } from "./editor-client";
import type { PresetKey } from "@/lib/settings";

export default async function SectionEditorPage({
  params,
}: {
  params: Promise<{ projectId: string; sectionId: string }>;
}) {
  const { projectId, sectionId } = await params;
  const [project, section, templates, screenshots] = await Promise.all([
    getProject(projectId),
    getSection(sectionId),
    listTemplates(sectionId),
    listScreenshots(sectionId),
  ]);

  return (
    <SectionEditorClient
      projectId={projectId}
      projectName={project.name}
      projectDescription={project.description ?? undefined}
      sectionId={sectionId}
      presetKey={section.presetKey as PresetKey | "custom"}
      customWidth={section.customWidth}
      customHeight={section.customHeight}
      initialTemplates={templates}
      screenshots={screenshots}
    />
  );
}
