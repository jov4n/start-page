import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { ENGINES } from "../data/engines";
import { useStore } from "../store";
import type { SearchEngineId } from "../types";

export function SearchApp() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [q, setQ] = useState("");
  const [engine, setEngine] = useState<SearchEngineId>(settings.defaultEngine);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    const en = ENGINES.find((e) => e.id === engine) ?? ENGINES[0];
    window.open(en.url(q), "_blank", "noopener");
  }

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      <form
        onSubmit={submit}
        className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-white/10"
      >
        <Search size={18} className="text-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the web…"
          className="flex-1 bg-transparent outline-none text-base"
        />
        <button
          type="submit"
          className="text-sm px-3 py-1.5 rounded-md bg-accent/30 hover:bg-accent/40 text-accent transition"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {ENGINES.map((e) => {
          const active = engine === e.id;
          return (
            <button
              key={e.id}
              onClick={() => {
                setEngine(e.id);
                setSettings({ defaultEngine: e.id });
              }}
              className={
                "text-xs px-3 py-1.5 rounded-full transition border " +
                (active
                  ? "bg-accent/20 border-accent/60 text-accent"
                  : "bg-white/5 border-transparent hover:bg-white/10 text-muted")
              }
            >
              {e.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
