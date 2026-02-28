"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

interface Screenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

interface ScreenshotsDialogProps {
  screenshots: Screenshot[];
  onAdd: (imageUrl: string, width: number, height: number) => void;
}

export function ScreenshotsDialog({
  screenshots,
  onAdd,
}: ScreenshotsDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (s: Screenshot) => {
    const img = new window.Image();
    img.src = s.imageUrl;
    img.onload = () => {
      onAdd(s.imageUrl, img.naturalWidth, img.naturalHeight);
      setOpen(false);
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">
          <ImageIcon className="mr-1 h-3.5 w-3.5" />
          Screenshots ({screenshots.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Screenshots</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {screenshots.map((s) => (
            <button
              key={s.id}
              type="button"
              className="group flex flex-col gap-1.5 rounded-lg border p-2 text-left hover:bg-accent transition-colors cursor-pointer"
              onClick={() => handleSelect(s)}
            >
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.imageUrl}
                  alt={s.originalFilename}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-xs text-muted-foreground truncate w-full">
                {s.originalFilename}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
