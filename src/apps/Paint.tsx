import { useMemo, useRef, type ComponentType } from "react";
import {
  Download,
  FolderOpen,
  ImageIcon,
} from "lucide-react";
import * as ToastUIModule from "@toast-ui/react-image-editor";
import "tui-image-editor/dist/tui-image-editor.css";

/** CJS bundle often surfaces as `{ default: Ctor }` or nested default — unwrap for React 19 / Vite. */
function resolveToastImageEditor(): ComponentType<Record<string, unknown>> {
  const mod = ToastUIModule as unknown as { default?: unknown };
  let Comp: unknown = mod.default ?? ToastUIModule;
  if (Comp && typeof Comp === "object" && "default" in (Comp as object)) {
    Comp = (Comp as { default: unknown }).default;
  }
  if (typeof Comp !== "function") {
    throw new Error("@toast-ui/react-image-editor: invalid export (expected component)");
  }
  return Comp as ComponentType<Record<string, unknown>>;
}

const ToastImageEditor = resolveToastImageEditor();

/** Wrapper exposes `getInstance()` → tui ImageEditor API */
type ToastEditorWrapper = {
  getInstance(): {
    loadImageFromURL(url: string, name?: string): Promise<unknown>;
    toDataURL(opts?: { format?: string; quality?: number }): string;
  };
};

function useBlankCanvasDataUrl(): string {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = "#2a2738";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = 0; x <= c.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, c.height);
      ctx.stroke();
    }
    for (let y = 0; y <= c.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y);
      ctx.stroke();
    }
    return c.toDataURL("image/png");
  }, []);
}

export function PaintApp() {
  const blank = useBlankCanvasDataUrl();
  const wrapperRef = useRef<ToastEditorWrapper | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function instance() {
    return wrapperRef.current?.getInstance() ?? null;
  }

  function downloadPng() {
    const ed = instance();
    if (!ed) return;
    const dataUrl = ed.toDataURL({ format: "png", quality: 1 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `hyprstart-paint-${Date.now()}.png`;
    a.click();
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      void instance()?.loadImageFromURL(url, f.name.replace(/\.[^/.]+$/, "") || "Image");
    };
    reader.readAsDataURL(f);
  }

  if (!blank) {
    return (
      <div className="h-full flex items-center justify-center bg-mantle/60 text-muted text-sm">
        Initializing canvas…
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-mantle/60 min-h-0">
      <div className="h-9 px-2 flex items-center gap-1 border-b border-line/40 bg-base/30 shrink-0">
        <ImageIcon size={14} className="text-accent ml-1 mr-1.5" />
        <span className="text-sm text-text font-mono">Paint</span>
        <span className="text-[10px] text-muted truncate max-w-[200px] ml-1 hidden sm:inline">
          Toast UI · runs locally in your browser
        </span>
        <div className="flex-1" />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />
        <button
          type="button"
          title="Open image"
          onClick={() => fileRef.current?.click()}
          className="p-1 rounded hover:bg-surface/60 text-subtext"
        >
          <FolderOpen size={13} />
        </button>
        <button
          type="button"
          title="Download PNG"
          onClick={downloadPng}
          className="p-1 rounded hover:bg-surface/60 text-subtext"
        >
          <Download size={13} />
        </button>
      </div>

      <div className="flex-1 min-h-0 relative [&_.tui-image-editor]:absolute [&_.tui-image-editor]:inset-0 [&_.tui-image-editor]:min-h-[320px]">
        <ToastImageEditor
          usageStatistics={false}
          ref={(el: ToastEditorWrapper | null) => {
            wrapperRef.current = el;
          }}
          includeUI={{
            loadImage: {
              path: blank,
              name: "Untitled",
            },
            uiSize: {
              width: "100%",
              height: "100%",
            },
          }}
          cssMaxWidth={4096}
          cssMaxHeight={4096}
        />
      </div>
    </div>
  );
}
