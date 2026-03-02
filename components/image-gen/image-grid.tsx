"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { deleteGeneratedImage } from "@/actions/image-projects";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Pencil } from "lucide-react";

interface GeneratedImage {
  id: string;
  projectId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  prompt: string | null;
  createdAt: string;
}

interface ImageGridProps {
  images: GeneratedImage[];
  projectId: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function ImageGrid({
  images,
  projectId,
  selectedIds,
  onToggleSelect,
}: ImageGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);

  // Responsive columns based on container width
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w < 400) setColumns(2);
        else if (w < 700) setColumns(3);
        else if (w < 1000) setColumns(4);
        else setColumns(5);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(images.length / columns);
  const GAP = 12;
  const ROW_HEIGHT = 280;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + GAP,
    overscan: 3,
  });

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    await deleteGeneratedImage(id);
  }, []);

  if (images.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No images generated yet</p>
        <p className="text-sm mt-1">
          Use the prompt bar below to generate images with AI
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-auto"
      style={{ contain: "strict" }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * columns;
          const rowImages = images.slice(startIdx, startIdx + columns);

          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 w-full px-4"
              style={{
                top: `${virtualRow.start}px`,
                height: `${virtualRow.size}px`,
              }}
            >
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${GAP}px`,
                }}
              >
                {rowImages.map((image) => {
                  const isSelected = selectedIds?.has(image.id) ?? false;
                  return (
                    <div
                      key={image.id}
                      className={`group relative rounded-lg overflow-hidden border bg-muted/30 cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-primary border-primary"
                          : "hover:border-foreground/20"
                      }`}
                      onClick={() => onToggleSelect?.(image.id)}
                    >
                      {/* Image */}
                      <div className="aspect-square w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.thumbnailUrl || image.imageUrl}
                          alt={image.prompt || "Generated image"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Selection checkbox */}
                      {onToggleSelect && (
                        <div
                          className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-opacity ${
                            isSelected
                              ? "bg-primary border-primary opacity-100"
                              : "border-white/70 bg-black/20 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-primary-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      )}

                      {/* Actions overlay */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/image-generation/project/${projectId}/image/${image.id}`}
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(image.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Prompt caption */}
                      {image.prompt && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white line-clamp-2">
                            {image.prompt}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
