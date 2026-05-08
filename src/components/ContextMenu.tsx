import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Layers,
  Lock,
  RefreshCcw,
  Settings as SettingsIcon,
  Sparkles,
  Terminal as TermIcon,
} from "lucide-react";
import { useStore } from "../store";
import { WALLPAPERS } from "../data/wallpapers";

interface MenuPos {
  x: number;
  y: number;
}

export function DesktopContextMenu() {
  const [pos, setPos] = useState<MenuPos | null>(null);
  const setLocked = useStore((s) => s.setLocked);
  const setSettings = useStore((s) => s.setSettings);
  const openApp = useStore((s) => s.openApp);
  const setLauncherOpen = useStore((s) => s.setLauncherOpen);
  const pushToast = useStore((s) => s.pushToast);

  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-window]") || target.closest("[data-no-context]")) return;
      e.preventDefault();
      const W = 240;
      const H = 320;
      const x = Math.min(e.clientX, window.innerWidth - W - 8);
      const y = Math.min(e.clientY, window.innerHeight - H - 8);
      setPos({ x, y });
    };
    const onClick = () => setPos(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPos(null);
    };
    window.addEventListener("contextmenu", onContext);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("contextmenu", onContext);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!pos) return null;
  const close = () => setPos(null);

  return (
    <div
      className="absolute z-[125] glass-strong rounded-xl border border-white/10 py-1.5 w-56 text-sm animate-scale-in shadow-xl"
      style={{ left: pos.x, top: pos.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <Item
        icon={<TermIcon size={13} />}
        label="Open terminal"
        onClick={() => {
          openApp("terminal");
          close();
        }}
        kbd="Ctrl+Alt T"
      />
      <Item
        icon={<Layers size={13} />}
        label="Launcher"
        onClick={() => {
          setLauncherOpen(true);
          close();
        }}
        kbd="Ctrl+Alt+K"
      />
      <div className="my-1 border-t border-white/5" />
      <Item
        icon={<Sparkles size={13} />}
        label="Random wallpaper"
        onClick={() => {
          const next = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
          setSettings({ wallpaperId: next.id, wallpaperUrl: undefined });
          pushToast({ title: "Wallpaper", body: next.name, tone: "success" });
          close();
        }}
      />
      <Item
        icon={<ImageIcon size={13} />}
        label="Change wallpaper…"
        onClick={() => {
          openApp("settings");
          close();
        }}
      />
      <Item
        icon={<SettingsIcon size={13} />}
        label="Settings"
        onClick={() => {
          openApp("settings");
          close();
        }}
      />
      <div className="my-1 border-t border-white/5" />
      <Item
        icon={<RefreshCcw size={13} />}
        label="Reload"
        onClick={() => location.reload()}
      />
      <Item
        icon={<Lock size={13} />}
        label="Lock screen"
        onClick={() => {
          setLocked(true);
          close();
        }}
      />
    </div>
  );
}

function Item({
  icon,
  label,
  onClick,
  kbd,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  kbd?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/8 transition rounded-md mx-1"
      style={{ width: "calc(100% - 0.5rem)" }}
    >
      <span className="text-muted">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {kbd && (
        <kbd className="text-[10px] text-muted bg-white/5 px-1.5 py-0.5 rounded font-mono">
          {kbd}
        </kbd>
      )}
    </button>
  );
}
