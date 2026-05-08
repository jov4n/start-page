import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useStore } from "../store";
import { WALLPAPERS } from "../data/wallpapers";

function formatTime(d: Date, use24h: boolean) {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24h,
  });
}

export function LockScreen() {
  const locked = useStore((s) => s.locked);
  const setLocked = useStore((s) => s.setLocked);
  const settings = useStore((s) => s.settings);
  const [now, setNow] = useState(new Date());
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        setLocked(false);
      } else {
        setHint(true);
        setTimeout(() => setHint(false), 800);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, setLocked]);

  const wp = WALLPAPERS.find((w) => w.id === settings.wallpaperId) ?? WALLPAPERS[0];
  const url = settings.wallpaperUrl?.trim() || wp.url;

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          className="absolute inset-0 z-[300] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${url}")`, filter: "blur(22px) saturate(120%)" }}
          />
          <div className="absolute inset-0 bg-crust/65" />

          <motion.div
            className="relative flex flex-col items-center gap-6"
            animate={hint ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-[12px] uppercase tracking-[0.4em] text-subtext">
              locked
            </div>
            <div className="text-7xl font-light tabular-nums">
              {formatTime(now, settings.use24h)}
            </div>
            <div className="text-sm text-subtext">
              {now.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <button
              onClick={() => setLocked(false)}
              className="mt-4 px-5 py-2.5 rounded-full glass-strong border border-white/10 text-sm flex items-center gap-2 hover:bg-white/8 transition"
            >
              <Lock size={14} /> Press any key to unlock
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
