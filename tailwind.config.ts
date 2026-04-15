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

        // ── Stitch / Material-3 design tokens (from Vibe Code Market Stitch design)
        // NOTE: `primary`, `secondary`, and `background` are intentionally excluded
        // here — they live above as CSS-variable-based tokens for shadcn/ui compat.
        "inverse-surface":            "#fcf8fb",
        "on-tertiary-fixed":          "#003e03",
        "tertiary":                   "#69fd5d",
        "secondary-fixed-dim":        "#dab4ff",
        "on-secondary":               "#32005c",
        "on-surface":                 "#f9f5f8",
        "on-tertiary":                "#005e07",
        "inverse-primary":            "#006a6a",
        "inverse-on-surface":         "#565457",
        "on-surface-variant":         "#adaaad",
        "on-tertiary-container":      "#005406",
        "surface-tint":               "#c1fffe",
        "primary-fixed-dim":          "#00e6e6",
        "on-secondary-fixed":         "#4e008a",
        "surface-variant":            "#262528",
        "on-error-container":         "#ffa8a3",
        "on-error":                   "#490006",
        "on-primary-fixed-variant":   "#006262",
        "on-background":              "#f9f5f8",
        "surface-dim":                "#0e0e10",
        "error-dim":                  "#d7383b",
        "surface-container-highest":  "#262528",
        "primary-fixed":              "#00f5f5",
        "surface":                    "#0e0e10",
        "surface-container-lowest":   "#000000",
        "tertiary-container":         "#59ee50",
        "primary-container":          "#00ffff",
        "outline-variant":            "#48474a",
        "tertiary-dim":               "#49e043",
        "on-primary":                 "#006767",
        "outline":                    "#767577",
        "secondary-fixed":            "#e4c6ff",
        "secondary-container":        "#7701d0",
        "error-container":            "#9f0519",
        "secondary-dim":              "#9c42f4",
        "primary-dim":                "#00e6e6",
        "error":                      "#ff716c",
        "tertiary-fixed-dim":         "#49e043",
        "on-secondary-fixed-variant": "#7500cc",
        "on-primary-fixed":           "#004343",
        "on-tertiary-fixed-variant":  "#005f07",
        "surface-bright":             "#2c2c2f",
        "tertiary-fixed":             "#59ee50",
        "on-primary-container":       "#005d5d",
        "on-secondary-container":     "#f0dcff",
        "surface-container-low":      "#131315",
        "surface-container":          "#19191c",
        "surface-container-high":     "#1f1f22",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // --font-sans is injected by the Inter setup in app/layout.tsx
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Space Grotesk — loaded via layout.tsx as --font-headline
        headline: ["var(--font-headline)", "Space Grotesk", "system-ui", "sans-serif"],
        label:    ["var(--font-headline)", "Space Grotesk", "system-ui", "sans-serif"],
        // JetBrains Mono — loaded via layout.tsx as --font-mono
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "enter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "enter":          "enter 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
