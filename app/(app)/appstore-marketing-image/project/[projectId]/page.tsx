import { getProject } from "@/actions/projects";
import { listSections } from "@/actions/sections";
import { SectionCard } from "@/components/project/section-card";
import { CreateSectionDialog } from "@/components/project/create-section-dialog";
import { ScreenshotUploader } from "@/components/project/screenshot-uploader";
import { ProjectHeader } from "@/components/project/project-header";
import { ProjectPageHeader } from "./project-page-header";
import { Layers } from "lucide-react";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, sections] = await Promise.all([
    getProject(projectId),
    listSections(projectId),
  ]);

  return (
    <div className="flex flex-col h-full">
      <ProjectPageHeader projectName={project.name} />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-10">
            <ProjectHeader
              projectId={projectId}
              name={project.name}
              description={project.description}
              sectionCount={sections.length}
            />
            <CreateSectionDialog projectId={projectId} />
          </div>

          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 mb-5">
                <Layers className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1.5">
                No templates yet
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
                Add your first template to start creating marketing images for
                different device sizes.
              </p>
              <CreateSectionDialog projectId={projectId} />
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, i) => (
                <div key={section.id} className="space-y-2.5">
                  <SectionCard section={section} index={i} />
                  <ScreenshotUploader
                    sectionId={section.id}
                    projectId={projectId}
                    index={i}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
