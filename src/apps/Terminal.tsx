import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

import { useStore } from "../store";
import { ENGINES } from "../data/engines";
import { WALLPAPERS } from "../data/wallpapers";
import {
  CHANNELS,
  FEED_SOURCES,
  fetchChannel,
  hostnameOf,
  timeAgo,
  type ChannelId,
} from "../lib/feeds";
import { Shell } from "../lib/shell";
import { xtermThemeFromCss } from "../lib/term-theme";
import {
  FASTFETCH_HELP,
  listLogoIds,
  renderFastfetch,
} from "../lib/fastfetch";

const VALID_APPS = [
  "links",
  "search",
  "terminal",
  "files",
  "notes",
  "weather",
  "clock",
  "calculator",
  "monitor",
  "reader",
  "games",
  "vnc",
  "code",
  "bitmappery",
  "settings",
  "about",
] as const;

// ANSI helpers
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
};

const HELP = [
  `${C.bold}Available commands${C.reset}`,
  `  ${C.cyan}help${C.reset}                show this message`,
  `  ${C.cyan}whoami${C.reset}              print current user`,
  `  ${C.cyan}uname${C.reset}               system info`,
  `  ${C.cyan}date${C.reset}                current date and time`,
  `  ${C.cyan}echo${C.reset} <text>         print text`,
  `  ${C.cyan}clear${C.reset}               clear the screen`,
  `  ${C.cyan}ls${C.reset} [bookmarks|apps|wallpapers|themes|workspaces]`,
  `  ${C.cyan}open${C.reset} <app>          open an app (e.g. open notes)`,
  `  ${C.cyan}go${C.reset} <bookmark>       open a bookmark by name`,
  `  ${C.cyan}search${C.reset} <query>      search the web with default engine`,
  `  ${C.cyan}weather${C.reset}             open weather app`,
  `  ${C.cyan}theme${C.reset} <id>          mocha | tokyo | rose | gruv | latte`,
  `  ${C.cyan}wallpaper${C.reset} <id|next|random>`,
  `  ${C.cyan}ws${C.reset} <1-9>            switch workspace`,
  `${C.dim}  tiling${C.reset}              Ctrl+Alt ← / → halves · Shift ↑ / ↓ top/bottom · ↑ max · ↓ restore/min`,
  `${C.dim}  tiling quarters${C.reset}       Ctrl+Alt+Shift 1–4 (TL TR BL BR); workspaces Ctrl+Alt 1–9`,
  `  ${C.cyan}hyprctl${C.reset}             pretend Hyprland status`,
  `  ${C.cyan}news${C.reset} [channel] [-n N] [-r]   tech/ai/security/webdev/design/all`,
  `  ${C.cyan}feeds${C.reset}                        list configured feed sources`,
  `  ${C.cyan}play${C.reset}                         launch the retro emulator`,
  `  ${C.cyan}vnc${C.reset} [name]                   open the noVNC client (optionally autoconnect)`,
  `  ${C.cyan}code${C.reset}                         open the Monaco editor / remote VS Code launchers`,
  `  ${C.cyan}paint${C.reset} | ${C.cyan}bitmappery${C.reset}            bundled Paint editor (Toast UI image editor)`,
  `  ${C.cyan}fastfetch${C.reset} [logo]            display system info (alias: neofetch, ff)`,
  `  ${C.cyan}cowsay${C.reset} <text>`,
  `  ${C.cyan}about${C.reset}`,
  `  ${C.cyan}reset --yes${C.reset}         wipe local data`,
];

function buildBanner(user: string, ws: number) {
  return [
    `${C.brightBlue}                                                              ${C.reset}`,
    `${C.brightBlue}   __                          __             __${C.reset}`,
    `${C.brightBlue}  / /  __ _____  _______  __ _/ /____ ________/ /${C.reset}`,
    `${C.brightBlue} / _ \\/ // / _ \\/ __/ _ \\/ / // __/ _ \`/ __/ __/ ${C.reset}`,
    `${C.brightBlue}/_//_/\\_, / .__/_/  /___/\\_,_/\\__/\\_,_/_/  \\__/  ${C.reset}`,
    `${C.brightBlue}     /___/_/                                     ${C.reset}`,
    `${C.dim}  hyprstart shell · type 'help' to begin · ${user}@hyprstart [ws${ws}]${C.reset}`,
    "",
  ].join("\r\n");
}

function buildPrompt(user: string, ws: number): string {
  return `${C.cyan}${user}${C.reset}${C.gray}@${C.reset}${C.brightBlue}hyprstart${C.reset} ${C.magenta}[ws${ws}]${C.reset}${C.gray}$${C.reset} `;
}

export function TerminalApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const shellRef = useRef<Shell | null>(null);

  // Subscribe just to what affects theme + prompt
  const theme = useStore((s) => s.settings.theme);
  const username = useStore((s) => s.settings.username);
  const workspace = useStore((s) => s.workspace);

  // Refs to current store state for use inside async commands without stale closures
  const promptRef = useRef({ user: username, ws: workspace });
  useEffect(() => {
    promptRef.current = { user: username, ws: workspace };
  }, [username, workspace]);

  // Initialize xterm exactly once per mount
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      theme: xtermThemeFromCss(),
      fontFamily: "JetBrains Mono, Fira Code, ui-monospace, SFMono-Regular, monospace",
      fontSize: 13,
      lineHeight: 1.25,
      cursorBlink: true,
      cursorStyle: "block",
      allowProposedApi: true,
      scrollback: 2000,
      convertEol: true,
      fontWeight: 400,
      fontWeightBold: 600,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    term.open(containerRef.current);
    // Fit after the next frame so the container has dimensions
    requestAnimationFrame(() => {
      try {
        fit.fit();
      } catch {
        /* ignore */
      }
    });

    termRef.current = term;
    fitRef.current = fit;

    term.writeln(buildBanner(promptRef.current.user, promptRef.current.ws));

    let shell: Shell;
    shell = new Shell(
      term,
      (cmd) => runCommand(cmd, term, shell),
      () => buildPrompt(promptRef.current.user, promptRef.current.ws)
    );
    shell.attach();
    shell.prompt();
    shellRef.current = shell;

    // Resize observer
    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        /* ignore */
      }
    });
    ro.observe(containerRef.current);

    // Focus on click
    const onClick = () => term.focus();
    containerRef.current.addEventListener("click", onClick);

    return () => {
      ro.disconnect();
      containerRef.current?.removeEventListener("click", onClick);
      shell.detach();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      shellRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme on the fly when the user changes the system theme
  useEffect(() => {
    const t = termRef.current;
    if (!t) return;
    // small delay so the CSS variables update first
    const id = requestAnimationFrame(() => {
      t.options.theme = xtermThemeFromCss();
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return (
    <div className="h-full w-full bg-mantle/85 p-2 overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

// ============================================================
//                    COMMANDS
// ============================================================
async function runCommand(
  raw: string,
  term: Terminal,
  shell: Shell
): Promise<void> {
  const cmd = raw.trim();
  if (!cmd) return;
  const [name, ...rest] = cmd.split(/\s+/);
  const arg = rest.join(" ");

  const print = (text = "", color?: keyof typeof C) =>
    term.writeln(color ? `${C[color]}${text}${C.reset}` : text);
  const err = (text: string) => term.writeln(`${C.red}${text}${C.reset}`);

  const store = useStore.getState();

  switch (name) {
    case "help":
      HELP.forEach((l) => term.writeln(l));
      break;
    case "whoami":
      print(store.settings.username);
      break;
    case "uname":
      print("Hyprstart 1.0 (Web) | compositor: hyprland-react | shell: hypr-sh");
      break;
    case "hyprctl":
      print(`${C.cyan}active workspace${C.reset}: ${store.workspace}`);
      print(`${C.cyan}monitors${C.reset}: 1 (virtual)`);
      print(`${C.cyan}theme${C.reset}: ${store.settings.theme}`);
      print(`${C.cyan}gap${C.reset}: ${store.settings.windowGap}px`);
      print(`${C.cyan}windows${C.reset}: ${store.windows.length}`);
      break;
    case "date":
      print(new Date().toString());
      break;
    case "echo":
      print(arg);
      break;
    case "clear":
      term.clear();
      break;
    case "ls": {
      const what = (rest[0] || "bookmarks").toLowerCase();
      if (what === "bookmarks" || what === "links") {
        store.bookmarks.forEach((b) =>
          print(
            `  ${C.green}${b.title.padEnd(20)}${C.reset} ${C.gray}${b.url}${C.reset}`
          )
        );
      } else if (what === "apps") {
        VALID_APPS.forEach((a) => print(`  ${C.cyan}${a}${C.reset}`));
      } else if (what === "wallpapers") {
        WALLPAPERS.forEach((w) =>
          print(`  ${C.green}${w.id.padEnd(12)}${C.reset} ${w.name}`)
        );
      } else if (what === "themes") {
        ["mocha", "tokyo", "rose", "gruv", "latte"].forEach((t) =>
          print(`  ${C.cyan}${t}${C.reset}`)
        );
      } else if (what === "workspaces") {
        for (let i = 1; i <= 9; i++) {
          const active = i === store.workspace;
          print(
            `  ${active ? C.brightBlue + "●" : " "}${C.reset} ${C.bold}${i}${C.reset}${
              active ? `${C.dim} (active)${C.reset}` : ""
            }`
          );
        }
      } else {
        err(`unknown listing: ${what}`);
      }
      break;
    }
    case "open": {
      const app = (rest[0] || "").toLowerCase();
      if ((VALID_APPS as readonly string[]).includes(app)) {
        store.openApp(app as never);
        print(`opening ${C.cyan}${app}${C.reset}…`);
      } else {
        err(`unknown app: ${app}. try 'ls apps'`);
      }
      break;
    }
    case "go": {
      const target = arg.toLowerCase();
      const found = store.bookmarks.find(
        (b) =>
          b.title.toLowerCase() === target ||
          b.title.toLowerCase().startsWith(target)
      );
      if (!found) {
        err(`bookmark not found: ${arg}`);
        break;
      }
      store.recordVisit(found.id);
      window.open(found.url, "_blank", "noopener");
      print(`opening ${C.green}${found.title}${C.reset} ${C.gray}(${found.url})${C.reset}`);
      break;
    }
    case "search": {
      if (!arg) {
        err("usage: search <query>");
        break;
      }
      const en =
        ENGINES.find((e) => e.id === store.settings.defaultEngine) ?? ENGINES[0];
      window.open(en.url(arg), "_blank", "noopener");
      print(`searching ${C.cyan}${en.name}${C.reset} for "${arg}"…`);
      break;
    }
    case "weather":
      store.openApp("weather");
      print("opening weather…");
      break;
    case "theme": {
      const t = (rest[0] || "").toLowerCase();
      if (["mocha", "tokyo", "rose", "gruv", "latte"].includes(t)) {
        store.setSettings({ theme: t as never });
        print(`theme set to ${C.cyan}${t}${C.reset}`);
      } else {
        err("usage: theme mocha|tokyo|rose|gruv|latte");
      }
      break;
    }
    case "wallpaper": {
      const id = (rest[0] || "").toLowerCase();
      if (id === "next") {
        const idx = WALLPAPERS.findIndex(
          (w) => w.id === store.settings.wallpaperId
        );
        const next = WALLPAPERS[(idx + 1) % WALLPAPERS.length];
        store.setSettings({ wallpaperId: next.id, wallpaperUrl: undefined });
        print(`wallpaper -> ${C.green}${next.name}${C.reset}`);
      } else if (id === "random") {
        const next = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
        store.setSettings({ wallpaperId: next.id, wallpaperUrl: undefined });
        print(`wallpaper -> ${C.green}${next.name}${C.reset}`);
      } else {
        const wp = WALLPAPERS.find((w) => w.id === id);
        if (!wp) {
          err("unknown wallpaper. try 'ls wallpapers'");
          break;
        }
        store.setSettings({ wallpaperId: wp.id, wallpaperUrl: undefined });
        print(`wallpaper -> ${C.green}${wp.name}${C.reset}`);
      }
      break;
    }
    case "ws": {
      const n = Number(rest[0]);
      if (!n || n < 1 || n > 9) {
        err("usage: ws <1-9>");
        break;
      }
      store.switchWorkspace(n);
      print(`workspace -> ${C.brightBlue}${n}${C.reset}`);
      break;
    }
    case "play":
      store.openApp("games");
      print("launching emulator…");
      break;
    case "vnc": {
      store.openApp("vnc");
      if (rest[0]) {
        const target = rest.join(" ").toLowerCase();
        const profile = store.settings.vncProfiles.find(
          (p) =>
            p.name.toLowerCase() === target ||
            p.name.toLowerCase().startsWith(target)
        );
        if (profile) {
          store.setLastVncProfileId(profile.id);
          print(`opening vnc → ${C.green}${profile.name}${C.reset}`);
        } else {
          err(`no profile matches "${rest.join(" ")}"`);
          if (store.settings.vncProfiles.length > 0) {
            print(`${C.dim}available:${C.reset}`);
            store.settings.vncProfiles.forEach((p) =>
              print(`  ${C.cyan}${p.name}${C.reset} ${C.gray}${p.url}${C.reset}`)
            );
          }
        }
      } else {
        print("opening vnc client…");
      }
      break;
    }
    case "code":
      store.openApp("code");
      print("opening editor…");
      break;
    case "paint":
    case "bitmappery":
    case "photoshop":
      store.openApp("bitmappery");
      print(`opening ${C.cyan}bitmappery${C.reset}…`);
      break;
    case "news":
      await runNews(rest, term, shell);
      break;
    case "feeds": {
      print(`${C.bold}Configured feed sources${C.reset}`);
      CHANNELS.forEach((c) => {
        print(`  ${C.cyan}[${c.name}]${C.reset}`);
        FEED_SOURCES.filter((s) => s.channel === c.id).forEach((s) =>
          print(`    ${C.gray}·${C.reset} ${s.name}`)
        );
      });
      print("");
      print(`Use ${C.cyan}news <channel>${C.reset} to fetch. e.g. ${C.dim}news ai -n 20${C.reset}`);
      print("Channels: all, tech, ai, security, webdev, design");
      print("Flags: -n <N> (limit), -r (force refresh)");
      break;
    }
    case "fastfetch":
    case "neofetch":
    case "ff": {
      const flag = rest[0]?.toLowerCase();
      if (flag === "--help" || flag === "-h") {
        FASTFETCH_HELP.forEach((l) => term.writeln(l));
        break;
      }
      if (flag === "--list" || flag === "-l") {
        const logos = listLogoIds();
        const current = store.settings.fastfetchLogo;
        print(`${C.bold}Available logos${C.reset}`);
        logos.forEach((l) => {
          const active = l.id === current;
          print(
            `  ${active ? C.brightBlue + "●" : " "}${C.reset} ${
              C.cyan
            }${l.id.padEnd(12)}${C.reset} ${C.gray}${l.name}${C.reset}${
              active ? `${C.dim}  (default)${C.reset}` : ""
            }`
          );
        });
        break;
      }
      if (flag === "--set") {
        const target = rest[1]?.toLowerCase();
        if (!target) {
          err("usage: fastfetch --set <logo>");
          break;
        }
        const found = listLogoIds().find((l) => l.id === target);
        if (!found) {
          err(`unknown logo: ${target}. try 'fastfetch --list'`);
          break;
        }
        store.setSettings({ fastfetchLogo: found.id });
        print(`default logo set to ${C.cyan}${found.id}${C.reset}`);
        break;
      }
      // Pick logo: arg overrides setting; setting overrides default.
      let logoId = store.settings.fastfetchLogo;
      if (flag) {
        const found = listLogoIds().find((l) => l.id === flag);
        if (!found) {
          err(`unknown logo: ${flag}. try 'fastfetch --list'`);
          break;
        }
        logoId = found.id;
      }
      term.writeln("");
      term.write(renderFastfetch(logoId));
      term.writeln("");
      break;
    }
    case "cowsay": {
      const text = arg || "moo";
      const top = " " + "_".repeat(text.length + 2);
      const mid = "< " + text + " >";
      const bot = " " + "-".repeat(text.length + 2);
      print(top);
      print(mid);
      print(bot);
      print("        \\   ^__^");
      print("         \\  (oo)\\_______");
      print("            (__)\\       )\\/\\");
      print("                ||----w |");
      print("                ||     ||");
      break;
    }
    case "about":
      store.openApp("about");
      print("opening about…");
      break;
    case "reset":
      if (rest[0] === "--yes") {
        localStorage.removeItem("hyprstart-state");
        localStorage.removeItem("nebula-os-state");
        location.reload();
      } else {
        err("this will wipe bookmarks, notes, settings.");
        err("run 'reset --yes' to confirm.");
      }
      break;
    case "sudo":
      err("nice try.");
      break;
    case "exit":
    case "logout":
      err("you can't exit a browser tab from here. press the X button.");
      break;
    default:
      err(`command not found: ${name}`);
  }
}

async function runNews(args: string[], term: Terminal, _shell: Shell): Promise<void> {
  void _shell;
  let channel: ChannelId | "all" = "all";
  let limit = 12;
  let force = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i].toLowerCase();
    if (a === "-r" || a === "--refresh") force = true;
    else if (a === "-n" && args[i + 1]) {
      limit = Math.max(1, Math.min(50, Number(args[++i]) || 12));
    } else if (
      ["all", "tech", "ai", "security", "webdev", "design"].includes(a)
    ) {
      channel = a as ChannelId | "all";
    }
  }
  term.writeln(
    `${C.dim}fetching ${channel} news${force ? " (forced)" : ""}…${C.reset}`
  );
  const r = await fetchChannel(channel, force);
  if (r.errors.length > 0) {
    term.writeln(
      `${C.yellow}(${r.errors.length} source${
        r.errors.length === 1 ? "" : "s"
      } failed: ${r.errors.map((e) => e.source).join(", ")})${C.reset}`
    );
  }
  if (r.items.length === 0) {
    term.writeln(`${C.red}no items returned.${C.reset}`);
    return;
  }
  r.items.slice(0, limit).forEach((it, i) => {
    const idx = `${C.gray}${(i + 1).toString().padStart(2, " ")}${C.reset}`;
    const ago = `${C.cyan}${timeAgo(it.ts).padEnd(4, " ")}${C.reset}`;
    const source = `${C.brightMagenta}[${it.source}]${C.reset}`;
    term.writeln(`${idx}  ${ago}  ${source} ${C.bold}${it.title}${C.reset}`);
    const host = hostnameOf(it.url);
    const meta: string[] = [];
    if (host) meta.push(`${C.gray}${host}${C.reset}`);
    if (it.score !== undefined) meta.push(`${C.yellow}▲${it.score}${C.reset}`);
    if (it.numComments !== undefined)
      meta.push(`${C.gray}💬${it.numComments}${C.reset}`);
    term.writeln(`     ${meta.join("  ·  ")}    ${C.dim}${it.url}${C.reset}`);
  });
  term.writeln(
    `${C.dim}— ${Math.min(limit, r.items.length)} of ${r.items.length} items —${C.reset}`
  );
}
