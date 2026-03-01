import { listProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/dashboard/project-card";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { AppStoreMarketingHeader } from "./appstore-marketing-header";

export default async function AppStoreMarketingPage() {
  const projects = await listProjects();

  return (
    <div className="flex flex-col h-full">
      <AppStoreMarketingHeader />
      <div className="flex-1 overflow-auto px-4 py-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">App Store Marketing</h1>
          <CreateProjectDialog />
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No projects yet</p>
            <p className="text-sm mt-1">
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
