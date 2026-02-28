"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type Konva from "konva";
import type { CanvasState } from "@/lib/canvas/types";
import { saveCanvasState, saveTemplateThumbnail } from "@/actions/templates";

export function useAutoSave(
  templateId: string,
  state: CanvasState,
  stageRef?: React.RefObject<Konva.Stage | null>,
  onThumbnailSaved?: (templateId: string, url: string) => void,
  onStateSaved?: (templateId: string, state: CanvasState) => void,
  delay = 2000,
) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef(state);
  latestStateRef.current = state;
  const onThumbnailSavedRef = useRef(onThumbnailSaved);
  onThumbnailSavedRef.current = onThumbnailSaved;
  const onStateSavedRef = useRef(onStateSaved);
  onStateSavedRef.current = onStateSaved;

  const save = useCallback(async () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setIsSaving(true);
    setIsSaved(false);
    const savedState = latestStateRef.current;
    try {
      await saveCanvasState(templateId, savedState);
      onStateSavedRef.current?.(templateId, savedState);
      if (stageRef?.current) {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 0.3 });
        const url = await saveTemplateThumbnail(templateId, dataUrl);
        onThumbnailSavedRef.current?.(templateId, url);
      }
      setIsSaved(true);
      savedTimerRef.current = setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [templateId, stageRef]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsSaved(false);
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state, save, delay]);

  return { saveNow: save, isSaving, isSaved };
}
