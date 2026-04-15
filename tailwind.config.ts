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

        // ── Dark Cyber-Tech design tokens ──────────────────────────────────
        // Electric Indigo — primary accent
        "indigo":       "#6366F1",
        "indigo-light": "#818CF8",
        "indigo-dim":   "rgba(99,102,241,0.15)",
        "indigo-glow":  "rgba(99,102,241,0.25)",

        // Cyber Teal — secondary accent (use sparingly)
        "cyber":        "#00F5FF",
        "cyber-dim":    "rgba(0,245,255,0.10)",

        // Dark surfaces
        "void":         "#000000",
        "surface-0":    "#000000",
        "surface-1":    "#0A0A0A",
        "surface-2":    "#111111",
        "surface-3":    "#1A1A1A",

        // Text scale
        "text-1":       "#FFFFFF",
        "text-2":       "#A1A1AA",
        "text-3":       "#71717A",
        "text-4":       "#3F3F46",

        // Status colors
        "status-green": "#22C55E",
        "status-amber": "#F59E0B",
        "status-red":   "#EF4444",

        // Legacy compatibility aliases used by dashboard, auth, etc.
        "on-surface":          "#FFFFFF",
        "on-surface-variant":  "#A1A1AA",
        "outline-variant":     "rgba(255,255,255,0.08)",
        "surface-container":   "#0A0A0A",
        "surface-card":        "#0A0A0A",
        "error":               "#EF4444",
        "tertiary":            "#00F5FF",
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
        // Space Grotesk — sharp cyber headlines
        headline: ["var(--font-headline)", "Space Grotesk", "system-ui", "sans-serif"],
        label:    ["var(--font-sans)", "system-ui", "sans-serif"],
        // JetBrains Mono — code and technical details
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
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.4", transform: "scale(0.8)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 6px rgba(99,102,241,0.4)" },
          "50%":      { boxShadow: "0 0 18px rgba(99,102,241,0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "enter":          "enter 0.25s ease-out",
        "fade-in":        "fade-in 0.2s ease-out",
        "pulse-dot":      "pulse-dot 1.8s ease-in-out infinite",
        "glow-pulse":     "glow-pulse 2s ease-in-out infinite",
      },
      boxShadow: {
        // Cyber glow shadows
        "glow-sm":    "0 0 8px rgba(99,102,241,0.35)",
        "glow":       "0 0 16px rgba(99,102,241,0.40), 0 0 4px rgba(99,102,241,0.20)",
        "glow-lg":    "0 0 32px rgba(99,102,241,0.35), 0 0 8px rgba(99,102,241,0.20)",
        "glow-teal":  "0 0 12px rgba(0,245,255,0.30)",
        "card":       "0 1px 3px rgba(0,0,0,0.6)",
        "card-hover": "0 0 0 1px rgba(99,102,241,0.40), 0 4px 24px rgba(99,102,241,0.15)",
        "float":      "0 8px 32px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
