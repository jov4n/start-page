import { useEffect, useState } from "react";
import { useStore } from "../store";
import { WALLPAPERS } from "../data/wallpapers";

export function Wallpaper() {
  const settings = useStore((s) => s.settings);
  const wp = WALLPAPERS.find((w) => w.id === settings.wallpaperId) ?? WALLPAPERS[0];
  const url = settings.wallpaperUrl?.trim() || wp.url;

  const [current, setCurrent] = useState(url);
  const [previous, setPrevious] = useState<string | null>(null);

  useEffect(() => {
    if (url === current) return;
    setPrevious(current);
    setCurrent(url);
    const t = setTimeout(() => setPrevious(null), 700);
    return () => clearTimeout(t);
  }, [url, current]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-crust pointer-events-none">
      {previous && (
        <div
          className="absolute inset-0 pointer-events-none bg-cover bg-center transition-opacity duration-700"
          style={{
            backgroundImage: `url("${previous}")`,
            filter: `blur(${settings.blur}px)`,
            opacity: 0,
          }}
        />
      )}
      <div
        key={current}
        className="absolute inset-0 pointer-events-none bg-cover bg-center transition-opacity duration-700 animate-fade-in"
        style={{
          backgroundImage: `url("${current}")`,
          filter: `blur(${settings.blur}px)`,
        }}
      />
      {/* Hyprland-style themed darkening that respects the palette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `rgb(var(--crust) / ${settings.dim})`,
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      {/* Faint grid */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
    </div>
  );
}
