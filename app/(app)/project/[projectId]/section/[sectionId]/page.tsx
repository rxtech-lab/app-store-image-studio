import { getProject } from "@/actions/projects";
import { getSection } from "@/actions/sections";
import { listTemplates } from "@/actions/templates";
import { listScreenshots } from "@/actions/screenshots";
import { SectionEditorClient } from "./editor-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 border-b px-4 h-12 shrink-0">
        <Button variant="ghost" size="icon-xs" asChild>
          <Link href={`/project/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm font-medium truncate">{project.name}</span>
      </header>
      <div className="flex-1 min-h-0">
        <SectionEditorClient
          projectId={projectId}
          projectName={project.name}
          sectionId={sectionId}
          presetKey={section.presetKey as PresetKey}
          initialTemplates={templates}
          screenshots={screenshots}
        />
      </div>
    </div>
  );
}
