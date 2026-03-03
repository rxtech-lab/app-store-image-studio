"use client";

import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SvgEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  svgContent: string;
  onSave: (svgContent: string) => void;
}

export function SvgEditorDialog({
  open,
  onOpenChange,
  svgContent,
  onSave,
}: SvgEditorDialogProps) {
  const [value, setValue] = useState(svgContent);

  // Reset value when dialog opens with new content
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) setValue(svgContent);
      onOpenChange(nextOpen);
    },
    [svgContent, onOpenChange],
  );

  const handleSave = () => {
    onSave(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit SVG</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 min-h-0">
          {/* Editor */}
          <div className="flex-1 min-w-0 border rounded-lg overflow-hidden">
            <Editor
              height="400px"
              defaultLanguage="xml"
              value={value}
              onChange={(v) => setValue(v ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Live preview */}
          <div className="w-48 shrink-0 flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
            <div
              className="flex-1 border rounded-lg bg-muted/30 flex items-center justify-center p-2 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
