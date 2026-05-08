import { useEffect, useRef, useState } from "react";
import {
  Gamepad2,
  Maximize2,
  RotateCcw,
  Upload,
  X as XIcon,
} from "lucide-react";
import clsx from "clsx";

interface CoreMeta {
  id: string;
  name: string;
  ext: string;
}

const CORES: CoreMeta[] = [
  { id: "nes", name: "NES", ext: ".nes" },
  { id: "snes", name: "SNES", ext: ".smc,.sfc,.fig" },
  { id: "gb", name: "Game Boy", ext: ".gb" },
  { id: "gbc", name: "Game Boy Color", ext: ".gbc" },
  { id: "gba", name: "Game Boy Advance", ext: ".gba" },
  { id: "n64", name: "Nintendo 64", ext: ".n64,.z64,.v64" },
  { id: "segaMD", name: "Sega Genesis", ext: ".md,.gen,.bin,.smd" },
];

interface LoadedRom {
  url: string;     // blob: URL
  name: string;
  size: number;
}

export function GamesApp() {
  const [coreId, setCoreId] = useState<string>("nes");
  const [rom, setRom] = useState<LoadedRom | null>(null);
  const [session, setSession] = useState(0);

  function handlePick(file: File) {
    // Auto-detect core from extension if possible
    const lower = file.name.toLowerCase();
    const guessed =
      CORES.find((c) =>
        c.ext.split(",").some((e) => lower.endsWith(e.trim()))
      )?.id ?? coreId;
    setCoreId(guessed);

    if (rom?.url) URL.revokeObjectURL(rom.url);
    const url = URL.createObjectURL(file);
    setRom({ url, name: file.name, size: file.size });
    setSession((s) => s + 1);
  }

  function restart() {
    setSession((s) => s + 1);
  }

  function unload() {
    if (rom?.url) URL.revokeObjectURL(rom.url);
    setRom(null);
    setSession((s) => s + 1);
  }

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (rom?.url) URL.revokeObjectURL(rom.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col">
      <Toolbar
        coreId={coreId}
        onCoreChange={setCoreId}
        rom={rom}
        onPick={handlePick}
        onRestart={restart}
        onClose={unload}
      />
      <div className="flex-1 bg-black overflow-hidden relative">
        {rom ? (
          <EmulatorMount key={session} core={coreId} rom={rom} />
        ) : (
          <EmptyState coreId={coreId} onPick={handlePick} />
        )}
      </div>
    </div>
  );
}

// ============================================================
//                    TOOLBAR
// ============================================================
function Toolbar({
  coreId,
  onCoreChange,
  rom,
  onPick,
  onRestart,
  onClose,
}: {
  coreId: string;
  onCoreChange: (v: string) => void;
  rom: LoadedRom | null;
  onPick: (f: File) => void;
  onRestart: () => void;
  onClose: () => void;
}) {
  const accept = CORES.map((c) => c.ext).join(",");
  return (
    <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2 bg-mantle/40 text-sm flex-wrap">
      <Gamepad2 size={14} className="text-accent" />
      <select
        value={coreId}
        onChange={(e) => onCoreChange(e.target.value)}
        className="bg-white/5 hover:bg-white/10 rounded px-2 py-1 text-xs outline-none"
      >
        {CORES.map((c) => (
          <option key={c.id} value={c.id} className="bg-mantle">
            {c.name}
          </option>
        ))}
      </select>

      <label
        className="text-xs px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer flex items-center gap-1.5"
        title="Load ROM"
      >
        <Upload size={12} />
        Load ROM
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
        />
      </label>

      {rom && (
        <>
          <span className="text-xs text-muted truncate flex-1 min-w-0">
            {rom.name}{" "}
            <span className="opacity-60">
              ({formatBytes(rom.size)})
            </span>
          </span>
          <button
            onClick={onRestart}
            title="Restart"
            className="p-1.5 rounded hover:bg-white/10 text-subtext"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={() => fullscreen()}
            title="Fullscreen"
            className="p-1.5 rounded hover:bg-white/10 text-subtext"
          >
            <Maximize2 size={12} />
          </button>
          <button
            onClick={onClose}
            title="Eject"
            className="p-1.5 rounded hover:bg-white/10 text-subtext"
          >
            <XIcon size={12} />
          </button>
        </>
      )}
    </div>
  );
}

function fullscreen() {
  const w = window as unknown as { EJS_emulator?: { elements?: { parent?: HTMLElement } } };
  const el = w.EJS_emulator?.elements?.parent;
  if (el?.requestFullscreen) el.requestFullscreen();
}

// ============================================================
//                    EMULATOR MOUNT
// ============================================================
const CDN_BASE = "https://cdn.emulatorjs.org/stable/data/";

function EmulatorMount({
  core,
  rom,
}: {
  core: string;
  rom: LoadedRom;
}) {
  const containerId = useRef(
    `ejs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;

    // Set EmulatorJS globals
    w.EJS_player = `#${containerId.current}`;
    w.EJS_core = core;
    w.EJS_gameUrl = rom.url;
    w.EJS_gameName = rom.name;
    w.EJS_pathtodata = CDN_BASE;
    w.EJS_startOnLoaded = true;
    w.EJS_color = getComputedAccent();
    w.EJS_volume = 0.5;
    w.EJS_backgroundColor = "#000000";

    // Inject loader script
    const script = document.createElement("script");
    script.src = CDN_BASE + "loader.js";
    script.async = true;
    script.onload = () => setStatus("ready");
    script.onerror = () => setStatus("error");
    document.body.appendChild(script);

    return () => {
      // Tear down
      try {
        const w2 = window as unknown as {
          EJS_emulator?: {
            elements?: { parent?: HTMLElement };
            callEvent?: (e: string) => void;
          };
        };
        // EmulatorJS sometimes exposes a destroy/exit
        const em = w2.EJS_emulator;
        em?.callEvent?.("exit");
        em?.elements?.parent?.remove();
      } catch {
        /* ignore */
      }
      script.remove();
      [
        "EJS_player",
        "EJS_core",
        "EJS_gameUrl",
        "EJS_gameName",
        "EJS_pathtodata",
        "EJS_startOnLoaded",
        "EJS_color",
        "EJS_volume",
        "EJS_backgroundColor",
        "EJS_emulator",
      ].forEach((k) => {
        delete (window as unknown as Record<string, unknown>)[k];
      });
    };
  }, [core, rom.url, rom.name]);

  return (
    <div className="w-full h-full relative">
      <div id={containerId.current} className="w-full h-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted text-sm pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin-slow mb-3" />
          Loading EmulatorJS…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-300 text-sm gap-2 p-6 text-center">
          <div>Failed to load EmulatorJS from CDN.</div>
          <div className="text-muted text-xs max-w-sm">
            Check your network or try again later. The emulator pulls scripts
            and WASM cores from <code>cdn.emulatorjs.org</code>.
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//                    EMPTY STATE
// ============================================================
function EmptyState({
  coreId,
  onPick,
}: {
  coreId: string;
  onPick: (f: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const accept = CORES.map((c) => c.ext).join(",");
  const core = CORES.find((c) => c.id === coreId);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={clsx(
        "absolute inset-0 flex flex-col items-center justify-center text-center gap-4 p-6 transition",
        drag && "bg-accent/8 ring-2 ring-accent/40 ring-inset"
      )}
    >
      <Gamepad2 size={48} className="text-accent/60" strokeWidth={1.2} />
      <div className="text-text text-base">
        {drag ? "Drop your ROM" : "No ROM loaded"}
      </div>
      <div className="text-muted text-sm max-w-md leading-relaxed">
        Pick a core above and load a ROM file, or drag-and-drop one here.
        Save states, gamepads, and fullscreen all work — ROMs stay in your
        browser, nothing is uploaded.
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        className="px-4 py-2 rounded-md bg-accent/20 hover:bg-accent/30 text-accent transition flex items-center gap-2 text-sm"
      >
        <Upload size={14} /> Load {core?.name ?? ""} ROM
      </button>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <div className="text-[11px] text-muted/70 max-w-md mt-2 leading-relaxed">
        Supported: NES · SNES · Game Boy / Color / Advance · N64 · Sega Genesis.
        <br />
        Looking for legal ROMs? Try{" "}
        <a
          href="https://www.nesdev.org/wiki/Homebrew_games"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          NES homebrew
        </a>{" "}
        or{" "}
        <a
          href="https://hh.gbdev.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Game Boy homebrew
        </a>
        .
      </div>
    </div>
  );
}

function getComputedAccent(): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  if (!v) return "#89b4fa";
  const [r, g, b] = v.split(/\s+/).map(Number);
  if ([r, g, b].some(Number.isNaN)) return "#89b4fa";
  return (
    "#" +
    [r, g, b]
      .map((n) => Math.round(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
