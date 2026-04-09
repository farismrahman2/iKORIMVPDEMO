import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ikori: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        "ikori-cyan": {
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
        },
        "ikori-dark": "#111827",
        "ikori-body": "#4B5563",
        "ikori-muted": "#9CA3AF",
        "ikori-border": "#E5E7EB",
        "ikori-surface": "#F9FAFB",
        "ikori-white": "#FFFFFF",
        risk: {
          high: "#EF4444",
          border: "#FCA5A5",
          probable: "#3B82F6",
          strong: "#10B981",
        },
        // Keep old names as aliases for gradual migration in admin panel
        navy: {
          DEFAULT: "#111827",
          light: "#F9FAFB",
          lighter: "#E5E7EB",
        },
        accent: {
          orange: "#10B981",
          gold: "#34D399",
        },
        band: {
          strong: "#10B981",
          probable: "#3B82F6",
          borderline: "#F59E0B",
          high_risk: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Bengali", "system-ui", "-apple-system", "sans-serif"],
        display: ["Plus Jakarta Sans", "Noto Sans Bengali", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        ikori: "12px",
        "ikori-sm": "8px",
        "ikori-full": "9999px",
      },
      backgroundImage: {
        "ikori-gradient": "linear-gradient(135deg, #6EE7B7 0%, #A7F3D0 25%, #A5F3FC 75%, #CFFAFE 100%)",
        "ikori-gradient-subtle": "linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 100%)",
        "ikori-gradient-dark": "linear-gradient(135deg, #065F46 0%, #064E3B 50%, #0E7490 100%)",
      },
      boxShadow: {
        "ikori-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        ikori: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "ikori-md": "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
