"use client";

import { useCallback } from "react";
import type { CanvasElement } from "@/lib/canvas/types";
import { deepCloneElement } from "@/hooks/use-canvas-state";

const CLIPBOARD_KEY = "app-studio-clipboard";

export function useClipboard() {
  const copyElements = useCallback((elements: CanvasElement[]) => {
    if (elements.length === 0) return;
    try {
      localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(elements));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const pasteElements = useCallback((): CanvasElement[] => {
    try {
      const raw = localStorage.getItem(CLIPBOARD_KEY);
      if (!raw) return [];
      const elements = JSON.parse(raw) as CanvasElement[];
      return elements.map((el) => {
        const clone = deepCloneElement(el);
        clone.x = el.x + 20;
        clone.y = el.y + 20;
        if (el.name) clone.name = `${el.name} (copy)`;
        return clone;
      });
    } catch {
      return [];
    }
  }, []);

  const hasClipboard = useCallback((): boolean => {
    try {
      return !!localStorage.getItem(CLIPBOARD_KEY);
    } catch {
      return false;
    }
  }, []);

  return { copyElements, pasteElements, hasClipboard };
}
