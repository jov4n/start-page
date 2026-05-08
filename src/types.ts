export type AppId =
  | "links"
  | "search"
  | "terminal"
  | "settings"
  | "files"
  | "clock"
  | "weather"
  | "notes"
  | "calculator"
  | "monitor"
  | "reader"
  | "games"
  | "vnc"
  | "code"
  | "bitmappery"
  | "about";

export interface VncProfile {
  id: string;
  name: string;
  url: string;          // ws:// or wss:// websockify URL
  password?: string;    // stored locally only — same machine, same browser
  scaleToFit: boolean;
  viewOnly: boolean;
}

export interface CodeFile {
  id: string;
  name: string;        // e.g. "scratch.ts"
  language: string;    // monaco language id
  body: string;
  updatedAt: number;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  workspace: number; // 1..9
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  prevBounds?: { x: number; y: number; w: number; h: number };
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  icon?: string;
  color?: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export type ThemeId = "mocha" | "tokyo" | "rose" | "gruv" | "latte";

export type SearchEngineId =
  | "duckduckgo"
  | "google"
  | "bing"
  | "kagi"
  | "github"
  | "youtube"
  | "wikipedia"
  | "perplexity";

export interface SearchEngine {
  id: SearchEngineId;
  name: string;
  url: (q: string) => string;
}

export interface Wallpaper {
  id: string;
  name: string;
  url: string;
  thumb?: string;
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone?: "info" | "success" | "warn" | "error";
  createdAt: number;
}

export interface Visit {
  bookmarkId: string;
  ts: number;
}

export interface Recommendation {
  bookmark: Bookmark;
  score: number;
  reason: string;
}

export type TemperatureUnit = "celsius" | "fahrenheit";

export interface Settings {
  theme: ThemeId;
  wallpaperId: string;
  wallpaperUrl?: string;
  blur: number;
  dim: number;
  reduceMotion: boolean;
  showSeconds: boolean;
  use24h: boolean;
  defaultEngine: SearchEngineId;
  city?: string;
  temperatureUnit: TemperatureUnit;
  username: string;
  windowGap: number;          // px between tiled windows
  showWindowTitleInBar: boolean;
  rememberDesktop: boolean;   // persist windows/workspace across reloads
  vncProfiles: VncProfile[];
  lastVncProfileId?: string;
  codeRemoteUrl?: string;     // user's code-server URL
  fastfetchLogo: string;      // logo id for the fastfetch terminal command
}
