/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        accent: { DEFAULT: "rgb(var(--accent) / <alpha-value>)" },
        accent2: "rgb(var(--accent2) / <alpha-value>)",
        accent3: "rgb(var(--accent3) / <alpha-value>)",
        accent4: "rgb(var(--accent4) / <alpha-value>)",
        base: "rgb(var(--base) / <alpha-value>)",
        mantle: "rgb(var(--mantle) / <alpha-value>)",
        crust: "rgb(var(--crust) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",
        overlay: "rgb(var(--overlay) / <alpha-value>)",
        ink: "rgb(var(--text) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        subtext: "rgb(var(--subtext) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "scale-in": {
          "0%": { opacity: 0, transform: "scale(0.94)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "blink": { "50%": { opacity: 0 } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "pulse-soft": {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
        "rise": {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease forwards",
        "scale-in": "scale-in 0.18s cubic-bezier(0.05,0.9,0.1,1.05) forwards",
        "blink": "blink 1s step-end infinite",
        "spin-slow": "spin-slow 22s linear infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "rise": "rise 0.3s cubic-bezier(0.05,0.9,0.1,1.05) forwards",
      },
      boxShadow: {
        glow: "0 0 24px rgb(var(--accent) / 0.45)",
        glowsoft: "0 0 60px rgb(var(--accent) / 0.25)",
      },
    },
  },
  plugins: [],
};
