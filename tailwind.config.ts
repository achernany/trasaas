import type { Config } from "tailwindcss";

/** Tokens AlfaSource v1.2 — mapeados sobre los nombres de clase existentes */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        brand: {
          900: "#2743C0", // alfa-blue (primario / acción)
          700: "#1F37A6", // hover
          100: "#E9EDFA", // info.bg / selección
          deep: "#1B2E86",
        },
        alfa: { red: "#E23A5E", "red-deep": "#C22B48" },
        ink: {
          950: "#0B0D13",
          900: "#14171F",
          600: "#3A3F4C",
          400: "#6B7180",
        },
        page: "#F5F6F9",
        line: "#E4E7EE",
        ok: { 600: "#1F9D63", 100: "#E7F5EE" },
        warn: { 700: "#E0921F", 100: "#FBF1DF" },
        danger: { 600: "#DC3546", 100: "#FBE7E9" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,23,31,0.06)",
        brand: "0 16px 40px rgba(39,67,192,0.28)",
      },
      backgroundImage: {
        "alfa-gradient":
          "linear-gradient(110deg, #2743C0 0%, #7A2FB0 52%, #E23A5E 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
