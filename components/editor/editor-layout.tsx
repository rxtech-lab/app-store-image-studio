"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { SidebarToggle } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayersPanel } from "./layers-panel";
import { ElementProperties } from "./element-properties";
import type { LayersPanelProps } from "./layers-panel";
import type { CanvasElement, CanvasAction } from "@/lib/canvas/types";

export interface EditorMenuItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface EditorMenu {
  label: string;
  items: EditorMenuItem[];
}

interface EditorLayoutProps {
  // Header
  backHref: string;
  title: string;
  isSaving?: boolean;
  isSaved?: boolean;
  menus?: EditorMenu[];

  // Toolbar
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;

  // Left panel slot (e.g. TemplateStrip)
  leftPanel?: React.ReactNode;

  // Layers panel
  showLayers?: boolean;
  layersProps?: LayersPanelProps;

  // Properties sidebar
  selectedElement?: CanvasElement | null;
  dispatch?: React.Dispatch<CanvasAction>;
  onSvgEdit?: (elementId: string) => void;

  // Canvas viewport content
  children: React.ReactNode;
}

export function EditorLayout({
  backHref,
  title,
  isSaving,
  isSaved,
  menus,
  toolbarLeft,
  toolbarRight,
  leftPanel,
  showLayers,
  layersProps,
  selectedElement,
  dispatch,
  onSvgEdit,
  children,
}: EditorLayoutProps) {
  const hasToolbar = toolbarLeft != null || toolbarRight != null;
  const hasProperties = dispatch != null;

  return (
    <div className="flex flex-col h-full">
      {/* Title bar */}
      <header className="flex items-center gap-3 border-b px-4 h-12 shrink-0">
        <SidebarToggle />
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon-xs" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm font-medium truncate">{title}</span>
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        ) : isSaved ? (
          <span className="text-xs text-muted-foreground ml-2">Saved</span>
        ) : null}

        {/* App-style menus */}
        {menus && menus.length > 0 && (
          <>
            <div className="w-px h-5 bg-border ml-2" />
            <div className="flex items-center gap-0.5">
              {menus.map((menu) => (
                <DropdownMenu key={menu.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 gap-1"
                    >
                      {menu.label}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {menu.items.map((item) => (
                      <DropdownMenuItem
                        key={item.label}
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className="gap-8"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {item.shortcut}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>
          </>
        )}
      </header>

      {/* Toolbar row */}
      {hasToolbar && (
        <div className="flex items-center gap-3 px-3 py-1.5 border-b bg-card shrink-0">
          {toolbarLeft}
          <div className="flex-1" />
          {toolbarRight}
        </div>
      )}

      {/* Main body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Optional left panel (TemplateStrip etc.) */}
        {leftPanel}

        {/* Layers panel */}
        {showLayers && layersProps && <LayersPanel {...layersProps} />}

        {/* Canvas viewport */}
        <div className="flex-1 flex items-center justify-center relative overflow-auto bg-muted/30 p-4">
          {children}
        </div>

        {/* Properties sidebar */}
        {hasProperties && (
          <div className="w-84 shrink-0 border-l bg-card flex flex-col h-full">
            <div className="px-3 py-2 border-b shrink-0">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Properties
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {selectedElement && dispatch ? (
                <ElementProperties
                  element={selectedElement}
                  dispatch={dispatch}
                  onSvgEdit={onSvgEdit}
                />
              ) : (
                <p className="text-xs text-muted-foreground text-center mt-8">
                  Select a layer to edit properties
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
