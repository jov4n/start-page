import type { ITheme } from "@xterm/xterm";

function rgb(name: string, fallback = "0,0,0"): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!v) return `rgb(${fallback})`;
  return `rgb(${v.replace(/\s+/g, ", ")})`;
}

/**
 * Build an xterm theme from the live CSS variables, so the terminal retints
 * along with the rest of the desktop when the user switches themes.
 */
export function xtermThemeFromCss(): ITheme {
  return {
    background: rgb("--mantle", "30,30,46"),
    foreground: rgb("--text", "205,214,244"),
    cursor: rgb("--accent", "137,180,250"),
    cursorAccent: rgb("--mantle", "30,30,46"),
    selectionBackground: rgb("--accent", "137,180,250"),
    selectionForeground: rgb("--mantle", "30,30,46"),
    selectionInactiveBackground: rgb("--surface2", "69,71,90"),

    // ANSI 0-7 (standard)
    black: rgb("--surface", "49,50,68"),
    red: "#f38ba8",
    green: "#a6e3a1",
    yellow: "#f9e2af",
    blue: rgb("--accent", "137,180,250"),
    magenta: rgb("--accent2", "203,166,247"),
    cyan: "#94e2d5",
    white: rgb("--subtext", "166,173,200"),

    // ANSI 8-15 (bright)
    brightBlack: rgb("--overlay", "88,91,112"),
    brightRed: "#f38ba8",
    brightGreen: "#a6e3a1",
    brightYellow: "#f9e2af",
    brightBlue: rgb("--accent", "137,180,250"),
    brightMagenta: rgb("--accent2", "203,166,247"),
    brightCyan: "#94e2d5",
    brightWhite: rgb("--text", "205,214,244"),
  };
}
