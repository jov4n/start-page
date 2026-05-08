import { LOGOS, type AsciiLogo } from "./ascii-logos";
import { useStore } from "../store";
import { APPS } from "../apps/registry";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const C = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Strip ANSI escape sequences when measuring visible width.
const ANSI_RE = /\x1b\[[0-9;]*m/g;

function vwidth(s: string): number {
  return s.replace(ANSI_RE, "").length;
}

function pad(s: string, target: number): string {
  return s + " ".repeat(Math.max(0, target - vwidth(s)));
}

function formatUptime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

function getGpu(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return null;
    const renderer = gl.getParameter(
      ext.UNMASKED_RENDERER_WEBGL
    ) as unknown as string;
    return typeof renderer === "string" && renderer.length > 0
      ? renderer
      : null;
  } catch {
    return null;
  }
}

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows NT")) return "Windows browser host";
  if (ua.includes("Mac OS X") || ua.includes("Macintosh"))
    return "macOS browser host";
  if (ua.includes("Android")) return "Android browser host";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS browser host";
  if (ua.includes("Linux")) return "Linux browser host";
  return "browser host";
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Browser";
}

interface InfoRow {
  label: string;
  value: string;
}

function colorBlocks(): [string, string] {
  let regular = "";
  let bright = "";
  for (let i = 0; i < 8; i++) {
    regular += `\x1b[4${i}m   `;
    bright += `\x1b[10${i}m   `;
  }
  return [regular + RESET, bright + RESET];
}

function buildInfoLines(logo: AsciiLogo): string[] {
  const s = useStore.getState();
  const username = s.settings.username || "user";
  const host = "hyprstart";

  const memory = (() => {
    const m = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    return m ? `~${m} GiB` : "n/a";
  })();
  const cores = navigator.hardwareConcurrency || "?";
  const gpu = getGpu();
  const uptime = formatUptime(Date.now() - performance.timeOrigin);
  const installed = Object.keys(APPS).length;
  const wallpaper = s.settings.wallpaperUrl
    ? "custom"
    : s.settings.wallpaperId;
  const browser = detectBrowser();

  const A = logo.accent;
  const lines: string[] = [];

  lines.push(`${A}${BOLD}${username}${RESET}@${A}${BOLD}${host}${RESET}`);
  lines.push(
    `${DIM}${"-".repeat(username.length + host.length + 1)}${RESET}`
  );

  const rows: InfoRow[] = [
    { label: "OS", value: "hyprstart 1.0 (web)" },
    { label: "Host", value: detectPlatform() },
    { label: "Kernel", value: `${browser} (browser kernel)` },
    { label: "Uptime", value: uptime },
    { label: "Packages", value: `${installed} (apps)` },
    { label: "Shell", value: "hypr-sh" },
    { label: "Resolution", value: `${window.innerWidth}x${window.innerHeight}` },
    { label: "DE", value: "hyprstart" },
    { label: "WM", value: "hyprland-react" },
    { label: "Theme", value: s.settings.theme },
    { label: "Wallpaper", value: wallpaper },
    { label: "Terminal", value: "xterm.js" },
    { label: "CPU", value: `${cores} cores` },
    {
      label: "GPU",
      value: gpu
        ? gpu.length > 50
          ? gpu.slice(0, 50) + "…"
          : gpu
        : "(blocked by browser)",
    },
    { label: "Memory", value: memory },
    { label: "Locale", value: navigator.language },
  ];

  for (const r of rows) {
    lines.push(`${A}${BOLD}${r.label}${RESET}: ${r.value}`);
  }

  const [reg, bri] = colorBlocks();
  lines.push("");
  lines.push(reg);
  lines.push(bri);

  return lines;
}

/**
 * Render the side-by-side layout the way fastfetch / neofetch does:
 *   LOGO_LINE   INFO_LINE
 * Lines are CRLF-joined for direct writing to xterm.
 */
export function renderFastfetch(logoId: string | undefined): string {
  const logo = LOGOS.find((l) => l.id === logoId) ?? LOGOS[0];
  const info = buildInfoLines(logo);

  // Apply accent colour to each logo line at render time so we don't have
  // to bake escape sequences into every distro template.
  const logoLines = logo.lines.map((l) => `${logo.accent}${l}${RESET}`);

  const logoMaxWidth = Math.max(...logo.lines.map((l) => l.length));
  const total = Math.max(logoLines.length, info.length);
  const out: string[] = [];
  const gap = 3;

  for (let i = 0; i < total; i++) {
    const left = pad(logoLines[i] ?? "", logoMaxWidth);
    const right = info[i] ?? "";
    out.push(left + " ".repeat(gap) + right);
  }

  return out.join("\r\n");
}

export function listLogoIds(): { id: string; name: string }[] {
  return LOGOS.map((l) => ({ id: l.id, name: l.name }));
}

export const FASTFETCH_HELP = [
  `${BOLD}fastfetch${RESET} — display system info with an ASCII logo`,
  "",
  `  ${C.cyan}fastfetch${RESET}              use the configured default logo`,
  `  ${C.cyan}fastfetch <logo>${RESET}       render with a specific logo`,
  `  ${C.cyan}fastfetch --list${RESET}       list available logos`,
  `  ${C.cyan}fastfetch --set <logo>${RESET} save the default logo in settings`,
  "",
  `  ${DIM}aliases:${RESET} ${C.cyan}neofetch${RESET}, ${C.cyan}ff${RESET}`,
];
