/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // App surface palette
        background: "#111113",
        surface: "#19191D",
        border: "#27272F",
        recessed: "#141417",
        borderRecessed: "#22222A",
        // Text & labels
        primary: "#FFFFFF",
        secondary: "#9090A0",
        structural: "#555562",
        // Functional State Accents
        flash: "#6EE756",
        send: "#8E7CFF",
        alert: "#FF453A",
        attempt: "#3E3E48",
      },
    },
  },
  plugins: [],
};
