"use client";

import { SidebarToggle } from "@/components/app-layout";

export function IconGenerationHeader() {
  return (
    <header className="flex items-center gap-3 border-b px-4 h-12 shrink-0">
      <SidebarToggle />
    </header>
  );
}
