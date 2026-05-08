import type { SearchEngine } from "../types";

export const ENGINES: SearchEngine[] = [
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "google",
    name: "Google",
    url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "bing",
    name: "Bing",
    url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "kagi",
    name: "Kagi",
    url: (q) => `https://kagi.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "github",
    name: "GitHub",
    url: (q) => `https://github.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "youtube",
    name: "YouTube",
    url: (q) => `https://youtube.com/results?search_query=${encodeURIComponent(q)}`,
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    url: (q) =>
      `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  },
];
