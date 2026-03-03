"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type Konva from "konva";
import type { CanvasState } from "@/lib/canvas/types";
import { hideTransformers } from "@/lib/canvas/export-utils";
import {
  saveGeneratedImageCanvasState,
  saveGeneratedImageThumbnail,
} from "@/actions/image-projects";

export function useImageAutoSave(
  imageId: string,
  state: CanvasState,
  stageRef?: React.RefObject<Konva.Stage | null>,
  delay = 2000,
) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  const save = useCallback(async () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setIsSaving(true);
    setIsSaved(false);
    try {
      await saveGeneratedImageCanvasState(imageId, latestStateRef.current);
      if (stageRef?.current) {
        const restoreTransformers = hideTransformers(stageRef.current);
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 0.7 });
        restoreTransformers();
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `thumb-${imageId}.png`, {
          type: "image/png",
        });
        const formData = new FormData();
        formData.append("id", imageId);
        formData.append("file", file);
        await saveGeneratedImageThumbnail(formData);
      }
      setIsSaved(true);
      savedTimerRef.current = setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [imageId, stageRef]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSaving]);

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
