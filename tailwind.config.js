/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme utama (seperti foto referensi)
        dark: {
          bg: "#0F0F1A",
          surface: "#1A1A2E",
          card: "#16213E",
          border: "#2A2A4A",
        },
        // Accent colors
        primary: {
          DEFAULT: "#6C63FF",
          hover: "#5A52E0",
          light: "#8B85FF",
        },
        teal: {
          DEFAULT: "#4ECDC4",
          hover: "#3DBDB4",
        },
        cyan: {
          DEFAULT: "#45B7D1",
        },
        // Status colors
        success: "#2ECC71",
        warning: "#F39C12",
        danger: "#E74C3C",
        muted: "#B0B0C0",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shake: "shake 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-8px)" },
          "75%": { transform: "translateX(8px)" },
        },
      },
    },
  },
  plugins: [],
};