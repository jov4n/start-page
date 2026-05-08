import { useMemo, useState } from "react";
import { Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { Favicon } from "../components/Launcher";
import { getRecommendations } from "../lib/recommend";

export function QuickLinks() {
  const bookmarks = useStore((s) => s.bookmarks);
  const visits = useStore((s) => s.visits);
  const addBookmark = useStore((s) => s.addBookmark);
  const removeBookmark = useStore((s) => s.removeBookmark);
  const recordVisit = useStore((s) => s.recordVisit);
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", url: "", category: "Work" });

  const categories = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => set.add(b.category));
    return Array.from(set);
  }, [bookmarks]);

  const filtered = bookmarks.filter(
    (b) =>
      !filter ||
      b.title.toLowerCase().includes(filter.toLowerCase()) ||
      b.url.toLowerCase().includes(filter.toLowerCase())
  );

  const recommendations = useMemo(
    () => getRecommendations(bookmarks, visits, 6),
    [bookmarks, visits]
  );
  const showRecs = !filter && recommendations.length > 0;

  function commit() {
    if (!draft.title.trim() || !draft.url.trim()) return;
    let url = draft.url.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    addBookmark({ ...draft, title: draft.title.trim(), url });
    setDraft({ title: "", url: "", category: draft.category });
    setAdding(false);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter bookmarks…"
            className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded-lg pl-7 pr-3 py-1.5 text-sm outline-none transition"
          />
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent transition"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {adding && (
        <div className="px-4 py-3 border-b border-white/5 bg-mantle/60 flex flex-wrap items-end gap-2">
          <Field label="Title">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="bg-white/5 rounded-md px-2 py-1 text-sm outline-none w-44"
              autoFocus
            />
          </Field>
          <Field label="URL">
            <input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              className="bg-white/5 rounded-md px-2 py-1 text-sm outline-none w-72"
              placeholder="example.com"
            />
          </Field>
          <Field label="Category">
            <input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="bg-white/5 rounded-md px-2 py-1 text-sm outline-none w-32"
              list="categories"
            />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <button
            onClick={commit}
            className="text-sm px-3 py-1.5 rounded-md bg-accent/30 hover:bg-accent/40 text-accent transition"
          >
            Save
          </button>
          <button
            onClick={() => setAdding(false)}
            className="text-sm px-3 py-1.5 rounded-md hover:bg-white/5 text-muted"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {showRecs && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2 flex items-center gap-2">
              <Sparkles size={12} className="text-accent2" />
              <span>Recommended for you</span>
              <span className="flex-1 h-px bg-white/5" />
              <span className="text-muted/70">{recommendations.length}</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
              {recommendations.map((r) => (
                <a
                  key={r.bookmark.id}
                  href={r.bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordVisit(r.bookmark.id)}
                  className="tile rounded-xl p-3 group flex items-center gap-2.5 relative"
                >
                  <Favicon url={r.bookmark.url} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{r.bookmark.title}</div>
                    <div className="text-[11px] text-accent2/80 truncate">
                      {r.reason}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {categories.map((cat) => {
          const items = filtered.filter((b) => b.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2 flex items-center gap-2">
                <span>{cat}</span>
                <span className="flex-1 h-px bg-white/5" />
                <span className="text-muted/70">{items.length}</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
                {items.map((b) => (
                  <a
                    key={b.id}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordVisit(b.id)}
                    className="tile rounded-xl p-3 group flex items-center gap-2.5 relative"
                  >
                    <Favicon url={b.url} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">{b.title}</div>
                      <div className="text-[11px] text-muted truncate">
                        {hostnameOf(b.url)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeBookmark(b.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-muted py-12">No bookmarks match.</div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
      {children}
    </label>
  );
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
