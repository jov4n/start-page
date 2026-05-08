import { useEffect, useState } from "react";
import { Battery, Cpu, Power, Volume2, Wifi } from "lucide-react";
import clsx from "clsx";
import { useWeatherSnapshot } from "../hooks/useWeatherSnapshot";
import { weatherGlyph } from "../lib/weather-openmeteo";
import { formatTempDisplay } from "../lib/temperature";
import { useStore } from "../store";
import { APPS } from "../apps/registry";

function formatTime(d: Date, use24h: boolean, showSeconds: boolean) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24h,
  };
  if (showSeconds) opts.second = "2-digit";
  return d.toLocaleTimeString([], opts);
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function Waybar() {
  const settings = useStore((s) => s.settings);
  const setLauncherOpen = useStore((s) => s.setLauncherOpen);
  const setPowerMenuOpen = useStore((s) => s.setPowerMenuOpen);
  const launcherOpen = useStore((s) => s.launcherOpen);
  const workspace = useStore((s) => s.workspace);
  const switchWorkspace = useStore((s) => s.switchWorkspace);
  const windows = useStore((s) => s.windows);
  const focusedId = useStore((s) => s.focusedId);
  const openApp = useStore((s) => s.openApp);
  const focusWindow = useStore((s) => s.focusWindow);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const ms = settings.showSeconds ? 1000 : 15000;
    const i = setInterval(tick, ms);
    return () => clearInterval(i);
  }, [settings.showSeconds]);

  const focused = windows.find((w) => w.id === focusedId);
  const focusedMeta = focused ? APPS[focused.appId] : null;

  const wsWindows = windows
    .filter((w) => w.workspace === workspace)
    .slice()
    .sort((a, b) => a.z - b.z);

  return (
    <div
      className="absolute top-0 left-0 right-0 h-9 z-[55] flex min-w-0 items-center gap-2 px-2 glass-strong border-b border-white/5 text-sm text-ink"
      data-no-context
    >
      {/* Logo / Activities */}
      <button
        onClick={() => setLauncherOpen(!launcherOpen)}
        className={clsx(
          "h-7 px-2.5 rounded-lg flex items-center gap-2 bezier-wind transition",
          launcherOpen ? "bg-accent/20 text-accent" : "hover:bg-white/5"
        )}
        title="Launcher (Ctrl+Alt+Space)"
      >
        <HyprLogo />
        <span className="font-mono text-[11px] tracking-wider hidden sm:inline">
          hyprstart
        </span>
      </button>

      <Divider />

      {/* Workspaces 1-9 */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((ws) => {
          const has = windows.some((w) => w.workspace === ws);
          const active = workspace === ws;
          return (
            <button
              key={ws}
              onClick={() => switchWorkspace(ws)}
              className="ws-pill bezier-wind"
              data-active={active}
              data-has={has}
              title={`Workspace ${ws}`}
            >
              {ws}
            </button>
          );
        })}
      </div>

      <Divider />

      {/* Open windows on this workspace — click minimized icons to restore */}
      {wsWindows.length > 0 && (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
            {wsWindows.map((w) => {
              const meta = APPS[w.appId];
              const Icon = meta.icon;
              const isFocused = focusedId === w.id && !w.minimized;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => focusWindow(w.id)}
                  className={clsx(
                    "relative h-7 w-7 shrink-0 rounded-md flex items-center justify-center bezier-wind transition",
                    isFocused ? "bg-accent/15 text-accent" : "hover:bg-white/5 text-subtext",
                    w.minimized && "opacity-45 hover:opacity-90"
                  )}
                  title={
                    w.minimized ? `${w.title} — minimized (click to restore)` : w.title
                  }
                >
                  <Icon size={14} strokeWidth={1.6} />
                  {w.minimized ? (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full bg-yellow border border-base/80" />
                  ) : (
                    isFocused && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                    )
                  )}
                </button>
              );
            })}
          </div>
          <Divider />
        </>
      )}

      {/* Focused window title */}
      {settings.showWindowTitleInBar && focused && focusedMeta && (
        <div className="flex items-center gap-1.5 text-subtext min-w-0 max-w-[280px]">
          <focusedMeta.icon size={12} className="shrink-0" />
          <span className="truncate text-[12px]">{focused.title}</span>
        </div>
      )}

      {/* Center spacer */}
      <div className="flex-1" />

      <WaybarWeatherPill />

      {/* Quick app launchers (favorites) */}
      <div className="hidden md:flex items-center gap-1 mr-2">
        {(["terminal", "links", "reader", "files", "notes"] as const).map((id) => {
          const meta = APPS[id];
          const Icon = meta.icon;
          const isOpen = windows.some(
            (w) => w.appId === id && w.workspace === workspace
          );
          return (
            <button
              key={id}
              onClick={() => openApp(id)}
              className={clsx(
                "h-7 w-7 rounded-md flex items-center justify-center bezier-wind transition relative",
                "hover:bg-white/5"
              )}
              title={meta.name}
            >
              <Icon size={14} className="text-subtext" strokeWidth={1.6} />
              {isOpen && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Modules */}
      <Module
        icon={<Cpu size={12} />}
        value={`${(20 + ((now.getSeconds() * 7) % 60)).toString().padStart(2, "0")}%`}
        title="CPU"
        accent="accent2"
      />
      <Module icon={<Wifi size={12} />} value="connected" title="Network" />
      <Module icon={<Volume2 size={12} />} value="72%" title="Volume" />
      <Module icon={<Battery size={12} />} value="86%" title="Battery" />

      {/* Date + Clock */}
      <button
        onClick={() => openApp("clock")}
        className="h-7 px-3 rounded-lg flex items-center gap-2 hover:bg-white/5 bezier-wind transition font-mono"
        title="Open clock"
      >
        <span className="text-muted text-[11px]">{formatDate(now)}</span>
        <span className="text-[12px] text-text tabular-nums">
          {formatTime(now, settings.use24h, settings.showSeconds)}
        </span>
      </button>

      {/* Power */}
      <button
        onClick={() => setPowerMenuOpen(true)}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/15 hover:text-red-300 text-subtext bezier-wind transition"
        title="Power menu"
      >
        <Power size={13} />
      </button>
    </div>
  );
}

function WaybarWeatherPill() {
  const city = useStore((s) => s.settings.city);
  const temperatureUnit = useStore((s) => s.settings.temperatureUnit);
  const openApp = useStore((s) => s.openApp);
  const { snapshot, loading } = useWeatherSnapshot(city);

  if (!city?.trim()) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => openApp("weather")}
        className={clsx(
          "h-7 px-2 rounded-lg flex items-center gap-1.5 bezier-wind transition shrink-0 mr-1",
          snapshot ? "hover:bg-white/5 text-subtext" : "opacity-70 hover:bg-white/5"
        )}
        title={
          snapshot
            ? `${snapshot.cityLabel} · ${formatTempDisplay(snapshot.temperature, temperatureUnit)} — Weather`
            : "Weather"
        }
      >
        {snapshot ? (
          <>
            <span className="flex shrink-0">{weatherGlyph(snapshot.weathercode, 14)}</span>
            <span className="text-[11px] tabular-nums font-medium text-text">
              {formatTempDisplay(snapshot.temperature, temperatureUnit)}
            </span>
          </>
        ) : loading ? (
          <span className="text-[10px] text-muted font-mono px-0.5">···</span>
        ) : (
          <span className="text-[10px] text-muted">—°</span>
        )}
      </button>
      <Divider />
    </>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-white/10 mx-1" />;
}

function Module({
  icon,
  value,
  title,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  title: string;
  accent?: "accent" | "accent2" | "accent3" | "accent4";
}) {
  return (
    <div
      title={title}
      className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 hover:bg-white/5 transition cursor-default"
    >
      <span className={accent ? `text-${accent}` : "text-subtext"}>{icon}</span>
      <span className="text-[11px] tabular-nums text-subtext">{value}</span>
    </div>
  );
}

function HyprLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="hl" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" />
          <stop offset="100%" stopColor="rgb(var(--accent2))" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z"
        fill="url(#hl)"
        stroke="rgb(var(--accent))"
        strokeWidth="0.5"
      />
      <path
        d="M12 7 L17 9.5 V14.5 L12 17 L7 14.5 V9.5 Z"
        fill="rgb(var(--mantle))"
        opacity="0.85"
      />
      <circle cx="12" cy="12" r="1.5" fill="rgb(var(--accent))" />
    </svg>
  );
}

// Re-export for use elsewhere
export { HyprLogo };
