import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Hash, Globe, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store";
import { APPS } from "../apps/registry";
import type { AppId, Bookmark } from "../types";
import { ENGINES } from "../data/engines";

type ResultKind = "app" | "bookmark" | "ws" | "web";

interface Result {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  run: () => void;
}

export function Launcher() {
  const open = useStore((s) => s.launcherOpen);
  const setOpen = useStore((s) => s.setLauncherOpen);
  const openApp = useStore((s) => s.openApp);
  const bookmarks = useStore((s) => s.bookmarks);
  const settings = useStore((s) => s.settings);
  const switchWorkspace = useStore((s) => s.switchWorkspace);
  const recordVisit = useStore((s) => s.recordVisit);

  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const apps = useMemo(
    () =>
      (Object.values(APPS) as Array<typeof APPS[AppId]>).filter(
        (a) => a.showInLauncher
      ),
    []
  );

  const query = q.trim().toLowerCase();
  const results: Result[] = useMemo(() => {
    const r: Result[] = [];

    // Workspace shortcut: ":1" .. ":9"
    const wsMatch = q.match(/^:(\d)$/);
    if (wsMatch) {
      const ws = Number(wsMatch[1]);
      r.push({
        kind: "ws",
        id: `ws${ws}`,
        title: `Switch to workspace ${ws}`,
        icon: <Hash size={16} className="text-accent2" />,
        run: () => switchWorkspace(ws),
      });
    }

    apps
      .filter(
        (a) =>
          !query ||
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      )
      .forEach((a) =>
        r.push({
          kind: "app",
          id: a.id,
          title: a.name,
          subtitle: a.description,
          icon: <a.icon size={16} className="text-accent" />,
          run: () => openApp(a.id),
        })
      );

    if (query) {
      bookmarks
        .filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            b.url.toLowerCase().includes(query) ||
            b.category.toLowerCase().includes(query)
        )
        .slice(0, 8)
        .forEach((b: Bookmark) =>
          r.push({
            kind: "bookmark",
            id: b.id,
            title: b.title,
            subtitle: hostnameOf(b.url),
            icon: <FaviconChip url={b.url} />,
            run: () => {
              recordVisit(b.id);
              window.open(b.url, "_blank", "noopener");
            },
          })
        );

      const engine = ENGINES.find((e) => e.id === settings.defaultEngine) ?? ENGINES[0];
      r.push({
        kind: "web",
        id: "web",
        title: `Search the web for “${q}”`,
        subtitle: engine.name,
        icon: <Globe size={16} className="text-accent3" />,
        run: () => window.open(engine.url(q), "_blank", "noopener"),
      });
    }

    return r;
  }, [
    apps,
    bookmarks,
    query,
    q,
    settings.defaultEngine,
    switchWorkspace,
    openApp,
    recordVisit,
  ]);

  useEffect(() => {
    setSel(0);
  }, [q]);

  function commitIdx(i: number) {
    const r = results[i];
    if (!r) return;
    r.run();
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(results.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commitIdx(sel);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[120] flex items-start justify-center pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          <motion.div
            className="relative w-[640px] max-w-[92vw] glass-strong rounded-2xl border border-white/10 overflow-hidden hypr-border-soft"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.05, 0.9, 0.1, 1.05] }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Search size={16} className="text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Type to search apps, bookmarks, the web…"
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted/70"
              />
              <kbd className="text-[10px] text-muted bg-white/5 px-1.5 py-0.5 rounded font-mono">
                ESC
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-auto py-1">
              {results.length === 0 && (
                <div className="px-4 py-10 text-center text-muted text-sm">
                  <Sparkles className="mx-auto mb-2 text-accent" size={18} />
                  No results. Try <code className="text-accent">:2</code> to switch
                  workspace, or type to search.
                </div>
              )}
              {results.map((r, i) => (
                <button
                  key={`${r.kind}-${r.id}`}
                  onClick={() => commitIdx(i)}
                  onMouseEnter={() => setSel(i)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-2 text-left transition",
                    sel === i ? "bg-accent/15 text-text" : "hover:bg-white/5"
                  )}
                >
                  <span className="w-6 flex items-center justify-center">
                    {r.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{r.title}</div>
                    {r.subtitle && (
                      <div className="text-[11px] text-muted truncate">
                        {r.subtitle}
                      </div>
                    )}
                  </div>
                  <span
                    className={clsx(
                      "text-[10px] uppercase tracking-widest",
                      sel === i ? "text-accent" : "text-muted"
                    )}
                  >
                    {r.kind === "app"
                      ? "open"
                      : r.kind === "bookmark"
                      ? "go"
                      : r.kind === "ws"
                      ? "switch"
                      : "search"}
                  </span>
                  {sel === i && <ArrowRight size={13} className="text-accent" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 py-2 text-[10px] text-muted bg-mantle/40 border-t border-white/5 font-mono">
              <span>↑↓ navigate · ↵ run · :N switch workspace</span>
              <span>{results.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FaviconChip({ url, size = 14 }: { url: string; size?: number }) {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* */
  }
  const src = host
    ? `https://www.google.com/s2/favicons?sz=64&domain=${host}`
    : "";
  return (
    <div
      className="rounded-md bg-white/5 flex items-center justify-center overflow-hidden"
      style={{ width: size + 8, height: size + 8 }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="rounded-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span
          className="rounded-sm bg-accent/40"
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
}

// Backwards-compatible export name
export const Favicon = FaviconChip;

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
