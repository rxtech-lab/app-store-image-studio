"use client";

import { useState } from "react";
import { createSection } from "@/actions/sections";
import { type PresetKey } from "@/lib/settings";
import { PresetSelector } from "./preset-selector";
import { Button } from "@/components/ui/button";
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

interface CreateSectionDialogProps {
  projectId: string;
}

export function CreateSectionDialog({ projectId }: CreateSectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PresetKey>("iphone-6.7");

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add Screenshot Section</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-4">
          <PresetSelector value={preset} onValueChange={setPreset} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await createSection(projectId, preset);
              setOpen(false);
            }}
          >
            Create
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
