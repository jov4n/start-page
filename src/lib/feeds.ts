/**
 * Feed library — pulls news from JSON-friendly sources (HN Algolia, Lobsters,
 * Reddit) so we don't need a CORS proxy for the core experience. RSS feeds are
 * supported as a soft-fail fallback via a public CORS proxy.
 */

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  channel: ChannelId;
  ts: number;          // unix ms
  comments?: string;
  score?: number;
  numComments?: number;
  author?: string;
  summary?: string;
}

export type ChannelId = "tech" | "ai" | "security" | "webdev" | "design";

export interface Channel {
  id: ChannelId;
  name: string;
}

export const CHANNELS: Channel[] = [
  { id: "tech", name: "Tech" },
  { id: "ai", name: "AI" },
  { id: "security", name: "Security" },
  { id: "webdev", name: "Web Dev" },
  { id: "design", name: "Design" },
];

interface FeedSource {
  id: string;
  name: string;
  channel: ChannelId;
  fetch: () => Promise<FeedItem[]>;
}

// ============================================================
//                    FETCH HELPERS
// ============================================================

// Public CORS proxies used in fallback order. Most JSON-style sources we use
// (Reddit, Lobsters) refuse direct browser fetches; the HN Algolia API does
// allow CORS so it bypasses the proxy entirely.
const PROXIES = [
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

async function fetchVia(
  url: string,
  opts: { proxy?: boolean; signal?: AbortSignal } = {}
): Promise<Response> {
  // Direct first if the host is known CORS-friendly
  if (!opts.proxy) {
    const r = await fetch(url, { signal: opts.signal });
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r;
  }
  // Try each proxy in order, return on first success
  let lastErr: unknown;
  for (const proxify of PROXIES) {
    try {
      const r = await fetch(proxify(url), { signal: opts.signal });
      if (r.ok) return r;
      lastErr = new Error(`${proxify(url)}: ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All proxies failed");
}

async function jsonGet<T>(
  url: string,
  opts: { proxy?: boolean; signal?: AbortSignal } = {}
): Promise<T> {
  const r = await fetchVia(url, opts);
  return r.json();
}

async function rssGet(rssUrl: string, signal?: AbortSignal): Promise<string> {
  const r = await fetchVia(rssUrl, { proxy: true, signal });
  return r.text();
}

function parseRss(xml: string, source: string, channel: ChannelId): FeedItem[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  // Atom?
  const atomEntries = Array.from(doc.querySelectorAll("entry"));
  if (atomEntries.length > 0) {
    return atomEntries.slice(0, 30).map((e, i) => {
      const title = e.querySelector("title")?.textContent?.trim() ?? "Untitled";
      const linkEl =
        e.querySelector('link[rel="alternate"]') ?? e.querySelector("link");
      const url =
        linkEl?.getAttribute("href") ?? linkEl?.textContent?.trim() ?? "#";
      const updated =
        e.querySelector("updated")?.textContent ??
        e.querySelector("published")?.textContent ??
        "";
      return {
        id: `${source}-${i}-${url.slice(0, 32)}`,
        title,
        url,
        source,
        channel,
        ts: updated ? Date.parse(updated) || Date.now() : Date.now(),
      };
    });
  }
  return Array.from(doc.querySelectorAll("item")).slice(0, 30).map((it, i) => {
    const title = it.querySelector("title")?.textContent?.trim() ?? "Untitled";
    const url = it.querySelector("link")?.textContent?.trim() ?? "#";
    const date = it.querySelector("pubDate")?.textContent ?? "";
    return {
      id: `${source}-${i}-${url.slice(0, 32)}`,
      title,
      url,
      source,
      channel,
      ts: date ? Date.parse(date) || Date.now() : Date.now(),
    };
  });
}

// ============================================================
//                    SOURCES
// ============================================================

interface AlgoliaHit {
  objectID: string;
  title: string;
  url: string | null;
  story_text?: string | null;
  points: number | null;
  num_comments: number | null;
  author: string | null;
  created_at_i: number;
}

async function fetchHN(query: string, channel: ChannelId): Promise<FeedItem[]> {
  const isFront = query === "__front__";
  const url = isFront
    ? `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=25`
    : `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
        query
      )}&tags=story&hitsPerPage=25`;
  const data = await jsonGet<{ hits: AlgoliaHit[] }>(url);
  return data.hits
    .filter((h) => !!h.title)
    .map((h) => ({
      id: `hn-${h.objectID}`,
      title: h.title,
      url:
        h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: isFront ? "Hacker News" : `HN: ${query}`,
      channel,
      ts: h.created_at_i * 1000,
      score: h.points ?? undefined,
      numComments: h.num_comments ?? undefined,
      author: h.author ?? undefined,
      comments: `https://news.ycombinator.com/item?id=${h.objectID}`,
    }));
}

interface LobstersStory {
  short_id: string;
  title: string;
  url: string;
  score: number;
  comments_url: string;
  comment_count: number;
  created_at: string;
  submitter_user: { username: string };
}

async function fetchLobsters(): Promise<FeedItem[]> {
  const data = await jsonGet<LobstersStory[]>(
    "https://lobste.rs/hottest.json",
    { proxy: true }
  );
  return data.slice(0, 25).map((s) => ({
    id: `lo-${s.short_id}`,
    title: s.title,
    url: s.url || s.comments_url,
    source: "Lobsters",
    channel: "tech",
    ts: Date.parse(s.created_at),
    score: s.score,
    numComments: s.comment_count,
    author: s.submitter_user?.username,
    comments: s.comments_url,
  }));
}

interface RedditChild {
  data: {
    id: string;
    title: string;
    url: string;
    permalink: string;
    score: number;
    num_comments: number;
    created_utc: number;
    author: string;
    selftext?: string;
    is_self?: boolean;
  };
}

async function fetchReddit(
  sub: string,
  channel: ChannelId
): Promise<FeedItem[]> {
  const data = await jsonGet<{ data: { children: RedditChild[] } }>(
    `https://www.reddit.com/r/${sub}/.json?limit=25`,
    { proxy: true }
  );
  return data.data.children
    .filter((c) => !c.data.is_self || c.data.url) // include self posts too via permalink
    .map((c) => {
      const d = c.data;
      const url = d.is_self ? `https://reddit.com${d.permalink}` : d.url;
      return {
        id: `r-${d.id}`,
        title: d.title,
        url,
        source: `r/${sub}`,
        channel,
        ts: d.created_utc * 1000,
        score: d.score,
        numComments: d.num_comments,
        author: d.author,
        comments: `https://reddit.com${d.permalink}`,
      };
    });
}

async function fetchRss(
  rssUrl: string,
  source: string,
  channel: ChannelId
): Promise<FeedItem[]> {
  const xml = await rssGet(rssUrl);
  return parseRss(xml, source, channel);
}

// ============================================================
//                    FEEDS LIST
// ============================================================

const SOURCES: FeedSource[] = [
  // Tech
  { id: "hn-front", name: "Hacker News", channel: "tech", fetch: () => fetchHN("__front__", "tech") },
  { id: "lobsters", name: "Lobsters", channel: "tech", fetch: () => fetchLobsters() },
  { id: "r-programming", name: "r/programming", channel: "tech", fetch: () => fetchReddit("programming", "tech") },
  { id: "r-technology", name: "r/technology", channel: "tech", fetch: () => fetchReddit("technology", "tech") },

  // AI
  { id: "hn-ai", name: "HN: AI", channel: "ai", fetch: () => fetchHN("AI OR LLM OR GPT OR Anthropic OR OpenAI", "ai") },
  { id: "r-ml", name: "r/MachineLearning", channel: "ai", fetch: () => fetchReddit("MachineLearning", "ai") },
  { id: "r-localllama", name: "r/LocalLLaMA", channel: "ai", fetch: () => fetchReddit("LocalLLaMA", "ai") },
  { id: "r-singularity", name: "r/singularity", channel: "ai", fetch: () => fetchReddit("singularity", "ai") },

  // Security
  { id: "hn-sec", name: "HN: Security", channel: "security", fetch: () => fetchHN("security OR vulnerability OR CVE OR exploit", "security") },
  { id: "r-netsec", name: "r/netsec", channel: "security", fetch: () => fetchReddit("netsec", "security") },
  { id: "krebs", name: "Krebs on Security", channel: "security", fetch: () => fetchRss("https://krebsonsecurity.com/feed/", "Krebs", "security") },

  // Web Dev
  { id: "r-webdev", name: "r/webdev", channel: "webdev", fetch: () => fetchReddit("webdev", "webdev") },
  { id: "r-javascript", name: "r/javascript", channel: "webdev", fetch: () => fetchReddit("javascript", "webdev") },

  // Design
  { id: "r-design", name: "r/Design", channel: "design", fetch: () => fetchReddit("Design", "design") },
  { id: "r-ux", name: "r/userexperience", channel: "design", fetch: () => fetchReddit("userexperience", "design") },
];

export const FEED_SOURCES = SOURCES.map(({ id, name, channel }) => ({
  id,
  name,
  channel,
}));

// ============================================================
//                    CACHE
// ============================================================

interface CacheEntry {
  items: FeedItem[];
  ts: number;
}

const CACHE: Map<string, CacheEntry> = new Map();
const STALE_MS = 10 * 60 * 1000; // 10 min

export interface FetchResult {
  items: FeedItem[];
  errors: { source: string; message: string }[];
  fetchedAt: number;
}

export async function fetchSource(
  id: string,
  force = false
): Promise<FeedItem[]> {
  const src = SOURCES.find((s) => s.id === id);
  if (!src) return [];
  const cached = CACHE.get(id);
  if (!force && cached && Date.now() - cached.ts < STALE_MS) return cached.items;
  try {
    const items = await src.fetch();
    CACHE.set(id, { items, ts: Date.now() });
    return items;
  } catch (e) {
    void e;
    return cached?.items ?? [];
  }
}

export async function fetchChannel(
  channel: ChannelId | "all",
  force = false
): Promise<FetchResult> {
  const sources =
    channel === "all" ? SOURCES : SOURCES.filter((s) => s.channel === channel);

  const errors: { source: string; message: string }[] = [];
  const results = await Promise.all(
    sources.map(async (src) => {
      const cached = CACHE.get(src.id);
      if (!force && cached && Date.now() - cached.ts < STALE_MS) return cached.items;
      try {
        const items = await src.fetch();
        CACHE.set(src.id, { items, ts: Date.now() });
        return items;
      } catch (e) {
        errors.push({ source: src.name, message: (e as Error).message });
        return cached?.items ?? [];
      }
    })
  );

  // Dedupe by URL, sort by ts desc
  const seen = new Set<string>();
  const all: FeedItem[] = [];
  for (const items of results) {
    for (const it of items) {
      const key = it.url || it.id;
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(it);
    }
  }
  all.sort((a, b) => b.ts - a.ts);
  return { items: all, errors, fetchedAt: Date.now() };
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.floor((now - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
