import { getProject } from "@/actions/projects";
import { listSections } from "@/actions/sections";
import { SectionCard } from "@/components/project/section-card";
import { CreateSectionDialog } from "@/components/project/create-section-dialog";
import { ScreenshotUploader } from "@/components/project/screenshot-uploader";
import { ProjectHeader } from "@/components/project/project-header";
import { ProjectPageHeader } from "./project-page-header";

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
      <ProjectPageHeader />
      <div className="flex-1 overflow-auto container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <ProjectHeader
            projectId={projectId}
            name={project.name}
            description={project.description}
          />
          <CreateSectionDialog projectId={projectId} />
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No screenshot sections yet</p>
            <p className="text-sm mt-1">
              Add a section to start creating marketing images
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="space-y-3">
                <SectionCard section={section} />
                <ScreenshotUploader
                  sectionId={section.id}
                  projectId={projectId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
