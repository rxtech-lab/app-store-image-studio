import { listIconProjects } from "@/actions/icon-projects";
import { IconProjectCard } from "@/components/icon/icon-project-card";
import { CreateIconProjectDialog } from "@/components/icon/create-icon-project-dialog";
import { IconGenerationHeader } from "./icon-generation-header";

export default async function IconGenerationPage() {
  const projects = await listIconProjects();

  return (
    <div className="flex flex-col h-full">
      <IconGenerationHeader />
      <div className="flex-1 overflow-auto px-4 py-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Icon Generation</h1>
          <CreateIconProjectDialog />
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No icon projects yet</p>
            <p className="text-sm mt-1">
              Create your first icon project to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <IconProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
