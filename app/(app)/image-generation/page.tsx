import { listImageProjects } from "@/actions/image-projects";
import { ImageProjectCard } from "@/components/image-gen/project-card";
import { CreateImageProjectDialog } from "@/components/image-gen/create-project-dialog";
import { ImageGenerationHeader } from "./image-generation-header";

export default async function ImageGenerationPage() {
  const projects = await listImageProjects();

  return (
    <div className="flex flex-col h-full">
      <ImageGenerationHeader />
      <div className="flex-1 overflow-auto px-4 py-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Image Generation</h1>
          <CreateImageProjectDialog />
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No image projects yet</p>
            <p className="text-sm mt-1">
              Create your first image project to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ImageProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
