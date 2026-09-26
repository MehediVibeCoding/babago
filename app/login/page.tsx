"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("ভুল ইমেইল বা পাসওয়ার্ড। আবার চেষ্টা করুন।");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* ব্যাকগ্রাউন্ড স্কাই গ্রেডিয়েন্ট */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 sky-gradient" />

      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-7 shadow-sh3 backdrop-blur-2xl animate-soft-fade-in sm:p-9">
        {/* লোগো ও হেডার */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-[0_6px_20px_rgba(2,132,199,0.35)]">
            <span className="font-display text-[26px] font-bold">A</span>
          </div>
          <h1 className="font-body text-[21px] font-black tracking-tight text-sky-950 sm:text-[24px]">
            Ahsan&apos;s Learning Academy
          </h1>
          <p className="mt-1 font-body text-[12px] font-bold uppercase tracking-[1.8px] text-sky-600">
            অ্যাডমিন প্যানেল লগইন
          </p>
        </div>

        {/* ফর্ম */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-body text-[12.5px] font-bold text-ink-800">
              অ্যাডমিন ইমেইল
            </label>
            <input
              type="email"
              required
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border-base bg-white/80 px-4 py-2.5 font-body text-[13.5px] text-ink-800 placeholder:text-muted/60 outline-none transition-colors focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-600/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-body text-[12.5px] font-bold text-ink-800">
              পাসওয়ার্ড
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border-base bg-white/80 px-4 py-2.5 font-body text-[13.5px] text-ink-800 placeholder:text-muted/60 outline-none transition-colors focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-600/20"
            />
          </div>

          {error && (
            <div
              className="flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3.5 py-2.5 font-body text-[12.5px] font-semibold text-danger animate-soft-fade-in"
              role="alert"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-glow mt-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 py-3 font-body text-[14px] font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "লগইন হচ্ছে..." : "লগইন করুন →"}
          </button>
        </form>

        <div className="mt-6 border-t border-border-base/60 pt-4 text-center">
          <p className="font-body text-[11px] font-medium text-muted">
            অননুমোদিত প্রবেশ সম্পূর্ণ নিষিদ্ধ ও সুরক্ষিত
          </p>
        </div>
      </div>
    </div>
  );
}
