"use client";

import { useEffect } from "react";

/**
 * অ্যাডমিন পেজের যেকোনো সার্ভার এরর এখানে আসে। আসল এরর বার্তা (ডাটাবেজ/সার্ভারের
 * ভেতরের তথ্য) প্রোডাকশনে ব্যবহারকারীকে দেখানো হয় না — শুধু সার্ভার লগে থাকে।
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-danger">
      <h1 className="mb-2 font-body text-lg font-bold">পেজ লোড করতে সমস্যা হয়েছে</h1>
      <p className="text-sm">
        ডেটা লোড করা যায়নি। আবার চেষ্টা করুন; সমস্যা থাকলে লগআউট করে আবার লগইন করুন।
      </p>
      <p className="mt-3 text-xs text-rose-500">
        টিপস: Supabase কানেকশন ও Environment Variables (বিশেষ করে ADMIN_EMAIL) সঠিক আছে কিনা দেখুন।
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl bg-rose-600 px-4 py-2 font-body text-sm font-bold text-white hover:bg-rose-700"
      >
        আবার চেষ্টা করুন
      </button>
    </div>
  );
}
