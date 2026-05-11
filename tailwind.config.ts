import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
        },
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
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        brand: {
          blue: "hsl(var(--brand-blue))",
          "blue-deep": "hsl(var(--brand-blue-deep))",
          "blue-soft": "hsl(var(--brand-blue-soft))",
          orange: "hsl(var(--brand-orange))",
          "orange-soft": "hsl(var(--brand-orange-soft))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        soft: "0 1px 2px 0 hsl(222 47% 11% / 0.04), 0 1px 3px 0 hsl(222 47% 11% / 0.06)",
        card: "0 2px 8px -2px hsl(222 47% 11% / 0.06), 0 4px 16px -4px hsl(222 47% 11% / 0.08)",
        elevated: "0 8px 24px -8px hsl(222 47% 11% / 0.12), 0 16px 40px -12px hsl(222 47% 11% / 0.10)",
        "brand-glow": "0 8px 28px -8px hsl(var(--primary) / 0.35)",
      },
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
        caption: ["0.75rem", { lineHeight: "1.1rem" }],
        body: ["0.875rem", { lineHeight: "1.35rem" }],
        h2: ["1.125rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em" }],
        h1: ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
        display: ["1.75rem", { lineHeight: "2.125rem", letterSpacing: "-0.02em" }],
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
        "click-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.45)" },
          "50%": { boxShadow: "0 0 0 10px hsl(var(--primary) / 0)" },
        },
        "click-pulse-success": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--success) / 0.45)" },
          "50%": { boxShadow: "0 0 0 8px hsl(var(--success) / 0)" },
        },
        "click-pulse-destructive": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--destructive) / 0.45)" },
          "50%": { boxShadow: "0 0 0 8px hsl(var(--destructive) / 0)" },
        },
        "arrow-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(3px)" },
        },
        "arrow-nudge": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
        "shimmer-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "click-pulse": "click-pulse 2s ease-in-out infinite",
        "click-pulse-success": "click-pulse-success 2s ease-in-out infinite",
        "click-pulse-destructive": "click-pulse-destructive 2s ease-in-out infinite",
        "arrow-bob": "arrow-bob 1.4s ease-in-out infinite",
        "arrow-nudge": "arrow-nudge 1.4s ease-in-out infinite",
        "shimmer-sweep": "shimmer-sweep 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
