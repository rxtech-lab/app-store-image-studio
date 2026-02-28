"use client";

import { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PanelLeft } from "lucide-react";

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  open: true,
  toggle: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

/** Inline button any page header can render to toggle the app sidebar. */
export function SidebarToggle() {
  const { open, toggle } = useSidebar();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-xs" onClick={toggle}>
            <PanelLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {open ? "Hide sidebar" : "Show sidebar"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AppLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <SidebarContext.Provider
      value={{ open: sidebarOpen, toggle: () => setSidebarOpen((v) => !v) }}
    >
      <div className="flex h-screen">
        {sidebarOpen && sidebar}
        <main className="flex-1 flex flex-col overflow-auto">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}
