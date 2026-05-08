import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertCircle, XCircle, X } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store";

const ICON = {
  info: Info,
  success: CheckCircle2,
  warn: AlertCircle,
  error: XCircle,
};

const TONE_COLOR = {
  info: "text-accent",
  success: "text-accent4",
  warn: "text-accent3",
  error: "text-red-300",
};

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="absolute top-12 right-3 z-[118] flex flex-col gap-2 w-80 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const tone = t.tone ?? "info";
          const Icon = ICON[tone];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.05, 0.9, 0.1, 1.05] }}
              className="glass-strong rounded-xl p-3 border border-white/5 flex items-start gap-2 pointer-events-auto shadow-xl"
            >
              <Icon size={16} className={clsx("mt-0.5 shrink-0", TONE_COLOR[tone])} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.title}</div>
                {t.body && (
                  <div className="text-xs text-subtext mt-0.5 leading-snug">
                    {t.body}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted hover:text-text transition"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
