"use client";

import Link from "next/link";
import { deleteIconProject } from "@/actions/icon-projects";
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

interface IconProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    size: number;
    thumbnailUrl: string | null;
    updatedAt: string;
  };
}

export function IconProjectCard({ project }: IconProjectCardProps) {
  return (
    <Card className="group relative">
      <Link
        href={`/icon-generation/project/${project.id}`}
        className="absolute inset-0 z-0"
      />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            {project.thumbnailUrl ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.thumbnailUrl}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted shrink-0 border" />
            )}
            <div className="space-y-1 min-w-0">
              <CardTitle className="truncate">{project.name}</CardTitle>
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
              <p className="text-xs text-muted-foreground">
                {project.size}x{project.size}px
              </p>
            </div>
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
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${project.name}"? This cannot be undone.`,
                    )
                  ) {
                    deleteIconProject(project.id);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  );
}
