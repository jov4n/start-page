import type { Bookmark } from "../types";

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  // Work
  { id: "b1", title: "GitHub", url: "https://github.com", category: "Work", color: "#1f2937" },
  { id: "b2", title: "Stack Overflow", url: "https://stackoverflow.com", category: "Work", color: "#f48024" },
  { id: "b3", title: "MDN", url: "https://developer.mozilla.org", category: "Work", color: "#000" },
  { id: "b4", title: "Linear", url: "https://linear.app", category: "Work", color: "#5e6ad2" },
  { id: "b5", title: "Notion", url: "https://notion.so", category: "Work", color: "#111" },

  // Social
  { id: "b6", title: "Reddit", url: "https://reddit.com", category: "Social", color: "#ff4500" },
  { id: "b7", title: "X", url: "https://x.com", category: "Social", color: "#0f1419" },
  { id: "b8", title: "Hacker News", url: "https://news.ycombinator.com", category: "Social", color: "#ff6600" },
  { id: "b9", title: "Discord", url: "https://discord.com/app", category: "Social", color: "#5865f2" },

  // Watch
  { id: "b10", title: "YouTube", url: "https://youtube.com", category: "Watch", color: "#ff0000" },
  { id: "b11", title: "Twitch", url: "https://twitch.tv", category: "Watch", color: "#9146ff" },
  { id: "b12", title: "Netflix", url: "https://netflix.com", category: "Watch", color: "#e50914" },

  // Read
  { id: "b13", title: "Wikipedia", url: "https://wikipedia.org", category: "Read", color: "#000" },
  { id: "b14", title: "Medium", url: "https://medium.com", category: "Read", color: "#111" },
  { id: "b15", title: "Substack", url: "https://substack.com", category: "Read", color: "#ff6719" },

  // Tools
  { id: "b16", title: "ChatGPT", url: "https://chat.openai.com", category: "Tools", color: "#10a37f" },
  { id: "b17", title: "Claude", url: "https://claude.ai", category: "Tools", color: "#cc785c" },
  { id: "b18", title: "Cursor", url: "https://cursor.com", category: "Tools", color: "#000" },
  { id: "b19", title: "Vercel", url: "https://vercel.com", category: "Tools", color: "#000" },
  { id: "b20", title: "Figma", url: "https://figma.com", category: "Tools", color: "#0acf83" },
];
