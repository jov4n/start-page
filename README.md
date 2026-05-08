# hyprstart — Hyprland-Inspired Start Page

An interactive desktop start page styled after Hyprland: animated gradient borders on focused windows, workspaces, a single waybar, rofi-style launcher, Catppuccin / Tokyo Night / Rosé Pine / Gruvbox themes, and a fully draggable/resizable window manager.

## Features

### Hyprland-style chrome
- **Animated rotating-conic gradient border** around the focused window (Hyprland's signature look). Inactive windows get a subtle hairline border instead.
- **Single waybar** at the top with: hypr logo + activities, workspace pills 1‑9, focused window title, quick‑launch favorites, CPU/Net/Volume/Battery modules, clock, power button.
- **Workspaces** — switch with `Ctrl+Alt 1‑9`, indicators show which have windows, active expands and glows.
- **Power menu** (`Ctrl+Alt P`) — rofi-style centered modal with Lock / Sleep / Logout / Reboot / Shutdown, fully keyboard driven (`L S O R P` keys).
- **Toast notifications** in the top-right (mako style).
- **Lock screen** with backdrop blur, big clock, "press any key" prompt.
- **Idle / focus screen** with greeting, large clock, search bar, and 6 favorite tiles — fades out as soon as you open windows.

### Themes
- **Catppuccin Mocha** (default), **Tokyo Night**, **Rosé Pine**, **Gruvbox**, **Catppuccin Latte**.
- Themes drive every accent — gradient borders, waybar pills, terminal text, focus rings.

### Window manager
- Drag from the title bar; double-click to maximize.
- 8 resize handles (every edge + every corner).
- Edge snapping with live preview: top → maximize, left/right → half-tile (with configurable gap).
- Adjustable gap between windows (Settings → Appearance).
- Spring open/close animations using Hyprland's "wind" easing.
- Per-workspace window lists, with slide animation between workspaces.

### Apps
- **Quick Links** – categorized bookmarks with add/remove/filter.
- **Search** – DuckDuckGo, Google, Bing, Kagi, GitHub, YouTube, Wikipedia.
- **Terminal** – `help`, `ls bookmarks|apps|wallpapers|themes|workspaces`, `open`, `go`, `search`, `theme mocha|tokyo|rose|gruv|latte`, `wallpaper`, `ws <n>`, `hyprctl`, `cowsay`, history with ↑/↓, `Ctrl+L`.
- **Files** – browses bookmarks like folders.
- **Notes** – multi-note markdown-friendly editor, autosaves to localStorage.
- **Clock** – analog clock + stopwatch + countdown timer.
- **Calculator** – fully keyboard-controlled.
- **System Monitor** – live (simulated) CPU/RAM/Network sparklines.
- **Weather** – real weather via Open-Meteo (no API key); choose **°C or °F** under Settings → System.
- **Paint** – bundled Toast UI image editor (crop, filters, draw, text); runs in-browser — launcher or terminal `paint` / `bitmappery`.
- **Settings** – themes, wallpaper picker (12 + custom URL), blur/dim, window gap, default search engine, weather city & units, full reset.
- **About** – keyboard shortcut cheat-sheet.

### Keyboard shortcuts
| Key | Action |
| --- | --- |
| `Ctrl+Alt+Space` / `Ctrl+Alt+K` | Launcher |
| `Ctrl+Alt 1…9` | Switch workspace |
| `Ctrl+Alt T` | Terminal |
| `Ctrl+Alt E` | Files |
| `Ctrl+Alt L` | Lock |
| `Ctrl+Alt P` | Power menu |
| Right-click | Desktop menu |
| Double-click titlebar | Toggle maximize |
| `↑` / `↓` in launcher | Navigate |
| `:N` in launcher | Switch to workspace N |

Hypr-style **Super** is mapped to **`Ctrl+Alt`** here because browsers often swallow the Win/Cmd key.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
npm run preview
```

## Tech

- **React 19** + **TypeScript** + **Vite**
- **TailwindCSS** with theme tokens via CSS variables
- **Zustand** + persist middleware
- **Framer Motion** for window/launcher animations
- **lucide-react** for icons
- **Open-Meteo** for weather (no key required)

## Customize

Edit `src/data/bookmarks.ts`, `src/data/wallpapers.ts`, `src/data/engines.ts`, and `src/apps/registry.ts` to make it your own. Colors live in `src/index.css` under each `[data-theme=…]` block.
