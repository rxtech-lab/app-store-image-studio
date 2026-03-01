"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIconProject } from "@/actions/icon-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";

export function CreateIconProjectDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Icon Project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Icon Project</AlertDialogTitle>
        </AlertDialogHeader>
        <form
          action={async (formData) => {
            const project = await createIconProject(formData);
            setOpen(false);
            router.push(`/icon-generation/project/${project.id}`);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="icon-name">Project Name</Label>
            <Input
              id="icon-name"
              name="name"
              required
              placeholder="My App Icon"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon-description">Description (optional)</Label>
            <Textarea
              id="icon-description"
              name="description"
              placeholder="Icon for my app..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon-size">Canvas Size (px)</Label>
            <Input
              id="icon-size"
              name="size"
              type="number"
              defaultValue={1024}
              min={16}
              max={4096}
            />
            <p className="text-xs text-muted-foreground">
              Square canvas (e.g. 1024 = 1024x1024px). Standard icon size is
              1024.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit">Create</AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
