import { useMemo, useState } from "react";
import {
  ChevronRight,
  Folder,
  HardDrive,
  Home,
  Star,
} from "lucide-react";
import { useStore } from "../store";
import { Favicon } from "../components/Launcher";

export function FilesApp() {
  const bookmarks = useStore((s) => s.bookmarks);
  const recordVisit = useStore((s) => s.recordVisit);
  const [path, setPath] = useState<string[]>([]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => set.add(b.category));
    return Array.from(set).sort();
  }, [bookmarks]);

  const here = path[0];
  const items = here ? bookmarks.filter((b) => b.category === here) : [];

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-52 border-r border-white/5 p-2 bg-panel/40 space-y-1">
        <SideItem
          icon={<Home size={14} />}
          active={path.length === 0}
          onClick={() => setPath([])}
        >
          Home
        </SideItem>
        <SideItem icon={<Star size={14} />} active={false} onClick={() => setPath([])}>
          Bookmarks
        </SideItem>
        <SideItem icon={<HardDrive size={14} />} active={false} onClick={() => setPath([])}>
          Local
        </SideItem>
        <div className="text-[10px] uppercase tracking-widest text-muted px-2 py-2">
          Categories
        </div>
        {categories.map((c) => (
          <SideItem
            key={c}
            icon={<Folder size={14} />}
            active={here === c}
            onClick={() => setPath([c])}
          >
            {c}
          </SideItem>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 text-sm">
          <button onClick={() => setPath([])} className="hover:text-accent">~</button>
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={12} className="text-muted" />
              <button onClick={() => setPath(path.slice(0, i + 1))} className="hover:text-accent">
                {p}
              </button>
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4">
          {!here ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setPath([c])}
                  className="tile rounded-xl p-3 flex flex-col items-center gap-2"
                >
                  <Folder size={36} className="text-accent/80" strokeWidth={1.2} />
                  <div className="text-sm">{c}</div>
                  <div className="text-[10px] text-muted">
                    {bookmarks.filter((b) => b.category === c).length} items
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {items.map((b) => (
                <a
                  key={b.id}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordVisit(b.id)}
                  className="tile rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                >
                  <Favicon url={b.url} size={28} />
                  <div className="text-sm truncate w-full">{b.title}</div>
                  <div className="text-[10px] text-muted truncate w-full">
                    {hostnameOf(b.url)}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
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
      className={
        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition text-left " +
        (active ? "bg-accent/20 text-accent" : "hover:bg-white/5 text-muted")
      }
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
