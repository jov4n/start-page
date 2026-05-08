import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppId,
  Bookmark,
  CodeFile,
  Note,
  Settings,
  TemperatureUnit,
  Toast,
  Visit,
  VncProfile,
  WindowState,
} from "./types";
import { APPS } from "./apps/registry";
import { DEFAULT_BOOKMARKS } from "./data/bookmarks";
import { trimVisits } from "./lib/recommend";
import {
  WAYBAR_HEIGHT_PX,
  boundsForSnap,
  type SnapZone,
} from "./lib/window-layout";

/** Used only when migrating persisted settings from versions before bundled Paint. */
const LEGACY_BITMAP_EMBED = "/bitmappery-proxy/application/bitmappery/";

function migrateLegacyBitmapperyUrl(raw: string): string {
  const u = raw.trim();
  if (!u) return LEGACY_BITMAP_EMBED;
  if (u.startsWith("/")) return u;
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    return LEGACY_BITMAP_EMBED;
  }
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "igorski.nl") return LEGACY_BITMAP_EMBED;
    return u;
  } catch {
    return LEGACY_BITMAP_EMBED;
  }
}

interface State {
  windows: WindowState[];
  zCounter: number;
  focusedId: string | null;

  bookmarks: Bookmark[];
  notes: Note[];
  settings: Settings;
  visits: Visit[];
  codeFiles: CodeFile[];

  booted: boolean;
  locked: boolean;
  launcherOpen: boolean;
  powerMenuOpen: boolean;

  workspace: number;        // 1..9
  toasts: Toast[];

  // ---- window management ----
  openApp: (appId: AppId) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string, viewport?: { w: number; h: number }) => void;
  /** Tile focused window (corners / halves via drag use same geometry). */
  snapWindow: (id: string, zone: SnapZone) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (
    id: string,
    bounds: Partial<Pick<WindowState, "x" | "y" | "w" | "h">>
  ) => void;
  moveToWorkspace: (id: string, ws: number) => void;

  // ---- workspaces ----
  switchWorkspace: (ws: number) => void;

  // ---- bookmarks ----
  addBookmark: (b: Omit<Bookmark, "id">) => void;
  removeBookmark: (id: string) => void;
  updateBookmark: (id: string, b: Partial<Bookmark>) => void;
  recordVisit: (bookmarkId: string) => void;
  recordVisitByUrl: (url: string) => void;
  clearVisits: () => void;

  // ---- notes ----
  addNote: () => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  removeNote: (id: string) => void;

  // ---- settings ----
  setSettings: (patch: Partial<Settings>) => void;

  // ---- vnc ----
  addVncProfile: (p: Omit<VncProfile, "id">) => string;
  updateVncProfile: (id: string, patch: Partial<VncProfile>) => void;
  removeVncProfile: (id: string) => void;
  setLastVncProfileId: (id: string | undefined) => void;

  // ---- code ----
  addCodeFile: (init?: Partial<CodeFile>) => string;
  updateCodeFile: (id: string, patch: Partial<CodeFile>) => void;
  removeCodeFile: (id: string) => void;

  // ---- chrome ----
  setBooted: (b: boolean) => void;
  setLocked: (b: boolean) => void;
  setLauncherOpen: (b: boolean) => void;
  setPowerMenuOpen: (b: boolean) => void;

  // ---- toasts ----
  pushToast: (t: Omit<Toast, "id" | "createdAt">) => void;
  dismissToast: (id: string) => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "mocha",
  wallpaperId: "nebula",
  blur: 0,
  dim: 0.35,
  reduceMotion: false,
  showSeconds: false,
  use24h: true,
  defaultEngine: "duckduckgo",
  temperatureUnit: "celsius",
  username: "user",
  windowGap: 12,
  showWindowTitleInBar: true,
  rememberDesktop: true,
  vncProfiles: [],
  fastfetchLogo: "hyprstart",
};

const SAMPLE_CODE_FILE: CodeFile = {
  id: "code-welcome",
  name: "scratch.ts",
  language: "typescript",
  body:
    "// scratch.ts — your local code scratchpad.\n" +
    "// Persists in your browser. Edit me.\n\n" +
    "export function fib(n: number): number {\n" +
    "  return n < 2 ? n : fib(n - 1) + fib(n - 2);\n" +
    "}\n\n" +
    "console.log(fib(10));\n",
  updatedAt: Date.now(),
};

const SAMPLE_NOTE: Note = {
  id: "note-welcome",
  title: "Welcome",
  body:
    "Welcome to Hyprstart — your interactive Hyprland-style start page.\n\n" +
    "## Tips\n\n" +
    "- Drag windows by the title bar.\n" +
    "- Resize from any edge or corner.\n" +
    "- Right-click the desktop for actions.\n" +
    "- Press **Ctrl+Alt+Space** or **Ctrl+Alt+K** (or click the logo) for the launcher.\n" +
    "- Use **Ctrl+Alt + 1…9** to switch workspaces.\n" +
    "- Try the terminal — type `help`.\n\n" +
    "Notes support **Markdown** with a live preview. Edit me — everything saves automatically.",
  updatedAt: Date.now(),
};

let _wid = 1;
const nextWid = () => `w${_wid++}`;

function defaultBoundsFor(appId: AppId, count: number) {
  const meta = APPS[appId];
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const w = Math.min(meta.defaultSize.w, vw - 80);
  const h = Math.min(meta.defaultSize.h, vh - 160);
  const offset = (count % 8) * 28;
  const x = Math.max(40, Math.round((vw - w) / 2) - 80 + offset);
  const y = Math.max(60, Math.round((vh - h) / 2) - 60 + offset);
  return { x, y, w, h };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      windows: [],
      zCounter: 1,
      focusedId: null,

      bookmarks: DEFAULT_BOOKMARKS,
      notes: [SAMPLE_NOTE],
      settings: DEFAULT_SETTINGS,
      visits: [],
      codeFiles: [SAMPLE_CODE_FILE],

      booted: false,
      locked: false,
      launcherOpen: false,
      powerMenuOpen: false,

      workspace: 1,
      toasts: [],

      openApp: (appId) => {
        const ws = get().workspace;
        const existing = get().windows.find(
          (w) => w.appId === appId && w.workspace === ws
        );
        if (existing) {
          set((s) => ({
            windows: s.windows.map((w) =>
              w.id === existing.id
                ? { ...w, minimized: false, z: s.zCounter + 1 }
                : w
            ),
            zCounter: s.zCounter + 1,
            focusedId: existing.id,
            launcherOpen: false,
          }));
          return existing.id;
        }
        const id = nextWid();
        const bounds = defaultBoundsFor(
          appId,
          get().windows.filter((w) => w.workspace === ws).length
        );
        const meta = APPS[appId];
        set((s) => ({
          windows: [
            ...s.windows,
            {
              id,
              appId,
              title: meta.name,
              workspace: ws,
              ...bounds,
              z: s.zCounter + 1,
              minimized: false,
              maximized: false,
            },
          ],
          zCounter: s.zCounter + 1,
          focusedId: id,
          launcherOpen: false,
        }));
        return id;
      },

      closeWindow: (id) =>
        set((s) => ({
          windows: s.windows.filter((w) => w.id !== id),
          focusedId: s.focusedId === id ? null : s.focusedId,
        })),

      focusWindow: (id) =>
        set((s) => {
          const top = s.zCounter + 1;
          return {
            windows: s.windows.map((w) =>
              w.id === id ? { ...w, z: top, minimized: false } : w
            ),
            zCounter: top,
            focusedId: id,
          };
        }),

      minimizeWindow: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, minimized: true } : w
          ),
          focusedId: s.focusedId === id ? null : s.focusedId,
        })),

      toggleMaximize: (id, viewport) =>
        set((s) => ({
          windows: s.windows.map((w) => {
            if (w.id !== id) return w;
            if (w.maximized && w.prevBounds) {
              return {
                ...w,
                maximized: false,
                x: w.prevBounds.x,
                y: w.prevBounds.y,
                w: w.prevBounds.w,
                h: w.prevBounds.h,
                prevBounds: undefined,
              };
            }
            const vw = viewport?.w ?? window.innerWidth;
            const vh = viewport?.h ?? window.innerHeight;
            const gap = s.settings.windowGap;
            const top = WAYBAR_HEIGHT_PX + gap;
            const innerH = vh - top - gap;
            return {
              ...w,
              maximized: true,
              prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h },
              x: gap,
              y: top,
              w: vw - gap * 2,
              h: innerH,
            };
          }),
        })),

      snapWindow: (id, zone) => {
        const s = get();
        const win = s.windows.find((w) => w.id === id);
        if (!win || win.workspace !== s.workspace) return;
        const b = boundsForSnap(zone, s.settings);
        const topZ = s.zCounter + 1;
        set({
          windows: s.windows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  maximized: false,
                  prevBounds: undefined,
                  minimized: false,
                  x: b.x,
                  y: b.y,
                  w: b.w,
                  h: b.h,
                  z: topZ,
                }
              : w
          ),
          zCounter: topZ,
          focusedId: id,
        });
      },

      moveWindow: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, x, y, maximized: false } : w
          ),
        })),

      resizeWindow: (id, bounds) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, ...bounds, maximized: false } : w
          ),
        })),

      moveToWorkspace: (id, ws) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, workspace: ws } : w)),
        })),

      switchWorkspace: (ws) => {
        if (ws < 1 || ws > 9) return;
        set({ workspace: ws, launcherOpen: false });
      },

      addBookmark: (b) =>
        set((s) => ({
          bookmarks: [
            ...s.bookmarks,
            { ...b, id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
          ],
        })),

      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),

      updateBookmark: (id, patch) =>
        set((s) => ({
          bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      recordVisit: (bookmarkId) =>
        set((s) => ({
          visits: trimVisits([...s.visits, { bookmarkId, ts: Date.now() }]),
        })),

      recordVisitByUrl: (url) => {
        const b = get().bookmarks.find((x) => x.url === url);
        if (!b) return;
        set((s) => ({
          visits: trimVisits([...s.visits, { bookmarkId: b.id, ts: Date.now() }]),
        }));
      },

      clearVisits: () => set({ visits: [] }),

      addNote: () => {
        const id = `note-${Date.now()}`;
        const note: Note = {
          id,
          title: "Untitled",
          body: "",
          updatedAt: Date.now(),
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return id;
      },

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
          ),
        })),

      removeNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      addVncProfile: (p) => {
        const id = `vnc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({
          settings: {
            ...s.settings,
            vncProfiles: [...s.settings.vncProfiles, { ...p, id }],
            lastVncProfileId: id,
          },
        }));
        return id;
      },

      updateVncProfile: (id, patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            vncProfiles: s.settings.vncProfiles.map((p) =>
              p.id === id ? { ...p, ...patch } : p
            ),
          },
        })),

      removeVncProfile: (id) =>
        set((s) => ({
          settings: {
            ...s.settings,
            vncProfiles: s.settings.vncProfiles.filter((p) => p.id !== id),
            lastVncProfileId:
              s.settings.lastVncProfileId === id
                ? undefined
                : s.settings.lastVncProfileId,
          },
        })),

      setLastVncProfileId: (id) =>
        set((s) => ({
          settings: { ...s.settings, lastVncProfileId: id },
        })),

      addCodeFile: (init) => {
        const id = `code-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const file: CodeFile = {
          id,
          name: init?.name ?? "untitled.txt",
          language: init?.language ?? "plaintext",
          body: init?.body ?? "",
          updatedAt: Date.now(),
        };
        set((s) => ({ codeFiles: [file, ...s.codeFiles] }));
        return id;
      },

      updateCodeFile: (id, patch) =>
        set((s) => ({
          codeFiles: s.codeFiles.map((f) =>
            f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f
          ),
        })),

      removeCodeFile: (id) =>
        set((s) => ({ codeFiles: s.codeFiles.filter((f) => f.id !== id) })),

      setBooted: (b) => set({ booted: b }),
      setLocked: (b) => set({ locked: b }),
      setLauncherOpen: (b) => set({ launcherOpen: b }),
      setPowerMenuOpen: (b) => set({ powerMenuOpen: b }),

      pushToast: (t) => {
        const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({
          toasts: [...s.toasts, { ...t, id, createdAt: Date.now() }],
        }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
        }, 4000);
      },

      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "hyprstart-state",
      version: 10,
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        notes: state.notes,
        settings: state.settings,
        visits: state.visits,
        codeFiles: state.codeFiles,
        // Optionally remember desktop layout & current workspace.
        ...(state.settings.rememberDesktop
          ? {
              windows: state.windows,
              zCounter: state.zCounter,
              focusedId: state.focusedId,
              workspace: state.workspace,
            }
          : {}),
      }),
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== "object") return persisted;
        const p = persisted as { settings?: Partial<Settings> };
        if (version < 4 && p.settings) {
          p.settings = {
            ...p.settings,
            rememberDesktop: p.settings.rememberDesktop ?? true,
            vncProfiles: p.settings.vncProfiles ?? [],
          };
        }
        if (version < 5 && p.settings) {
          p.settings = {
            ...p.settings,
            fastfetchLogo: p.settings.fastfetchLogo ?? "hyprstart",
          };
        }
        if (version < 6 && p.settings) {
          const raw = p.settings as Record<string, unknown>;
          raw.bitmapperyUrl =
            typeof raw.bitmapperyUrl === "string" && raw.bitmapperyUrl.trim()
              ? raw.bitmapperyUrl
              : LEGACY_BITMAP_EMBED;
        }
        if (version < 7 && p.settings) {
          const raw = p.settings as Record<string, unknown>;
          const u = String(raw.bitmapperyUrl ?? "").trim();
          if (u.startsWith("https://www.igorski.nl")) {
            raw.bitmapperyUrl = LEGACY_BITMAP_EMBED;
          }
        }
        if (version < 8 && p.settings) {
          const raw = p.settings as Record<string, unknown>;
          raw.bitmapperyUrl = migrateLegacyBitmapperyUrl(
            String(raw.bitmapperyUrl ?? "").trim()
          );
        }
        if (version < 10 && p.settings) {
          delete (p.settings as Record<string, unknown>).bitmapperyUrl;
          const tu = (p.settings as { temperatureUnit?: string }).temperatureUnit;
          if (tu !== "celsius" && tu !== "fahrenheit") {
            (p.settings as { temperatureUnit: TemperatureUnit }).temperatureUnit =
              "celsius";
          }
        }
        return p;
      },
      onRehydrateStorage: () => (state) => {
        if (!state || !state.windows) return;
        // Re-seed the window id counter so newly opened windows don't collide.
        let max = 0;
        for (const w of state.windows) {
          const n = parseInt(w.id.replace(/^w/, ""), 10);
          if (!Number.isNaN(n) && n > max) max = n;
        }
        _wid = max + 1;
      },
    }
  )
);
