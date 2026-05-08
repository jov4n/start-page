import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Hash,
  Inbox,
  MessageSquare,
  Newspaper,
  RefreshCcw,
  Search,
  TriangleAlert,
} from "lucide-react";
import clsx from "clsx";
import {
  CHANNELS,
  fetchChannel,
  hostnameOf,
  timeAgo,
  type ChannelId,
  type FeedItem,
} from "../lib/feeds";

type ChannelKey = ChannelId | "all";

const CHANNEL_ITEMS: Array<{ id: ChannelKey; name: string; icon: React.ReactNode }> = [
  { id: "all", name: "All news", icon: <Inbox size={14} /> },
  ...CHANNELS.map((c) => ({
    id: c.id as ChannelKey,
    name: c.name,
    icon: <Hash size={14} />,
  })),
];

export function ReaderApp() {
  const [active, setActive] = useState<ChannelKey>("tech");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [errors, setErrors] = useState<{ source: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [, force] = useState(0);
  const reqId = useRef(0);

  async function load(channel: ChannelKey, hard = false) {
    setLoading(true);
    const myReq = ++reqId.current;
    const r = await fetchChannel(channel, hard);
    if (myReq !== reqId.current) return; // stale
    setItems(r.items);
    setErrors(r.errors);
    setFetchedAt(r.fetchedAt);
    setLoading(false);
  }

  useEffect(() => {
    load(active, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // tick to update relative times
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.source.toLowerCase().includes(q) ||
        hostnameOf(it.url).toLowerCase().includes(q)
    );
  }, [items, filter]);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-52 border-r border-white/5 bg-mantle/40 flex flex-col">
        <div className="p-3 border-b border-white/5 flex items-center gap-2">
          <Newspaper size={14} className="text-accent" />
          <span className="text-xs uppercase tracking-[0.25em] text-subtext font-mono">
            channels
          </span>
        </div>
        <div className="p-2 flex-1 overflow-auto">
          {CHANNEL_ITEMS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={clsx(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition text-left mb-0.5",
                active === c.id
                  ? "bg-accent/15 text-accent"
                  : "hover:bg-white/5 text-subtext"
              )}
            >
              <span className="opacity-70">{c.icon}</span>
              <span className="truncate">{c.name}</span>
              {active === c.id && (
                <span className="ml-auto text-[10px] tabular-nums text-muted">
                  {filtered.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-white/5 text-[10px] text-muted font-mono leading-relaxed">
          {fetchedAt
            ? `Updated ${timeAgo(fetchedAt)} ago`
            : "Loading…"}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded-lg pl-7 pr-3 py-1.5 text-sm outline-none transition"
            />
          </div>
          <button
            onClick={() => load(active, true)}
            disabled={loading}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCcw size={12} className={clsx(loading && "animate-spin-slow")} />
            Refresh
          </button>
        </div>

        {errors.length > 0 && (
          <div className="px-4 py-1.5 text-[11px] text-yellow-300/90 bg-yellow-300/5 border-b border-yellow-300/10 flex items-center gap-2">
            <TriangleAlert size={12} />
            <span>
              {errors.length} source{errors.length === 1 ? "" : "s"} failed:{" "}
              {errors.map((e) => e.source).join(", ")}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading && filtered.length === 0 ? (
            <SkeletonList />
          ) : filtered.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted text-sm">
              No items.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map((it, i) => (
                <ItemRow key={it.id} item={it} index={i + 1} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, index }: { item: FeedItem; index: number }) {
  const host = hostnameOf(item.url);
  return (
    <li className="px-4 py-3 hover:bg-white/3 transition group">
      <div className="flex items-start gap-3">
        <span className="text-[10px] text-muted/60 font-mono tabular-nums w-6 text-right pt-0.5">
          {index.toString().padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] leading-snug text-text hover:text-accent transition group-hover:underline decoration-accent/40 underline-offset-2"
          >
            {item.title}
          </a>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-subtext">
              {item.source}
            </span>
            {host && <span>{host}</span>}
            <span>·</span>
            <span title={new Date(item.ts).toLocaleString()}>
              {timeAgo(item.ts)} ago
            </span>
            {item.score !== undefined && (
              <>
                <span>·</span>
                <span className="text-accent2/80">▲ {item.score}</span>
              </>
            )}
            {item.numComments !== undefined && (
              <>
                <span>·</span>
                {item.comments ? (
                  <a
                    href={item.comments}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent inline-flex items-center gap-1"
                  >
                    <MessageSquare size={10} />
                    {item.numComments}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare size={10} />
                    {item.numComments}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition text-muted hover:text-accent"
          title="Open"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-white/5">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="px-4 py-3 flex gap-3 animate-pulse-soft">
          <span className="w-6" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/8 rounded w-[70%]" />
            <div className="h-2 bg-white/5 rounded w-[40%]" />
          </div>
        </li>
      ))}
    </ul>
  );
}
