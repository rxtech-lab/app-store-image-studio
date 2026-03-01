"use client";

import Link from "next/link";
import { IMAGE_PRESETS, type PresetKey } from "@/lib/settings";
import { deleteSection } from "@/actions/sections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Smartphone,
  Tablet,
  Monitor,
  Settings2,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

interface SectionCardProps {
  section: {
    id: string;
    projectId: string;
    presetKey: string;
    customWidth: number | null;
    customHeight: number | null;
    order: number;
  };
  index?: number;
}

function getDeviceIcon(presetKey: string) {
  if (presetKey.startsWith("iphone")) return <Smartphone className="h-5 w-5" />;
  if (presetKey.startsWith("ipad")) return <Tablet className="h-5 w-5" />;
  if (presetKey === "custom") return <Settings2 className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function getDeviceCategory(presetKey: string) {
  if (presetKey.startsWith("iphone")) return "iPhone";
  if (presetKey.startsWith("ipad")) return "iPad";
  if (presetKey === "custom") return "Custom";
  return "Mac";
}

export function SectionCard({ section, index = 0 }: SectionCardProps) {
  const isCustom = section.presetKey === "custom";
  const preset = isCustom
    ? null
    : IMAGE_PRESETS[section.presetKey as PresetKey];
  const presetTitle = isCustom
    ? "Custom Size"
    : (preset?.title ?? section.presetKey);
  const width = isCustom ? section.customWidth : preset?.width;
  const height = isCustom ? section.customHeight : preset?.height;
  const category = getDeviceCategory(section.presetKey);
  const isLandscape = width && height ? width > height : false;

  return (
    <motion.div
      className="group relative rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all duration-200"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.1 + index * 0.06,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link
        href={`/appstore-marketing-image/project/${section.projectId}/section/${section.id}`}
        className="absolute inset-0 z-0 rounded-xl"
      />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground shrink-0">
              {getDeviceIcon(section.presetKey)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-medium">{presetTitle}</h3>
                <Badge variant="secondary" className="text-[11px] font-normal">
                  {category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {width && height ? `${width} × ${height}` : "Unknown"}
                </span>
                {isLandscape && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>Landscape</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/appstore-marketing-image/project/${section.projectId}/section/${section.id}`}
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
                        `Delete this "${presetTitle}" template? This cannot be undone.`,
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
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:text-muted-foreground transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
