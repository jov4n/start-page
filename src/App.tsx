import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Wallpaper } from "./components/Wallpaper";
import { Waybar } from "./components/Waybar";
import { Launcher } from "./components/Launcher";
import { DesktopContextMenu } from "./components/ContextMenu";
import { WindowManager } from "./components/WindowManager";
import { BootScreen } from "./components/BootScreen";
import { LockScreen } from "./components/LockScreen";
import { DesktopWidgets } from "./components/DesktopWidgets";
import { PowerMenu } from "./components/PowerMenu";
import { Toasts } from "./components/Toasts";
import { chordSuper } from "./lib/desktop-shortcuts";
import { useStore } from "./store";

export default function App() {
  const settings = useStore((s) => s.settings);
  const booted = useStore((s) => s.booted);
  const setBooted = useStore((s) => s.setBooted);
  const launcherOpen = useStore((s) => s.launcherOpen);
  const setLauncherOpen = useStore((s) => s.setLauncherOpen);
  const setPowerMenuOpen = useStore((s) => s.setPowerMenuOpen);
  const switchWorkspace = useStore((s) => s.switchWorkspace);
  const openApp = useStore((s) => s.openApp);

  // Apply theme via data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Super → Ctrl+Alt (see desktop-shortcuts.ts)
      if (e.key === "Escape" && launcherOpen) {
        setLauncherOpen(false);
        return;
      }
      if (e.code === "Space" && chordSuper(e) && !e.shiftKey) {
        e.preventDefault();
        setLauncherOpen(!launcherOpen);
        return;
      }
      if (e.key === "k" && chordSuper(e) && !e.shiftKey) {
        e.preventDefault();
        setLauncherOpen(true);
        return;
      }
      // Ctrl+Alt+L lock, Ctrl+Alt+P power
      if (chordSuper(e) && !e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        useStore.getState().setLocked(true);
        return;
      }
      if (chordSuper(e) && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPowerMenuOpen(true);
        return;
      }
      // Ctrl+Alt + 1..9 → workspace (Shift reserved for quarter snaps on digits)
      if (
        chordSuper(e) &&
        !e.shiftKey &&
        /^[1-9]$/.test(e.key)
      ) {
        e.preventDefault();
        switchWorkspace(Number(e.key));
        return;
      }
      // Ctrl+Alt+T terminal, Ctrl+Alt+E files
      if (chordSuper(e) && !e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        openApp("terminal");
      }
      if (chordSuper(e) && !e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        openApp("files");
      }

      // Focused window tiling — Ctrl+Alt + arrows; quarters Ctrl+Alt+Shift+1..4
      const stTiles = useStore.getState();
      if (
        stTiles.booted &&
        !stTiles.locked &&
        !stTiles.launcherOpen &&
        !stTiles.powerMenuOpen &&
        stTiles.focusedId
      ) {
        const ae = document.activeElement as HTMLElement | null;
        const tag = ae?.tagName?.toUpperCase();
        const typing =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          ae?.isContentEditable;
        if (!typing) {
          const id = stTiles.focusedId;
          const { snapWindow, toggleMaximize, minimizeWindow, windows } =
            stTiles;

          if (chordSuper(e) && e.shiftKey && /^[1-4]$/.test(e.key)) {
            e.preventDefault();
            const zoneMap = {
              "1": "tl",
              "2": "tr",
              "3": "bl",
              "4": "br",
            } as const;
            snapWindow(id, zoneMap[e.key as keyof typeof zoneMap]);
            return;
          }

          if (chordSuper(e) && e.key.startsWith("Arrow")) {
            if (e.key === "ArrowLeft" && !e.shiftKey) {
              e.preventDefault();
              snapWindow(id, "left");
              return;
            }
            if (e.key === "ArrowRight" && !e.shiftKey) {
              e.preventDefault();
              snapWindow(id, "right");
              return;
            }
            if (e.key === "ArrowUp" && e.shiftKey) {
              e.preventDefault();
              snapWindow(id, "top");
              return;
            }
            if (e.key === "ArrowDown" && e.shiftKey) {
              e.preventDefault();
              snapWindow(id, "bottom");
              return;
            }
            if (e.key === "ArrowUp" && !e.shiftKey) {
              e.preventDefault();
              toggleMaximize(id);
              return;
            }
            if (e.key === "ArrowDown" && !e.shiftKey) {
              e.preventDefault();
              const w = windows.find((x) => x.id === id);
              if (w?.maximized) toggleMaximize(id);
              else minimizeWindow(id);
              return;
            }
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    launcherOpen,
    setLauncherOpen,
    setPowerMenuOpen,
    switchWorkspace,
    openApp,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden text-text font-sans">
      <Wallpaper />

      <AnimatePresence>
        {!booted && <BootScreen onDone={() => setBooted(true)} />}
      </AnimatePresence>

      {booted && (
        <>
          <DesktopWidgets />
          <div className="absolute inset-0 z-[40] isolate">
            <WindowManager />
          </div>
          <Waybar />
          <Launcher />
          <DesktopContextMenu />
          <PowerMenu />
          <Toasts />
          <LockScreen />
        </>
      )}
    </div>
  );
}
