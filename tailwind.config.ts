import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          light: "#1A2A44",
          lighter: "#2A3A54",
        },
        accent: {
          orange: "#F97316",
          gold: "#FBBF24",
        },
        band: {
          strong: "#22C55E",
          probable: "#3B82F6",
          borderline: "#F59E0B",
          high_risk: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
