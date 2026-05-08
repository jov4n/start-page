export function AboutApp() {
  return (
    <div className="h-full p-6 flex flex-col items-center justify-center text-center gap-5">
      <div className="relative">
        <div className="hypr-border rounded-2xl">
          <div className="w-20 h-20 rounded-2xl bg-mantle flex items-center justify-center">
            <Logo />
          </div>
        </div>
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-wide">hyprstart</div>
        <div className="text-xs text-muted">v1.0 · Hyprland-inspired start page</div>
      </div>
      <div className="text-sm text-subtext max-w-sm leading-relaxed">
        A Hyprland-inspired desktop in your browser. Drag windows. Resize from any edge.
        Right-click the desktop. Try the terminal.
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-subtext mt-2 font-mono">
        <Kbd combo="Ctrl+Alt Space / K" desc="Launcher" />
        <Kbd combo="Ctrl+Alt 1–9" desc="Workspaces" />
        <Kbd combo="Ctrl+Alt T" desc="Terminal" />
        <Kbd combo="Ctrl+Alt E" desc="Files" />
        <Kbd combo="Ctrl+Alt L" desc="Lock" />
        <Kbd combo="Ctrl+Alt P" desc="Power menu" />
        <Kbd combo="Ctrl+Alt ← / →" desc="Tile halves" />
        <Kbd combo="Ctrl+Alt Shift ↑ / ↓" desc="Top / bottom half" />
        <Kbd combo="Ctrl+Alt ↑ / ↓" desc="Maximize · restore / minimize" />
        <Kbd combo="Ctrl+Alt Shift 1–4" desc="Corners TL·TR·BL·BR" />
        <Kbd combo="Esc" desc="Close menus" />
        <Kbd combo="Right-click" desc="Desktop menu" />
      </div>
    </div>
  );
}

function Kbd({ combo, desc }: { combo: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 justify-start">
      <kbd className="px-1.5 py-0.5 rounded bg-white/8 text-[10px] min-w-[60px] text-center">
        {combo}
      </kbd>
      <span>{desc}</span>
    </div>
  );
}

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="al" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" />
          <stop offset="100%" stopColor="rgb(var(--accent2))" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z"
        fill="url(#al)"
        stroke="rgb(var(--accent))"
        strokeWidth="0.4"
      />
      <path
        d="M12 7 L17 9.5 V14.5 L12 17 L7 14.5 V9.5 Z"
        fill="rgb(var(--mantle))"
        opacity="0.85"
      />
      <circle cx="12" cy="12" r="1.6" fill="rgb(var(--accent))" />
    </svg>
  );
}
