"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { uploadBackgroundImage } from "@/actions/templates";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  Send,
  Square,
  X,
  Trash2,
  Check,
  RefreshCw,
  ImagePlus,
} from "lucide-react";

interface AttachedImage {
  id: string;
  preview: string;
  url: string | null; // null while uploading
}

interface AiPromptBarProps {
  onSend: (prompt: string, imageUrls?: string[]) => void;
  onStop?: () => void;
  onClearHistory?: () => void;
  isLoading: boolean;
  statusText?: string;
  aiText?: string;
  hasHistory?: boolean;
  conceptImage?: string | null;
  onConfirmConcept?: () => void;
  onRegenConcept?: () => void;
}

export function AiPromptBar({
  onSend,
  onStop,
  onClearHistory,
  isLoading,
  statusText,
  aiText,
  hasHistory,
  conceptImage,
  onConfirmConcept,
  onRegenConcept,
}: AiPromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [lastSentPrompt, setLastSentPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const newImages: AttachedImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      url: null,
    }));
    setAttachedImages((prev) => [...prev, ...newImages]);

    await Promise.all(
      files.map(async (file, i) => {
        const formData = new FormData();
        formData.append("file", file);
        const url = await uploadBackgroundImage(formData);
        setAttachedImages((prev) =>
          prev.map((img) =>
            img.id === newImages[i].id ? { ...img, url } : img,
          ),
        );
      }),
    );
  }, []);

  const removeImage = useCallback((id: string) => {
    setAttachedImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const allUploaded = attachedImages.every((img) => img.url !== null);

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading || !allUploaded) return;
    const urls = attachedImages
      .map((img) => img.url)
      .filter((u): u is string => u !== null);
    setLastSentPrompt(prompt.trim());
    onSend(prompt.trim(), urls.length > 0 ? urls : undefined);
    setPrompt("");
    attachedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setAttachedImages([]);
  };

  const handleClose = () => {
    if (isLoading) {
      onStop?.();
    }
    setExpanded(false);
    setPrompt("");
    setLastSentPrompt("");
    attachedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setAttachedImages([]);
  };

  const handleStop = () => {
    onStop?.();
  };

  if (!expanded) {
    return (
      <Button
        variant="default"
        size="sm"
        className="gap-2 transition-all duration-300 ease-out w-42 py-4 bg-white text-black border border-gray-300 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        onClick={() => setExpanded(true)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isLoading ? "Editing..." : "AI Edit"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 bg-card border rounded-xl px-4 py-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-2xl">
      {/* Concept preview */}
      {conceptImage && (
        <div className="flex items-center gap-3 animate-in fade-in duration-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={conceptImage}
            alt="Icon concept"
            className="w-20 h-20 rounded-lg border object-contain shrink-0"
          />
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs font-medium text-muted-foreground">
              Concept preview
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={onRegenConcept}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Regen
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={onConfirmConcept}
              >
                <Check className="h-3 w-3 mr-1" />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* User's sent prompt */}
      <AnimatePresence>
        {lastSentPrompt && isLoading && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-foreground font-medium leading-relaxed"
          >
            {lastSentPrompt}
          </motion.p>
        )}
      </AnimatePresence>
      {/* Tool status labels */}
      <AnimatePresence>
        {statusText && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {statusText}
          </motion.p>
        )}
      </AnimatePresence>
      {/* AI text response rendered as markdown chunks */}
      <AnimatePresence>
        {aiText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-h-48 overflow-y-auto text-xs text-foreground leading-relaxed prose prose-xs prose-neutral dark:prose-invert [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5"
          >
            {aiText.split(/\n\n+/).map((chunk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.08 }}
              >
                <Markdown>{chunk}</Markdown>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Attached image previews */}
      {attachedImages.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {attachedImages.map((img) => (
            <div key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt="Attached"
                className="w-14 h-14 rounded-lg border object-cover"
              />
              {img.url === null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Input row */}
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0" />
        <input
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") handleClose();
          }}
          onPaste={(e) => {
            const imageFiles = Array.from(e.clipboardData.items)
              .filter((item) => item.type.startsWith("image/"))
              .map((item) => item.getAsFile())
              .filter((f): f is File => f !== null);
            if (imageFiles.length > 0) {
              e.preventDefault();
              handleFiles(imageFiles);
            }
          }}
          placeholder="Describe changes... e.g. 'Add headline: Download Now, blue gradient background'"
          className="flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground w-96"
          disabled={isLoading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />
        {!isLoading && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 shrink-0"
            title="Attach images"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
        )}
        {isLoading ? (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleStop}
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            title="Stop generation"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!prompt.trim() || !allUploaded}
            className="h-8 w-8 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
        {hasHistory && !isLoading && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onClearHistory}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleClose}
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
