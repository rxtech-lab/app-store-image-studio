"use client";

import Link from "next/link";
import { IMAGE_PRESETS, type PresetKey } from "@/lib/settings";
import { deleteSection } from "@/actions/sections";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Pencil } from "lucide-react";

interface SectionCardProps {
  section: {
    id: string;
    projectId: string;
    presetKey: string;
    order: number;
  };
}

export function SectionCard({ section }: SectionCardProps) {
  const preset = IMAGE_PRESETS[section.presetKey as PresetKey];
  const presetTitle = preset?.title ?? section.presetKey;

  return (
    <Card className="group relative">
      <Link
        href={`/project/${section.projectId}/section/${section.id}`}
        className="absolute inset-0 z-0"
      />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{presetTitle}</CardTitle>
            <CardDescription>
              {preset ? `${preset.width} x ${preset.height}` : "Custom"}
            </CardDescription>
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
              <DropdownMenuItem asChild>
                <Link
                  href={`/project/${section.projectId}/section/${section.id}`}
                  className="flex items-center"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete this "${presetTitle}" section? This cannot be undone.`,
                    )
                  ) {
                    deleteSection(section.id, section.projectId);
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
