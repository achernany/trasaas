import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-mulish)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: { 900: "#0B3B4D", 700: "#14586F", 100: "#DDEEF4" },
        ink: { 900: "#101828", 600: "#475467", 400: "#98A2B3" },
        page: "#F5F7FA",
        line: "#E4E7EC",
        ok: { 600: "#067647", 100: "#DCFAE6" },
        warn: { 700: "#B54708", 100: "#FEF0C7" },
        danger: { 600: "#D92D20", 100: "#FEE4E2" },
      },
      boxShadow: { card: "0 1px 2px rgba(16,24,40,.06)" },
    },
  },
  plugins: [],
} satisfies Config;
