"use client";

import type {
  CanvasElement,
  CanvasAction,
  TextElement,
} from "@/lib/canvas/types";
import { TextControls } from "./text-controls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface ElementPropertiesProps {
  element: CanvasElement;
  dispatch: React.Dispatch<CanvasAction>;
}

export function ElementProperties({ element, dispatch }: ElementPropertiesProps) {
  const update = (attrs: Partial<CanvasElement>) => {
    dispatch({ type: "UPDATE_ELEMENT", payload: { id: element.id, ...attrs } });
  };

  return (
    <div className="space-y-4 p-3 border rounded-lg bg-card/95 backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm capitalize">{element.type}</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() =>
              dispatch({
                type: "REORDER_ELEMENT",
                payload: { id: element.id, direction: "up" },
              })
            }
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() =>
              dispatch({
                type: "REORDER_ELEMENT",
                payload: { id: element.id, direction: "down" },
              })
            }
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive"
            onClick={() =>
              dispatch({ type: "REMOVE_ELEMENT", payload: element.id })
            }
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">X</Label>
          <Input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => update({ x: Number(e.target.value) })}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Y</Label>
          <Input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) => update({ y: Number(e.target.value) })}
            className="h-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Width</Label>
          <Input
            type="number"
            value={Math.round(element.width)}
            onChange={(e) => update({ width: Number(e.target.value) })}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Height</Label>
          <Input
            type="number"
            value={Math.round(element.height)}
            onChange={(e) => update({ height: Number(e.target.value) })}
            className="h-8"
          />
        </div>
      </div>

      {/* Type-specific controls */}
      {element.type === "text" && (
        <TextControls
          element={element as TextElement}
          onChange={(attrs) => update(attrs)}
        />
      )}

      {element.type === "accent" && (
        <div className="space-y-1">
          <Label className="text-xs">Fill Color</Label>
          <Input
            type="color"
            value={element.fill.replace(/[0-9a-f]{2}$/i, "") || element.fill}
            onChange={(e) => update({ fill: e.target.value })}
            className="w-full h-8 p-0.5 cursor-pointer"
          />
        </div>
      )}

      {element.type === "screenshot" && (
        <div className="space-y-1">
          <Label className="text-xs">Corner Radius</Label>
          <Input
            type="number"
            value={element.cornerRadius}
            onChange={(e) => update({ cornerRadius: Number(e.target.value) })}
            className="h-8"
            min={0}
          />
        </div>
      )}
    </div>
  );
}
