import { getProject } from "@/actions/projects";
import { listSections } from "@/actions/sections";
import { AppHeader } from "@/components/app-header";
import { SectionCard } from "@/components/project/section-card";
import { CreateSectionDialog } from "@/components/project/create-section-dialog";
import { ScreenshotUploader } from "@/components/project/screenshot-uploader";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

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
      </main>
    </div>
  );
}
