"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Image,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import type {
  CanvasState,
  CanvasElement,
  ScreenshotElement,
  TextElement,
  AccentElement,
  ImageElement,
  CanvasAction,
} from "@/lib/canvas/types";

interface Screenshot {
  id: string;
  imageUrl: string;
  originalFilename: string;
}

interface CanvasEditorProps {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  screenshots?: Screenshot[];
}

function useContainerSize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 700 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
}

function useImage(url?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);
  return image;
}

function ScreenshotNode({
  el,
  isSelected,
  onSelect,
  onChange,
  onContextMenu,
}: {
  el: ScreenshotElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<ScreenshotElement>) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
}) {
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const image = useImage(el.imageUrl);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Image
        ref={shapeRef}
        image={image ?? undefined}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        rotation={el.rotation}
        cornerRadius={el.cornerRadius}
        shadowEnabled={el.shadowEnabled}
        shadowColor={el.shadowColor}
        shadowBlur={el.shadowBlur}
        shadowOffsetX={el.shadowOffsetX}
        shadowOffsetY={el.shadowOffsetY}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={onContextMenu}
        onDragEnd={(e) => {
          onChange({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled />}
    </>
  );
}

function TextNode({
  el,
  isSelected,
  onSelect,
  onChange,
}: {
  el: TextElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<TextElement>) => void;
}) {
  const shapeRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
        ref={shapeRef}
        text={el.text}
        fontSize={el.fontSize}
        fontFamily={el.fontFamily}
        fontStyle={
          [
            el.fontWeight &&
            el.fontWeight !== "normal" &&
            el.fontWeight !== "regular" &&
            el.fontWeight !== "400"
              ? el.fontWeight
              : "",
            el.fontStyle && el.fontStyle !== "normal" ? el.fontStyle : "",
          ]
            .filter(Boolean)
            .join(" ") || "normal"
        }
        fill={el.fill}
        align={el.align}
        lineHeight={el.lineHeight}
        x={el.x}
        y={el.y}
        width={el.width}
        rotation={el.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            rotation: node.rotation(),
          });
        }}
        onDblClick={() => {
          // Enable inline text editing
          const textNode = shapeRef.current!;
          const stage = textNode.getStage()!;
          const content = stage.getContent();
          const textPosition = textNode.absolutePosition();
          const scale = stage.scaleX();

          const textarea = document.createElement("textarea");
          content.appendChild(textarea);

          textarea.value = el.text;
          textarea.style.position = "absolute";
          textarea.style.top = `${textPosition.y}px`;
          textarea.style.left = `${textPosition.x}px`;
          textarea.style.width = `${textNode.width() * scale}px`;
          textarea.style.minHeight = `${textNode.height() * scale}px`;
          textarea.style.fontSize = `${el.fontSize * scale}px`;
          textarea.style.border = "2px solid #3b82f6";
          textarea.style.borderRadius = "2px";
          textarea.style.padding = "0px";
          textarea.style.margin = "0px";
          textarea.style.overflow = "hidden";
          textarea.style.background = "transparent";
          textarea.style.outline = "none";
          textarea.style.resize = "none";
          textarea.style.color = el.fill;
          textarea.style.fontFamily = el.fontFamily;
          textarea.style.fontWeight = el.fontWeight ?? "normal";
          textarea.style.fontStyle = el.fontStyle ?? "normal";
          textarea.style.zIndex = "1000";
          textarea.style.lineHeight = String(el.lineHeight);
          textarea.style.textAlign = el.align;
          textarea.focus();

          textNode.hide();
          trRef.current?.hide();

          const handleOutsideClick = (e: Event) => {
            if (e.target !== textarea) {
              onChange({ text: textarea.value });
              textarea.remove();
              textNode.show();
              trRef.current?.show();
              window.removeEventListener("click", handleOutsideClick);
            }
          };
          textarea.addEventListener("keydown", (e) => {
            if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
              onChange({ text: textarea.value });
              textarea.remove();
              textNode.show();
              trRef.current?.show();
              window.removeEventListener("click", handleOutsideClick);
            }
          });
          setTimeout(() =>
            window.addEventListener("click", handleOutsideClick),
          );
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={["middle-left", "middle-right"]}
        />
      )}
    </>
  );
}

function ImageNode({
  el,
  isSelected,
  onSelect,
  onChange,
}: {
  el: ImageElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<ImageElement>) => void;
}) {
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const image = useImage(el.imageUrl);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Image
        ref={shapeRef}
        image={image ?? undefined}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        rotation={el.rotation}
        opacity={el.opacity}
        cornerRadius={el.cornerRadius}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled />}
    </>
  );
}

function AccentNode({
  el,
  isSelected,
  onSelect,
  onChange,
}: {
  el: AccentElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<AccentElement>) => void;
}) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const ShapeComponent = el.shape === "circle" ? Circle : Rect;
  const shapeProps =
    el.shape === "circle"
      ? {
          x: el.x + el.width / 2,
          y: el.y + el.height / 2,
          radiusX: el.width / 2,
          radiusY: el.height / 2,
        }
      : {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          cornerRadius: el.cornerRadius,
        };

  return (
    <>
      <ShapeComponent
        ref={shapeRef as React.RefObject<never>}
        fill={el.fill}
        rotation={el.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          onChange({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(10, node.width() * scaleX),
            height: Math.max(10, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
        {...shapeProps}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled />}
    </>
  );
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  elementId: string;
}

export function CanvasEditor({
  state,
  dispatch,
  selectedId,
  onSelect,
  stageRef,
  screenshots = [],
}: CanvasEditorProps) {
  const bgImage = useImage(state.backgroundImageUrl);
  const { containerRef, size: containerSize } = useContainerSize();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    window.addEventListener("click", handleClose);
    window.addEventListener("scroll", handleClose, true);
    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("scroll", handleClose, true);
    };
  }, [contextMenu]);

  const handleScreenshotContextMenu = useCallback(
    (elementId: string, e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      if (screenshots.length === 0) return;

      // Get the container's bounding rect to position the menu
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.evt.clientX - rect.left;
      const y = e.evt.clientY - rect.top;

      onSelect(elementId);
      setContextMenu({ visible: true, x, y, elementId });
    },
    [screenshots, containerRef, onSelect],
  );

  const handleReplaceScreenshot = useCallback(
    (imageUrl: string) => {
      if (!contextMenu) return;
      const img = new window.Image();
      img.src = imageUrl;
      img.onload = () => {
        dispatch({
          type: "UPDATE_ELEMENT",
          payload: {
            id: contextMenu.elementId,
            imageUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
          },
        });
      };
      setContextMenu(null);
    },
    [contextMenu, dispatch],
  );

  // Padding inside the container
  const padding = 32;
  const availableWidth = Math.max(100, containerSize.width - padding * 2);
  const availableHeight = Math.max(100, containerSize.height - padding * 2);

  const scale = Math.min(
    availableWidth / state.width,
    availableHeight / state.height,
    1,
  );

  const handleChange = useCallback(
    (id: string, attrs: Partial<CanvasElement>) => {
      dispatch({ type: "UPDATE_ELEMENT", payload: { id, ...attrs } });
    },
    [dispatch],
  );

  const handleStageClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (e.target === e.target.getStage()) {
      onSelect(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative"
    >
      <div
        className="border rounded-lg overflow-hidden inline-block"
        style={{
          width: state.width * scale,
          height: state.height * scale,
          ...(state.backgroundColor === "transparent"
            ? {
                backgroundImage:
                  "repeating-conic-gradient(#d0d0d0 0% 25%, #fff 0% 50%)",
                backgroundSize: `${20 * scale}px ${20 * scale}px`,
              }
            : { background: "var(--color-muted)" }),
        }}
      >
        <Stage
          ref={stageRef}
          width={state.width * scale}
          height={state.height * scale}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Background */}
            {state.backgroundColor !== "transparent" && (
              <Rect
                x={0}
                y={0}
                width={state.width}
                height={state.height}
                fill={state.backgroundColor}
              />
            )}
            {bgImage && (
              <Image
                image={bgImage}
                x={0}
                y={0}
                width={state.width}
                height={state.height}
              />
            )}

            {/* Elements */}
            {state.elements.map((el) => {
              switch (el.type) {
                case "screenshot":
                  return (
                    <ScreenshotNode
                      key={el.id}
                      el={el}
                      isSelected={selectedId === el.id}
                      onSelect={() => onSelect(el.id)}
                      onChange={(attrs) => handleChange(el.id, attrs)}
                      onContextMenu={(e) =>
                        handleScreenshotContextMenu(el.id, e)
                      }
                    />
                  );
                case "text":
                  return (
                    <TextNode
                      key={el.id}
                      el={el}
                      isSelected={selectedId === el.id}
                      onSelect={() => onSelect(el.id)}
                      onChange={(attrs) => handleChange(el.id, attrs)}
                    />
                  );
                case "accent":
                  return (
                    <AccentNode
                      key={el.id}
                      el={el}
                      isSelected={selectedId === el.id}
                      onSelect={() => onSelect(el.id)}
                      onChange={(attrs) => handleChange(el.id, attrs)}
                    />
                  );
                case "image":
                  return (
                    <ImageNode
                      key={el.id}
                      el={el}
                      isSelected={selectedId === el.id}
                      onSelect={() => onSelect(el.id)}
                      onChange={(attrs) => handleChange(el.id, attrs)}
                    />
                  );
              }
            })}
          </Layer>
        </Stage>
      </div>

      {/* Screenshot context menu */}
      {contextMenu && contextMenu.visible && screenshots.length > 0 && (
        <div
          ref={menuRef}
          className="absolute z-50 min-w-50 max-w-70 max-h-80 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Replace screenshot
          </div>
          {screenshots.map((s) => (
            <button
              key={s.id}
              type="button"
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleReplaceScreenshot(s.imageUrl);
              }}
            >
              <div className="w-8 h-14 rounded border overflow-hidden bg-muted shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.imageUrl}
                  alt={s.originalFilename}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="truncate text-xs">{s.originalFilename}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
