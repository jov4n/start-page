import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  "starting compositor",
  "loading config /etc/hyprstart.conf",
  "spawning waybar",
  "registering hotkeys",
  "mounting state",
  "ready",
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(onDone, 320);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 180 + Math.random() * 140);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <motion.div
      className="absolute inset-0 z-[310] bg-crust flex flex-col items-center justify-center text-text font-mono"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-10 relative">
        <div className="hypr-border rounded-2xl">
          <div className="w-20 h-20 rounded-2xl bg-mantle flex items-center justify-center">
            <Logo />
          </div>
        </div>
      </div>

      <div className="w-80 space-y-1.5 text-xs">
        {STEPS.slice(0, step).map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-muted">[</span>
            <span className="text-accent4">ok</span>
            <span className="text-muted">]</span>
            <span className="text-subtext">{s}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 text-[10px] text-muted uppercase tracking-[0.4em]">
        hyprstart · v1.0
      </div>
    </motion.div>
  );
}

function Logo() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="bl" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" />
          <stop offset="100%" stopColor="rgb(var(--accent2))" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z"
        fill="url(#bl)"
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
