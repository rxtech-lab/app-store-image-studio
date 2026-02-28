import { getProject } from "@/actions/projects";
import { getSection } from "@/actions/sections";
import { listTemplates } from "@/actions/templates";
import { listScreenshots } from "@/actions/screenshots";
import { AppHeader } from "@/components/app-header";
import { SectionEditorClient } from "./editor-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/project/${projectId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {project.name}
            </Link>
          </Button>
        </div>
        <SectionEditorClient
          projectId={projectId}
          projectName={project.name}
          sectionId={sectionId}
          presetKey={section.presetKey as PresetKey}
          initialTemplates={templates}
          screenshots={screenshots}
        />
      </main>
    </div>
  );
}
