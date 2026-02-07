/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050608",
        panel: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.10)",
        accent: "#1E4BFF",
        ice: "#BFE7FF",
      },
      boxShadow: {
        glass: "0 18px 40px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
