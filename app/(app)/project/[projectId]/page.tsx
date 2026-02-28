import { getProject } from "@/actions/projects";
import { listSections } from "@/actions/sections";
import { SectionCard } from "@/components/project/section-card";
import { CreateSectionDialog } from "@/components/project/create-section-dialog";
import { ScreenshotUploader } from "@/components/project/screenshot-uploader";

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
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
  );
}
