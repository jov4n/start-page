import type { Bookmark, Recommendation, Visit } from "../types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

interface ScoreBreakdown {
  freq: number;
  recency: number;
  hour: number;
  dow: number;
  category: number;
  total: number;
  visits: number;
}

/**
 * Score a bookmark based on the user's local visit history.
 * Note: this is local data only — browsers do not allow pages to read the
 * actual browser history. We track clicks the user makes from this start page.
 */
export function scoreBookmark(
  b: Bookmark,
  visits: Visit[],
  now = Date.now(),
  recentCategories: string[] = []
): ScoreBreakdown {
  const my = visits.filter((v) => v.bookmarkId === b.id);
  if (my.length === 0) {
    return { freq: 0, recency: 0, hour: 0, dow: 0, category: 0, total: 0, visits: 0 };
  }

  // Frequency — log scale so a single power-user link doesn't drown out diversity.
  const freq = Math.log2(my.length + 1) * 12;

  // Recency — exponential decay, ~5-day half life.
  const lastTs = Math.max(...my.map((v) => v.ts));
  const daysAgo = (now - lastTs) / DAY_MS;
  const recency = Math.exp(-daysAgo / 5) * 28;

  // Hour-of-day affinity — visits within ±90 min of right-now.
  const nowHour = new Date(now).getHours();
  const nowMin = new Date(now).getMinutes();
  const nowOfDay = nowHour * 60 + nowMin;
  const hourMatches = my.filter((v) => {
    const d = new Date(v.ts);
    const m = d.getHours() * 60 + d.getMinutes();
    const diff = Math.min(Math.abs(m - nowOfDay), 24 * 60 - Math.abs(m - nowOfDay));
    return diff <= 90;
  }).length;
  const hour = Math.min(hourMatches, 8) * 3;

  // Day-of-week affinity.
  const nowDow = new Date(now).getDay();
  const dowMatches = my.filter((v) => new Date(v.ts).getDay() === nowDow).length;
  const dow = Math.min(dowMatches, 8) * 1.5;

  // Category boost: categories of recently visited bookmarks.
  const category = recentCategories.includes(b.category) ? 4 : 0;

  const total = freq + recency + hour + dow + category;
  return { freq, recency, hour, dow, category, total, visits: my.length };
}

export function getRecommendations(
  bookmarks: Bookmark[],
  visits: Visit[],
  limit = 6,
  now = Date.now()
): Recommendation[] {
  // Categories of last 10 visits, oldest first (older counts less)
  const recent = [...visits].sort((a, b) => b.ts - a.ts).slice(0, 10);
  const recentCategories = recent
    .map((v) => bookmarks.find((b) => b.id === v.bookmarkId)?.category)
    .filter((c): c is string => !!c);

  const scored = bookmarks.map((b) => {
    const s = scoreBookmark(b, visits, now, recentCategories);
    return { bookmark: b, score: s.total, reason: pickReason(s, now) };
  });

  // If user has no visits yet, return first N as cold-start defaults.
  const hasVisits = visits.length > 0;
  if (!hasVisits) {
    return bookmarks.slice(0, limit).map((b) => ({
      bookmark: b,
      score: 0,
      reason: "Suggested",
    }));
  }

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function pickReason(s: ScoreBreakdown, now: number) {
  if (s.visits === 0) return "Suggested";
  // Pick the dominant signal as the reason.
  const max = Math.max(s.freq, s.recency, s.hour, s.dow);
  if (max === s.recency) {
    const lastAgo = now; // not used
    void lastAgo;
    if (s.recency > 22) return "Just now";
    if (s.recency > 12) return "Recently visited";
    return "Visited recently";
  }
  if (max === s.freq && s.visits >= 5) return "Frequently visited";
  if (max === s.hour) return "Usual at this hour";
  if (max === s.dow) return "Usual on this day";
  return s.visits > 1 ? `Visited ${s.visits}×` : "Visited";
}

/**
 * Trim the visits log so it doesn't grow forever. Keep last N or last 90 days,
 * whichever is larger.
 */
export function trimVisits(visits: Visit[], maxN = 1500): Visit[] {
  const cutoff = Date.now() - 90 * DAY_MS;
  const recent = visits.filter((v) => v.ts >= cutoff);
  if (recent.length >= maxN) return recent.slice(-maxN);
  // Top up with older ones up to maxN total
  return visits.slice(-maxN);
}

void HOUR_MS; // exported indirectly via trimming logic if needed
