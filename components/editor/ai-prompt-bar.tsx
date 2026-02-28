"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Send, Square, X, Trash2 } from "lucide-react";

interface AiPromptBarProps {
  onSend: (prompt: string) => void;
  onStop?: () => void;
  onClearHistory?: () => void;
  isLoading: boolean;
  statusText?: string;
  hasHistory?: boolean;
}

export function AiPromptBar({
  onSend,
  onStop,
  onClearHistory,
  isLoading,
  statusText,
  hasHistory,
}: AiPromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleClose = () => {
    if (isLoading) {
      onStop?.();
    }
    setExpanded(false);
    setPrompt("");
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
      {/* Response text */}
      {statusText && (
        <p className="text-xs text-muted-foreground leading-relaxed animate-in fade-in duration-200">
          {statusText}
        </p>
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
          placeholder="Describe changes... e.g. 'Add headline: Download Now, blue gradient background'"
          className="flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground w-96"
          disabled={isLoading}
        />
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
            disabled={!prompt.trim()}
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
