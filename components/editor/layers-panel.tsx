"use client";

import { useState, useRef, useEffect } from "react";
import { Reorder, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { CanvasElement, CanvasAction } from "@/lib/canvas/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ImageIcon,
  Type,
  Square,
  Circle,
  RectangleHorizontal,
  Copy,
  Trash2,
  GripVertical,
  ImageOff,
  Wallpaper,
  Pencil,
  Code2,
  FolderOpen,
  FolderClosed,
  Group,
  Ungroup,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

function getElementDisplayName(el: CanvasElement): string {
  if (el.name) return el.name;
  switch (el.type) {
    case "text":
      return el.text.length > 20 ? el.text.slice(0, 20) + "…" : el.text;
    case "screenshot":
      return "Screenshot";
    case "accent":
      return el.shape === "circle"
        ? "Circle"
        : el.shape === "roundedRect"
          ? "Rounded Rect"
          : "Rectangle";
    case "image":
      return "Image Layer";
    case "svg":
      return "SVG";
    case "group":
      return "Group";
  }
}

function getElementIcon(el: CanvasElement) {
  switch (el.type) {
    case "text":
      return Type;
    case "screenshot":
      return ImageIcon;
    case "accent":
      return el.shape === "circle"
        ? Circle
        : el.shape === "roundedRect"
          ? RectangleHorizontal
          : Square;
    case "image":
      return Wallpaper;
    case "svg":
      return Code2;
    case "group":
      return FolderOpen;
  }
}

export interface LayersPanelProps {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onMultiSelect?: (id: string) => void;
  dispatch: React.Dispatch<CanvasAction>;
  backgroundImageUrl?: string;
  onRemoveBackgroundImage?: () => void;
}

export function LayersPanel({
  elements,
  selectedIds,
  onSelect,
  onMultiSelect,
  dispatch,
  backgroundImageUrl,
  onRemoveBackgroundImage,
}: LayersPanelProps) {
  // Reverse for display: top layer (last in array) shown first
  const displayElements = [...elements].reverse();

  const handleReorder = (reordered: CanvasElement[]) => {
    // Reverse back to storage order (first = bottom, last = top)
    dispatch({ type: "SET_ELEMENTS", payload: [...reordered].reverse() });
  };

  const canGroup = selectedIds.length >= 2;
  const canUngroup =
    selectedIds.length === 1 &&
    elements.find((el) => el.id === selectedIds[0])?.type === "group";

  return (
    <div className="w-56 shrink-0 border-r bg-card flex flex-col h-full">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Layers
        </h3>
        <TooltipProvider>
          <div className="flex gap-0.5">
            {canGroup && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-5 w-5"
                    onClick={() =>
                      dispatch({
                        type: "GROUP_ELEMENTS",
                        payload: selectedIds,
                      })
                    }
                  >
                    <Group className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Group (⌘G)</TooltipContent>
              </Tooltip>
            )}
            {canUngroup && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-5 w-5"
                    onClick={() =>
                      dispatch({
                        type: "UNGROUP_ELEMENT",
                        payload: selectedIds[0],
                      })
                    }
                  >
                    <Ungroup className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Ungroup (⌘⇧G)</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayElements.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3">No elements yet</p>
        ) : (
          <Reorder.Group
            axis="y"
            values={displayElements}
            onReorder={handleReorder}
            className="p-1 space-y-0.5"
          >
            <AnimatePresence initial={false}>
              {displayElements.map((el) => (
                <LayerItem
                  key={el.id}
                  element={el}
                  isSelected={selectedIds.includes(el.id)}
                  selectedIds={selectedIds}
                  onSelect={(e) => {
                    if (e && (e.shiftKey || e.metaKey) && onMultiSelect) {
                      onMultiSelect(el.id);
                    } else {
                      onSelect(el.id);
                    }
                  }}
                  dispatch={dispatch}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
        {/* Background image layer (non-reorderable, always at bottom) */}
        {backgroundImageUrl && onRemoveBackgroundImage && (
          <div className="p-1 border-t">
            <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-md group hover:bg-muted/50">
              <Wallpaper className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs truncate flex-1 min-w-0 text-muted-foreground">
                Background Image
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => {
                        if (window.confirm("Remove background image?")) {
                          onRemoveBackgroundImage();
                        }
                      }}
                    >
                      <ImageOff className="h-2.5 w-2.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Remove Background Image
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LayerItem({
  element,
  isSelected,
  selectedIds,
  onSelect,
  dispatch,
}: {
  element: CanvasElement;
  isSelected: boolean;
  selectedIds: string[];
  onSelect: (e?: React.MouseEvent) => void;
  dispatch: React.Dispatch<CanvasAction>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = getElementIcon(element);
  const isGroup = element.type === "group";

  const handleDoubleClick = () => {
    setEditName(getElementDisplayName(element));
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      dispatch({
        type: "UPDATE_ELEMENT",
        payload: { id: element.id, name: trimmed },
      });
    }
    setIsEditing(false);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Reorder.Item
          value={element}
          className="flex flex-col"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className={cn(
              "flex items-center gap-1.5 px-1.5 py-1 rounded-md cursor-pointer group/item",
              "hover:bg-muted/50",
              isSelected && "bg-primary/10 ring-1 ring-primary/30",
            )}
            onClick={(e) => onSelect(e)}
            onDoubleClick={handleDoubleClick}
          >
            {/* Drag handle */}
            <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />

            {/* Expand/collapse for groups */}
            {isGroup ? (
              <button
                type="button"
                className="shrink-0 p-0 hover:text-foreground text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((v) => !v);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : null}

            {/* Type icon */}
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

            {/* Name */}
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-5 text-xs px-1 flex-1 min-w-0"
              />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs truncate flex-1 min-w-0">
                      {getElementDisplayName(element)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {getElementDisplayName(element)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Action buttons (visible on hover) */}
            <TooltipProvider>
              <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({
                          type: "DUPLICATE_ELEMENT",
                          payload: element.id,
                        });
                      }}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Duplicate</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-5 w-5 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Delete this element?")) {
                          dispatch({
                            type: "REMOVE_ELEMENT",
                            payload: element.id,
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Delete</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Group children (indented, non-interactive) */}
          {isGroup && isExpanded && element.type === "group" && (
            <div className="ml-6 border-l border-border/50 pl-1 space-y-0.5 py-0.5">
              {element.children.map((child) => {
                const ChildIcon = getElementIcon(child);
                return (
                  <div
                    key={child.id}
                    className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-muted-foreground"
                  >
                    <ChildIcon className="h-3 w-3 shrink-0" />
                    <span className="text-xs truncate flex-1 min-w-0">
                      {getElementDisplayName(child)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Reorder.Item>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleDoubleClick}>
          <Pencil className="h-3.5 w-3.5 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            dispatch({ type: "DUPLICATE_ELEMENT", payload: element.id })
          }
        >
          <Copy className="h-3.5 w-3.5 mr-2" />
          Duplicate
        </ContextMenuItem>
        {selectedIds.length >= 2 && isSelected && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() =>
                dispatch({ type: "GROUP_ELEMENTS", payload: selectedIds })
              }
            >
              <Group className="h-3.5 w-3.5 mr-2" />
              Group
            </ContextMenuItem>
          </>
        )}
        {isGroup && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() =>
                dispatch({ type: "UNGROUP_ELEMENT", payload: element.id })
              }
            >
              <Ungroup className="h-3.5 w-3.5 mr-2" />
              Ungroup
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            if (window.confirm("Delete this element?")) {
              dispatch({ type: "REMOVE_ELEMENT", payload: element.id });
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
