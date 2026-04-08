import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── Editorial Luxury design tokens ─────────────────────────────────
        // Earthy palette replacing the neon-dark Stitch system

        // Terracotta — primary accent
        "terra":         "#C05A44",
        "terra-light":   "#E8836F",
        "terra-muted":   "rgba(192,90,68,0.12)",

        // Forest Green — secondary accent
        "forest":        "#2D4739",
        "forest-light":  "#3D6150",
        "forest-muted":  "rgba(45,71,57,0.10)",

        // Muted Gold — tertiary accent
        "gold":          "#B89F6E",
        "gold-muted":    "rgba(184,159,110,0.15)",

        // Ink scale
        "ink":           "#0F0F0F",
        "ink-secondary": "#6B6860",
        "ink-tertiary":  "#9B9690",
        "ink-faint":     "rgba(15,15,15,0.35)",

        // Surfaces
        "surface":       "#FDFCFB",
        "surface-warm":  "#F5F3F0",
        "surface-card":  "#FFFFFF",

        // Borders
        "hairline":      "rgba(15,15,15,0.09)",
        "hairline-mid":  "rgba(15,15,15,0.15)",

        // Legacy compatibility aliases (used by dashboard, auth pages etc.)
        "on-surface":          "#0F0F0F",
        "on-surface-variant":  "#6B6860",
        "outline-variant":     "rgba(15,15,15,0.12)",
        "surface-container":   "#F5F3F0",
        "error":               "#C0392B",
        "tertiary":            "#2D4739",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Inter — body and UI
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        body: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Playfair Display — editorial headlines
        headline: ["var(--font-headline)", "Playfair Display", "Georgia", "serif"],
        label:    ["var(--font-sans)", "system-ui", "sans-serif"],
        // JetBrains Mono — code and labels
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "enter": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "enter":          "enter 0.25s ease-out",
        "fade-in":        "fade-in 0.2s ease-out",
      },
      boxShadow: {
        // Editorial soft shadows
        "card":  "0 1px 3px rgba(15,15,15,0.06), 0 1px 2px rgba(15,15,15,0.04)",
        "card-hover": "0 4px 16px rgba(15,15,15,0.10), 0 1px 4px rgba(15,15,15,0.06)",
        "float": "0 8px 32px rgba(15,15,15,0.12), 0 2px 8px rgba(15,15,15,0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
