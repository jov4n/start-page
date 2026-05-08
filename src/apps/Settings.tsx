import { useState } from "react";
import {
  Check,
  Image as ImageIcon,
  Palette,
  Sliders,
  User,
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store";
import { WALLPAPERS } from "../data/wallpapers";
import { ENGINES } from "../data/engines";
import { LOGOS } from "../lib/ascii-logos";
import type { ThemeId } from "../types";

type Tab = "appearance" | "wallpaper" | "system";

const THEMES: Array<{
  id: ThemeId;
  name: string;
  palette: [string, string, string, string];
}> = [
  { id: "mocha", name: "Catppuccin Mocha", palette: ["#1e1e2e", "#313244", "#cba6f7", "#89b4fa"] },
  { id: "tokyo", name: "Tokyo Night", palette: ["#1a1b26", "#24283b", "#7aa2f7", "#bb9af7"] },
  { id: "rose", name: "Rosé Pine", palette: ["#191724", "#26233a", "#c4a7e7", "#ebbcba"] },
  { id: "gruv", name: "Gruvbox", palette: ["#282828", "#3c3836", "#fabd2f", "#fe8019"] },
  { id: "latte", name: "Catppuccin Latte", palette: ["#eff1f5", "#ccd0da", "#1e66f5", "#8839ef"] },
];

export function SettingsApp() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [tab, setTab] = useState<Tab>("appearance");

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-52 border-r border-white/5 p-3 flex flex-col gap-1 bg-mantle/40">
        <SideItem
          icon={<Palette size={14} />}
          active={tab === "appearance"}
          onClick={() => setTab("appearance")}
        >
          Appearance
        </SideItem>
        <SideItem
          icon={<ImageIcon size={14} />}
          active={tab === "wallpaper"}
          onClick={() => setTab("wallpaper")}
        >
          Wallpaper
        </SideItem>
        <SideItem
          icon={<Sliders size={14} />}
          active={tab === "system"}
          onClick={() => setTab("system")}
        >
          System
        </SideItem>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "appearance" && (
          <div className="space-y-8">
            <Section title="Theme" hint="Built-in palettes inspired by popular Hyprland configs.">
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSettings({ theme: t.id })}
                    className={clsx(
                      "relative rounded-2xl overflow-hidden h-24 px-4 py-3 flex items-center gap-3 border transition text-left",
                      settings.theme === t.id
                        ? "border-accent ring-1 ring-accent/50"
                        : "border-white/5 hover:border-white/20"
                    )}
                    style={{ background: t.palette[0] }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="w-7 h-2 rounded-full" style={{ background: t.palette[1] }} />
                      <span className="w-5 h-2 rounded-full" style={{ background: t.palette[2] }} />
                      <span className="w-9 h-2 rounded-full" style={{ background: t.palette[3] }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: invertColor(t.palette[0]) }}>
                        {t.name}
                      </div>
                      <div className="text-[11px] opacity-70" style={{ color: invertColor(t.palette[0]) }}>
                        {t.id}
                      </div>
                    </div>
                    {settings.theme === t.id && (
                      <Check className="absolute top-2 right-2 text-accent" size={14} />
                    )}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Window">
              <Slider
                label="Gap"
                value={settings.windowGap}
                min={0}
                max={32}
                onChange={(v) => setSettings({ windowGap: v })}
              />
              <Toggle
                label="Show focused window title in bar"
                value={settings.showWindowTitleInBar}
                onChange={(v) => setSettings({ showWindowTitleInBar: v })}
              />
              <Toggle
                label="Remember desktop state across reloads"
                value={settings.rememberDesktop}
                onChange={(v) => setSettings({ rememberDesktop: v })}
              />
            </Section>
          </div>
        )}

        {tab === "wallpaper" && (
          <div className="space-y-6">
            <Section title="Wallpaper">
              <div className="grid grid-cols-3 gap-3">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() =>
                      setSettings({ wallpaperId: w.id, wallpaperUrl: undefined })
                    }
                    className={clsx(
                      "relative rounded-xl overflow-hidden aspect-video border-2 transition",
                      settings.wallpaperId === w.id && !settings.wallpaperUrl
                        ? "border-accent"
                        : "border-white/5 hover:border-white/30"
                    )}
                  >
                    <img
                      src={w.url}
                      alt={w.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs bg-black/40 backdrop-blur-sm">
                      {w.name}
                    </div>
                    {settings.wallpaperId === w.id && !settings.wallpaperUrl && (
                      <div className="absolute top-1.5 right-1.5 bg-accent rounded-full p-0.5">
                        <Check size={12} className="text-mantle" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Custom URL" hint="Paste any image URL.">
              <input
                value={settings.wallpaperUrl ?? ""}
                onChange={(e) => setSettings({ wallpaperUrl: e.target.value })}
                placeholder="https://…"
                className="w-full bg-white/5 rounded-md px-3 py-2 text-sm outline-none"
              />
            </Section>

            <Section title="Effects">
              <Slider
                label="Background blur"
                value={settings.blur}
                min={0}
                max={30}
                onChange={(v) => setSettings({ blur: v })}
              />
              <Slider
                label="Dim"
                value={Math.round(settings.dim * 100)}
                min={0}
                max={80}
                onChange={(v) => setSettings({ dim: v / 100 })}
              />
            </Section>
          </div>
        )}

        {tab === "system" && (
          <div className="space-y-6">
            <Section title="User" hint="Used for the terminal prompt and the greeting.">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center text-lg">
                  <User size={20} />
                </div>
                <input
                  value={settings.username}
                  onChange={(e) => setSettings({ username: e.target.value })}
                  className="bg-white/5 rounded-md px-3 py-1.5 text-sm outline-none"
                />
              </div>
            </Section>
            <Section title="Clock">
              <Toggle
                label="24-hour clock"
                value={settings.use24h}
                onChange={(v) => setSettings({ use24h: v })}
              />
              <Toggle
                label="Show seconds"
                value={settings.showSeconds}
                onChange={(v) => setSettings({ showSeconds: v })}
              />
            </Section>
            <Section title="Search">
              <select
                value={settings.defaultEngine}
                onChange={(e) =>
                  setSettings({ defaultEngine: e.target.value as never })
                }
                className="bg-white/5 rounded-md px-3 py-1.5 text-sm outline-none"
              >
                {ENGINES.map((e) => (
                  <option key={e.id} value={e.id} className="bg-mantle">
                    {e.name}
                  </option>
                ))}
              </select>
            </Section>
            <Section
              title="Weather"
              hint="Shown on the idle desktop and in the waybar when Open-Meteo can resolve this city."
            >
              <input
                value={settings.city ?? ""}
                onChange={(e) => setSettings({ city: e.target.value })}
                placeholder="City (e.g. Tokyo)"
                className="bg-white/5 rounded-md px-3 py-1.5 text-sm outline-none w-64"
              />
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-xs text-muted shrink-0">Units</span>
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSettings({ temperatureUnit: "celsius" })}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-mono transition",
                      settings.temperatureUnit === "celsius"
                        ? "bg-accent/25 text-accent"
                        : "text-subtext hover:bg-white/5"
                    )}
                  >
                    Celsius °C
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ temperatureUnit: "fahrenheit" })}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-mono transition border-l border-white/10",
                      settings.temperatureUnit === "fahrenheit"
                        ? "bg-accent/25 text-accent"
                        : "text-subtext hover:bg-white/5"
                    )}
                  >
                    Fahrenheit °F
                  </button>
                </div>
              </div>
            </Section>
            <Section
              title="Fastfetch logo"
              hint="ASCII logo used by the `fastfetch` (alias `neofetch`, `ff`) terminal command."
            >
              <FastfetchLogoPicker />
            </Section>

            <Section
              title="Recommendations"
              hint="Based on bookmarks you click here. Browsers don't allow pages to read real browser history, so this is local-only."
            >
              <RecommendationsRow />
            </Section>

            <Section title="Reset" hint="Wipe all stored data.">
              <button
                onClick={() => {
                  if (confirm("Wipe everything?")) {
                    localStorage.removeItem("hyprstart-state");
                    localStorage.removeItem("nebula-os-state");
                    location.reload();
                  }
                }}
                className="text-sm px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 transition"
              >
                Reset all data
              </button>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function SideItem({
  icon,
  active,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition text-left",
        active ? "bg-accent/15 text-accent" : "hover:bg-white/5 text-subtext"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3">
        <div className="text-sm font-medium">{title}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm">{label}</span>
      <span
        onClick={() => onChange(!value)}
        className={clsx(
          "relative inline-block w-9 h-5 rounded-full transition",
          value ? "bg-accent" : "bg-white/15"
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition",
            value ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--accent))]"
      />
    </label>
  );
}

function FastfetchLogoPicker() {
  const current = useStore((s) => s.settings.fastfetchLogo);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {LOGOS.map((l) => {
        const active = l.id === current;
        // small preview: 6 lines centered
        const previewLines = pickPreview(l.lines, 6);
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setSettings({ fastfetchLogo: l.id })}
            className={clsx(
              "relative rounded-xl overflow-hidden border p-2 bg-base/60 transition text-left h-24 flex items-center gap-2",
              active
                ? "border-accent ring-1 ring-accent/40"
                : "border-white/5 hover:border-white/20"
            )}
          >
            <pre
              className="text-[6px] leading-[7px] font-mono whitespace-pre overflow-hidden"
              style={{ color: previewColor(l.accent) }}
            >
              {previewLines.join("\n")}
            </pre>
            <div className="ml-auto pr-1">
              <div className="text-xs font-mono text-text">{l.name}</div>
              <div className="text-[10px] text-muted">{l.id}</div>
            </div>
            {active && (
              <Check className="absolute top-1.5 right-1.5 text-accent" size={12} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function pickPreview(lines: string[], n: number): string[] {
  if (lines.length <= n) return lines;
  const start = Math.floor((lines.length - n) / 2);
  return lines.slice(start, start + n);
}

// Map our ANSI accent codes back to a CSS color for the small preview.
// Falls back to the active accent CSS variable when we don't recognise it.
function previewColor(ansi: string): string {
  if (ansi.includes("[31")) return "#f38ba8";
  if (ansi.includes("[32")) return "#a6e3a1";
  if (ansi.includes("[33")) return "#f9e2af";
  if (ansi.includes("[34")) return "rgb(var(--accent))";
  if (ansi.includes("[35")) return "#cba6f7";
  if (ansi.includes("[36")) return "#94e2d5";
  if (ansi.includes("[90")) return "#9399b2";
  if (ansi.includes("[91")) return "#f38ba8";
  if (ansi.includes("[93")) return "#f9e2af";
  if (ansi.includes("[94")) return "#89b4fa";
  if (ansi.includes("[95")) return "#cba6f7";
  if (ansi.includes("[96")) return "#94e2d5";
  if (ansi.includes("208")) return "#fab387";
  return "rgb(var(--accent))";
}

function RecommendationsRow() {
  const visits = useStore((s) => s.visits);
  const clearVisits = useStore((s) => s.clearVisits);
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-subtext tabular-nums">
        {visits.length} click{visits.length === 1 ? "" : "s"} tracked
      </span>
      <button
        onClick={() => {
          if (confirm("Clear visit history? Recommendations will reset.")) {
            clearVisits();
          }
        }}
        className="text-sm px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition text-subtext"
      >
        Clear visit history
      </button>
    </div>
  );
}

function invertColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#1e1e2e" : "#cdd6f4";
}
