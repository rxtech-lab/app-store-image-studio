"use client";

import Link from "next/link";
import { SidebarToggle } from "@/components/app-layout";
import { ChevronRight, Folder } from "lucide-react";

interface ProjectPageHeaderProps {
  projectName: string;
}

export function ProjectPageHeader({ projectName }: ProjectPageHeaderProps) {
  return (
    <header className="flex items-center gap-2 border-b border-border/60 px-5 h-13 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <SidebarToggle />
      <div className="h-4 w-px bg-border/60 mx-1" />
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href="/appstore-marketing-image"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
          {projectName}
        </span>
      </nav>
    </header>
  );
}
