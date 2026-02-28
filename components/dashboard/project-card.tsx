"use client";

import Link from "next/link";
import { deleteProject } from "@/actions/projects";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="group relative">
      <Link href={`/project/${project.id}`} className="absolute inset-0 z-0" />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <CardTitle className="truncate">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative z-10 h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteProject(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground">
          Updated {new Date(project.updatedAt).toLocaleDateString()}
        </p>
      </CardHeader>
    </Card>
  );
}
