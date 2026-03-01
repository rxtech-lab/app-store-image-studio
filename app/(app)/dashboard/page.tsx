import { getDashboardStats } from "@/actions/dashboard";
import { DashboardHeader } from "./dashboard-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FolderOpen, Image, Layout } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto px-4 py-8 container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Total Projects
              </CardDescription>
              <CardTitle className="text-4xl">{stats.totalProjects}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Total Screenshots
              </CardDescription>
              <CardTitle className="text-4xl">
                {stats.totalScreenshots}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Total Templates
              </CardDescription>
              <CardTitle className="text-4xl">{stats.totalTemplates}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        {stats.recentProjects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No projects yet</p>
            <p className="text-sm mt-1">
              Head to{" "}
              <Link
                href="/appstore-marketing-image"
                className="underline hover:text-foreground"
              >
                App Store Marketing
              </Link>{" "}
              to create your first project
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/appstore-marketing-image/project/${project.id}`}
                className="block"
              >
                <Card
                  size="sm"
                  className="transition-colors hover:bg-accent/50"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {project.description && (
                      <CardDescription>{project.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
