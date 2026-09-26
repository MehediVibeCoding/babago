import type { Config } from "tailwindcss";

// এই টোকেনগুলো মূল সাইটের (ahsans-learning-academy) tailwind.config.ts থেকে
// হুবহু কপি করা — নতুন কোনো ব্র্যান্ড রঙ বানানো হয়নি। শুধু নিচের অংশে
// অ্যাডমিন-প্যানেলে-দরকারি কিছু স্ট্যান্ডার্ড সিমান্টিক রঙ (success/danger/warn/info)
// এবং নিরপেক্ষ (ink/muted/border/surface) টোকেন যোগ করা হয়েছে, যেগুলো ছাড়া
// টেবিল-স্ট্যাটাস-পিল/অ্যালার্ট বানানো সম্ভব না — মূল ব্র্যান্ড প্যালেটে হাত দেওয়া হয়নি।
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          950: "#0a1f33",
          700: "#0369a1",
          600: "#0284c7",
          400: "#38bdf8",
          100: "#f0f7ff",
        },
        cloud: {
          50: "#f8fafc",
        },
        ink: {
          800: "#1e293b",
        },
        // --- Admin-only additions (semantic, not brand) ---
        muted: "#64748b",
        border: {
          base: "#e2e8f0",
        },
        surface: {
          muted: "#f1f5f9",
        },
        success: "#10b981",
        info: "#0ea5e9",
        danger: "#e11d48",
        warn: "#f59e0b",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-dm-sans)", "'Noto Sans Bengali'", "var(--font-bengali)", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(14,165,233,0.15)",
        sh1: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)",
        sh2: "0 4px 16px -2px rgba(2,132,199,0.16)",
        sh3: "0 12px 36px -6px rgba(2,132,199,0.22)",
      },
      maxWidth: {
        prose: "65ch",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(.16,1,.3,1)",
        brand: "cubic-bezier(.4,0,.2,1)",
      },
      transitionDuration: {
        brand: "250ms",
      },
      borderRadius: {
        brand: "14px",
      },
      keyframes: {
        softFadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "soft-fade-in": "softFadeIn .3s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
