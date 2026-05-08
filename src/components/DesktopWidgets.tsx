import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { useStore } from "../store";
import { ENGINES } from "../data/engines";
import { Favicon } from "./Launcher";
import { getRecommendations } from "../lib/recommend";
import { useWeatherSnapshot } from "../hooks/useWeatherSnapshot";
import { weatherGlyph } from "../lib/weather-openmeteo";
import { formatTempDisplay } from "../lib/temperature";

function formatTime(d: Date, use24h: boolean) {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24h,
  });
}

export function DesktopWidgets() {
  const settings = useStore((s) => s.settings);
  const windows = useStore((s) => s.windows);
  const workspace = useStore((s) => s.workspace);
  const bookmarks = useStore((s) => s.bookmarks);
  const visits = useStore((s) => s.visits);
  const recordVisit = useStore((s) => s.recordVisit);
  const setLauncherOpen = useStore((s) => s.setLauncherOpen);
  const openApp = useStore((s) => s.openApp);
  const [now, setNow] = useState(new Date());
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(i);
  }, []);

  const visibleWindows = windows.filter(
    (w) => w.workspace === workspace && !w.minimized
  );
  const idle = visibleWindows.length === 0;

  const recommendations = useMemo(
    () => getRecommendations(bookmarks, visits, 8),
    [bookmarks, visits]
  );

  const weatherConfigured = Boolean(settings.city?.trim());
  const { snapshot: wx, loading: wxLoading, failed: wxFailed } =
    useWeatherSnapshot(settings.city);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    const en = ENGINES.find((x) => x.id === settings.defaultEngine) ?? ENGINES[0];
    window.open(en.url(q), "_blank", "noopener");
    setQ("");
  }

  if (!idle) return null;

  return (
    <motion.div
      className="absolute inset-0 z-[45] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center gap-7 max-w-2xl w-full px-6 pointer-events-auto">
        {/* Greeting */}
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.4em] text-subtext mb-2">
            {greeting()}, {settings.username}
          </div>
          <div className="text-[100px] leading-none font-extralight tabular-nums text-text drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
            {formatTime(now, settings.use24h)}
          </div>
          <div className="mt-2 text-base font-light text-subtext">
            {now.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        {weatherConfigured && (
          <div className="mt-4 flex w-full flex-col items-center text-center pointer-events-auto">
            {wx ? (
              <button
                type="button"
                onClick={() => openApp("weather")}
                className="group flex max-w-md flex-col items-center gap-2 rounded-xl px-4 py-1 text-center transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <div className="text-[11px] uppercase tracking-[0.28em] font-medium text-text/95 drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">
                  {wx.cityLabel}
                </div>
                <div className="[&>svg]:drop-shadow-[0_2px_14px_rgba(0,0,0,0.4)]">
                  {weatherGlyph(wx.weathercode, 44)}
                </div>
                <div className="flex justify-center">
                  <span className="text-[2.75rem] leading-none font-extralight tabular-nums text-text drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)] tracking-tight">
                    {formatTempDisplay(wx.temperature, settings.temperatureUnit)}
                  </span>
                </div>
              </button>
            ) : wxLoading ? (
              <div className="text-xs text-muted/90 font-mono tracking-wide">
                Loading weather…
              </div>
            ) : wxFailed ? (
              <button
                type="button"
                onClick={() => openApp("weather")}
                className="text-xs text-muted hover:text-accent transition underline-offset-4 hover:underline"
              >
                Could not load weather for “{settings.city?.trim()}” — open Weather to fix
              </button>
            ) : null}
          </div>
        )}

        {/* Search */}
        <form
          onSubmit={submit}
          className="w-full glass-strong rounded-full pl-5 pr-1.5 py-1.5 border border-white/8 flex items-center gap-3 shadow-xl"
        >
          <Search size={16} className="text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the web…"
            className="flex-1 bg-transparent outline-none placeholder:text-muted/60 py-2"
          />
          <button
            type="button"
            onClick={() => setLauncherOpen(true)}
            className="text-[10px] font-mono px-2 py-1 rounded chip"
            title="Open launcher"
          >
            Ctrl+Alt K
          </button>
          <button
            type="submit"
            className="text-xs px-3 py-2 rounded-full bg-accent text-mantle hover:brightness-110 transition font-medium"
            title="Search"
          >
            Search
          </button>
        </form>

        {/* Recommendations */}
        <div className="w-full">
          <div className="flex items-center gap-2 px-1 mb-2.5 text-[11px] uppercase tracking-[0.28em] font-medium text-text/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">
            <Sparkles size={12} className="text-accent shrink-0 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]" strokeWidth={2} />
            <span className="whitespace-nowrap">
              {visits.length > 0 ? "Recommended for you" : "Suggested links"}
            </span>
            <span className="flex-1 h-px bg-white/15 min-w-[12px]" />
          </div>
          <div className="grid grid-cols-4 gap-2 w-full">
            {recommendations.map((r) => (
              <a
                key={r.bookmark.id}
                href={r.bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordVisit(r.bookmark.id)}
                className="idle-link-tile rounded-2xl px-3 py-3 flex items-center gap-2.5 group min-w-0"
                title={`${r.bookmark.title} — ${r.reason}`}
              >
                <span className="shrink-0 rounded-lg bg-black/35 ring-1 ring-white/12 p-1 flex items-center justify-center shadow-inner">
                  <Favicon url={r.bookmark.url} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium leading-snug truncate text-text drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                    {r.bookmark.title}
                  </div>
                  <div className="text-[11px] leading-snug truncate text-subtext/95 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] group-hover:text-text/90 transition-colors">
                    {r.reason}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-xl glass-strong border border-white/12 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex items-center gap-2 max-w-xl mx-auto">
          <ArrowUpRight size={12} className="text-accent shrink-0" strokeWidth={2} />
          <span className="text-[11px] font-mono leading-snug text-text/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            Press Ctrl+Alt+Space or Ctrl+Alt+K to open the launcher
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
