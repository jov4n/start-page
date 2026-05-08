import { memo, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Minus, Square, X } from "lucide-react";
import { APPS } from "../apps/registry";
import { APP_COMPONENTS } from "../apps/components";
import {
  WAYBAR_HEIGHT_PX,
  boundsForSnap,
  snapHitFromPointer,
  tiledViewport,
} from "../lib/window-layout";
import { useStore } from "../store";

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface Props {
  id: string;
}

function WindowImpl({ id }: Props) {
  // Each window subscribes only to its own slice + a couple flags.
  const win = useStore((s) => s.windows.find((w) => w.id === id));
  const isFocused = useStore((s) => s.focusedId === id);
  const gap = useStore((s) => s.settings.windowGap);

  const focusWindow = useStore((s) => s.focusWindow);
  const closeWindow = useStore((s) => s.closeWindow);
  const minimizeWindow = useStore((s) => s.minimizeWindow);
  const toggleMaximize = useStore((s) => s.toggleMaximize);
  const snapWindow = useStore((s) => s.snapWindow);
  const moveWindow = useStore((s) => s.moveWindow);
  const resizeWindow = useStore((s) => s.resizeWindow);

  const ref = useRef<HTMLDivElement>(null);
  const [snapPreview, setSnapPreview] = useState<null | {
    x: number;
    y: number;
    w: number;
    h: number;
  }>(null);

  if (!win) return null;
  const meta = APPS[win.appId];
  const Body = APP_COMPONENTS[win.appId];

  const topPad = WAYBAR_HEIGHT_PX + gap;
  const settingsGap = { windowGap: gap };

  function onTitleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0 || !win) return;
    e.preventDefault();
    focusWindow(win.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWX = win.x;
    const startWY = win.y;
    const wasMaximized = win.maximized;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (wasMaximized) toggleMaximize(win.id);

      const nx = Math.max(-win.w + 80, startWX + dx);
      const ny = Math.max(topPad, startWY + dy);

      const hit = snapHitFromPointer(ev.clientX, ev.clientY);
      let preview: typeof snapPreview = null;
      if (hit === "max") {
        const tv = tiledViewport(settingsGap);
        preview = {
          x: gap,
          y: tv.top,
          w: tv.vw - gap * 2,
          h: tv.innerH,
        };
      } else if (hit) {
        preview = boundsForSnap(hit, settingsGap);
      }
      setSnapPreview(preview);

      moveWindow(win.id, nx, ny);
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const hit = snapHitFromPointer(ev.clientX, ev.clientY);
      if (hit === "max") {
        const cur = useStore.getState().windows.find((w) => w.id === win.id);
        if (cur && !cur.maximized) toggleMaximize(win.id);
      } else if (hit) {
        snapWindow(win.id, hit);
      }
      setSnapPreview(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onResizeMouseDown(e: React.MouseEvent, dir: ResizeDir) {
    if (e.button !== 0 || !win) return;
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { x: win.x, y: win.y, w: win.w, h: win.h };
    const minW = meta.minSize?.w ?? 280;
    const minH = meta.minSize?.h ?? 200;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { x, y, w, h } = start;
      if (dir.includes("e")) w = Math.max(minW, start.w + dx);
      if (dir.includes("s")) h = Math.max(minH, start.h + dy);
      if (dir.includes("w")) {
        const nw = Math.max(minW, start.w - dx);
        x = start.x + (start.w - nw);
        w = nw;
      }
      if (dir.includes("n")) {
        const nh = Math.max(minH, start.h - dy);
        y = Math.max(topPad, start.y + (start.h - nh));
        h = nh;
      }
      resizeWindow(win.id, { x, y, w, h });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const showResize = meta.resizable !== false;

  return (
    <>
      {snapPreview && (
        <div
          className="fixed pointer-events-none z-[85] rounded-2xl border-2 border-accent/60 bg-accent/8 backdrop-blur-sm transition-all duration-100"
          style={{
            left: snapPreview.x,
            top: snapPreview.y,
            width: snapPreview.w,
            height: snapPreview.h,
          }}
        />
      )}
      <motion.div
        ref={ref}
        data-window
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: win.minimized ? 0 : 1,
          scale: win.minimized ? 0.85 : 1,
        }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.16, ease: [0.05, 0.9, 0.1, 1.05] }}
        className={clsx(
          "absolute glass-strong rounded-2xl overflow-hidden flex flex-col window-shadow pointer-events-auto",
          isFocused ? "hypr-border" : "hypr-border-soft",
          win.minimized && "pointer-events-none"
        )}
        style={{
          left: win.x,
          top: win.y,
          width: win.w,
          height: win.h,
          zIndex: win.z,
        }}
        onMouseDown={() => focusWindow(win.id)}
      >
        {/* Title bar */}
        <div
          onMouseDown={onTitleMouseDown}
          onDoubleClick={() => toggleMaximize(win.id)}
          className={clsx(
            "h-9 flex items-center px-3 gap-2 no-select cursor-grab active:cursor-grabbing border-b transition-colors",
            isFocused
              ? "bg-mantle/70 border-white/5"
              : "bg-mantle/40 border-transparent"
          )}
        >
          <div className="flex items-center gap-1.5">
            <TrafficButton variant="close" onClick={() => closeWindow(win.id)} />
            <TrafficButton variant="min" onClick={() => minimizeWindow(win.id)} />
            <TrafficButton variant="max" onClick={() => toggleMaximize(win.id)} />
          </div>
          <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
            <meta.icon
              size={11}
              className={isFocused ? "text-accent" : "text-muted"}
              strokeWidth={1.8}
            />
            <span
              className={clsx(
                "text-[11px] font-mono tracking-wide truncate",
                isFocused ? "text-text" : "text-muted"
              )}
            >
              {win.title}
            </span>
          </div>
          <div className="w-[68px]" />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden relative bg-base/40">
          {!win.minimized ? <Body /> : null}
        </div>

        {showResize && !win.maximized && (
          <>
            <div className="resize-handle resize-n" onMouseDown={(e) => onResizeMouseDown(e, "n")} />
            <div className="resize-handle resize-s" onMouseDown={(e) => onResizeMouseDown(e, "s")} />
            <div className="resize-handle resize-e" onMouseDown={(e) => onResizeMouseDown(e, "e")} />
            <div className="resize-handle resize-w" onMouseDown={(e) => onResizeMouseDown(e, "w")} />
            <div className="resize-handle resize-ne" onMouseDown={(e) => onResizeMouseDown(e, "ne")} />
            <div className="resize-handle resize-nw" onMouseDown={(e) => onResizeMouseDown(e, "nw")} />
            <div className="resize-handle resize-se" onMouseDown={(e) => onResizeMouseDown(e, "se")} />
            <div className="resize-handle resize-sw" onMouseDown={(e) => onResizeMouseDown(e, "sw")} />
          </>
        )}
      </motion.div>
    </>
  );
}

export const Window = memo(WindowImpl);

function TrafficButton({
  variant,
  onClick,
}: {
  variant: "close" | "min" | "max";
  onClick: () => void;
}) {
  const colors = {
    close: "bg-[#f38ba8] hover:brightness-110",
    min: "bg-[#f9e2af] hover:brightness-110",
    max: "bg-[#a6e3a1] hover:brightness-110",
  };
  const Icon = variant === "close" ? X : variant === "min" ? Minus : Square;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={clsx(
        "w-3 h-3 rounded-full flex items-center justify-center transition group",
        colors[variant]
      )}
    >
      <Icon
        size={8}
        className="opacity-0 group-hover:opacity-100 text-black/70"
        strokeWidth={3}
      />
    </button>
  );
}
