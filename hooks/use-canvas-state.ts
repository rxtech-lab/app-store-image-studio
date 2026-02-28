"use client";

import { useReducer, useCallback, useRef } from "react";
import type {
  CanvasState,
  CanvasAction,
  CanvasElement,
} from "@/lib/canvas/types";
import { nanoid } from "nanoid";

const HISTORY_LIMIT = 50;

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload;

    case "SET_BACKGROUND_COLOR":
      return { ...state, backgroundColor: action.payload };

    case "SET_BACKGROUND_IMAGE":
      return { ...state, backgroundImageUrl: action.payload };

    case "ADD_ELEMENT":
      return { ...state, elements: [...state.elements, action.payload] };

    case "UPDATE_ELEMENT": {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as CanvasElement) : el,
        ),
      };
    }

    case "REMOVE_ELEMENT":
      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.payload),
      };

    case "REORDER_ELEMENT": {
      const { id, direction } = action.payload;
      const idx = state.elements.findIndex((el) => el.id === id);
      if (idx === -1) return state;
      const newIdx = direction === "up" ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= state.elements.length) return state;
      const elements = [...state.elements];
      [elements[idx], elements[newIdx]] = [elements[newIdx], elements[idx]];
      return { ...state, elements };
    }

    case "SET_ELEMENTS":
      return { ...state, elements: action.payload };

    case "DUPLICATE_ELEMENT": {
      const idx = state.elements.findIndex((el) => el.id === action.payload);
      if (idx === -1) return state;
      const original = state.elements[idx];
      const clone = {
        ...original,
        id: nanoid(),
        x: original.x + 20,
        y: original.y + 20,
        name: original.name ? `${original.name} (copy)` : undefined,
      } as CanvasElement;
      const elements = [...state.elements];
      elements.splice(idx + 1, 0, clone);
      return { ...state, elements };
    }

    default:
      return state;
  }
}

export function useCanvasState(initialState: CanvasState) {
  const [state, rawDispatch] = useReducer(canvasReducer, initialState);
  const historyRef = useRef<CanvasState[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatch = useCallback((action: CanvasAction) => {
    // Don't record SET_STATE in history (used for template switching and undo itself)
    if (action.type !== "SET_STATE") {
      historyRef.current = [
        ...historyRef.current.slice(-HISTORY_LIMIT + 1),
        stateRef.current,
      ];
    }
    rawDispatch(action);
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const previous = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    rawDispatch({ type: "SET_STATE", payload: previous });
  }, []);

  const addText = useCallback(() => {
    dispatch({
      type: "ADD_ELEMENT",
      payload: {
        id: nanoid(),
        type: "text",
        text: "Your Text Here",
        fontSize: 100,
        fontFamily: "Arial",
        fontWeight: "bold",
        fontStyle: "normal",
        fill: "#ffffff",
        align: "center",
        lineHeight: 1.2,
        x: state.width / 2 - state.width * 0.4,
        y: 100,
        width: state.width * 0.8,
        height: 100,
        rotation: 0,
      },
    });
  }, [state.width]);

  const addAccent = useCallback(
    (shape: "rect" | "circle" | "roundedRect" = "roundedRect") => {
      dispatch({
        type: "ADD_ELEMENT",
        payload: {
          id: nanoid(),
          type: "accent",
          shape,
          fill: "#ffffff20",
          cornerRadius: shape === "roundedRect" ? 20 : 0,
          x: state.width / 2 - 100,
          y: state.height / 2 - 100,
          width: 200,
          height: 200,
          rotation: 0,
        },
      });
    },
    [state.width, state.height],
  );

  const addScreenshot = useCallback(
    (imageUrl: string, width: number, height: number) => {
      // Scale to fit within canvas with some padding
      const maxW = state.width * 0.6;
      const maxH = state.height * 0.6;
      const scale = Math.min(maxW / width, maxH / height, 1);
      const scaledW = width * scale;
      const scaledH = height * scale;

      dispatch({
        type: "ADD_ELEMENT",
        payload: {
          id: nanoid(),
          type: "screenshot",
          imageUrl,
          x: (state.width - scaledW) / 2,
          y: (state.height - scaledH) / 2,
          width: scaledW,
          height: scaledH,
          rotation: 0,
          cornerRadius: 20,
          shadowEnabled: true,
          shadowColor: "#00000040",
          shadowBlur: 20,
          shadowOffsetX: 0,
          shadowOffsetY: 10,
        },
      });
    },
    [state.width, state.height],
  );

  return {
    state,
    dispatch,
    undo,
    addText,
    addAccent,
    addScreenshot,
  };
}
