import { AnimatePresence, motion } from "framer-motion";
import { Lock, LogOut, Moon, Power, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "../store";

const ACTIONS = [
  { id: "lock", label: "Lock", icon: Lock, hint: "L" },
  { id: "suspend", label: "Sleep", icon: Moon, hint: "S" },
  { id: "logout", label: "Log out", icon: LogOut, hint: "O" },
  { id: "reboot", label: "Reboot", icon: RefreshCcw, hint: "R" },
  { id: "shutdown", label: "Shut down", icon: Power, hint: "P" },
] as const;

export function PowerMenu() {
  const open = useStore((s) => s.powerMenuOpen);
  const setOpen = useStore((s) => s.setPowerMenuOpen);
  const setLocked = useStore((s) => s.setLocked);
  const pushToast = useStore((s) => s.pushToast);

  function run(id: string) {
    setOpen(false);
    if (id === "lock" || id === "suspend") setLocked(true);
    else if (id === "logout") {
      pushToast({ title: "Goodbye", body: "See you soon.", tone: "info" });
      setLocked(true);
    } else if (id === "reboot") location.reload();
    else if (id === "shutdown") {
      document.body.style.transition = "opacity 0.4s";
      document.body.style.opacity = "0";
      setTimeout(() => {
        document.body.style.opacity = "1";
        setLocked(true);
      }, 500);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      const a = ACTIONS.find((a) => a.hint.toLowerCase() === e.key.toLowerCase());
      if (a) run(a.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[115] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: [0.05, 0.9, 0.1, 1.05] }}
            className="relative glass-strong rounded-2xl p-6 border border-white/10 hypr-border-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-[10px] uppercase tracking-[0.3em] text-muted mb-4">
              Session
            </div>
            <div className="flex items-center gap-3">
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => run(a.id)}
                    className="group relative w-24 h-24 rounded-xl tile flex flex-col items-center justify-center gap-2 bezier-wind transition"
                  >
                    <Icon
                      size={26}
                      strokeWidth={1.4}
                      className="text-subtext group-hover:text-accent transition"
                    />
                    <span className="text-xs text-text">{a.label}</span>
                    <kbd className="absolute top-1.5 right-1.5 text-[9px] text-muted bg-white/5 rounded px-1">
                      {a.hint}
                    </kbd>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
