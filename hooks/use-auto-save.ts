"use client";

import { useEffect, useRef, useCallback } from "react";
import type { CanvasState } from "@/lib/canvas/types";
import { saveCanvasState } from "@/actions/templates";

export function useAutoSave(
  templateId: string,
  state: CanvasState,
  delay = 2000
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  const save = useCallback(async () => {
    await saveCanvasState(templateId, latestStateRef.current);
  }, [templateId]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state, save, delay]);

  return { saveNow: save };
}
