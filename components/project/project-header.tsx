"use client";

import { useState, useTransition } from "react";
import { updateProjectData } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

interface ProjectHeaderProps {
  projectId: string;
  name: string;
  description?: string | null;
}

export function ProjectHeader({
  projectId,
  name,
  description,
}: ProjectHeaderProps) {
  const [open, setOpen] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [descValue, setDescValue] = useState(description ?? "");
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setNameValue(name);
    setDescValue(description ?? "");
    setOpen(true);
  }

  function handleSave() {
    if (!nameValue.trim()) return;
    startTransition(async () => {
      await updateProjectData(
        projectId,
        nameValue.trim(),
        descValue.trim() || null,
      );
      setOpen(false);
    });
  }

  return (
    <>
      <div className="flex items-start gap-2 group">
        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 opacity-0 group-hover:opacity-100 h-7 w-7 p-0"
          onClick={handleOpen}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder="Project name"
                autoFocus
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Textarea
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                placeholder="Describe your app…"
                className="resize-none"
                rows={3}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !nameValue.trim()}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
