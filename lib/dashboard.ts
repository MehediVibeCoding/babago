import { BATCHES, BLOG_POSTS, PAYMENTS, STUDENTS } from "./mock-data";
import { currentMonthKey, dueMonthsForStudent, isBatchToday } from "./utils";
import type { Batch, Payment, Student } from "./types";

export type DueStudent = { student: Student; dueMonths: number };

export function getDashboardData(today: Date = new Date("2026-09-26T00:00:00Z")) {
  const activeStudents = STUDENTS.filter((s) => s.status !== "inactive");
  const activeBatches = BATCHES.filter((b) => b.is_active);
  const monthKey = currentMonthKey(today);

  const thisMonthPayments = PAYMENTS.filter((p) => p.for_month.slice(0, 7) === monthKey);
  const collectedThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectedLifetime = PAYMENTS.reduce((sum, p) => sum + p.amount, 0);

  const dueStudents: DueStudent[] = activeStudents
    .filter((s) => s.status === "confirmed")
    .map((s) => ({ student: s, dueMonths: dueMonthsForStudent(s, PAYMENTS, today) }))
    .filter((d) => d.dueMonths > 0)
    .sort((a, b) => b.dueMonths - a.dueMonths);

  const todaysBatches: Batch[] = activeBatches.filter((b) => isBatchToday(b.schedule, today));

  const recentPayments: Payment[] = [...PAYMENTS]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  return {
    totalStudents: activeStudents.length,
    totalBatches: activeBatches.length,
    collectedThisMonth,
    collectedLifetime,
    paymentsThisMonthCount: thisMonthPayments.length,
    publishedBlogCount: BLOG_POSTS.filter((b) => b.published).length,
    dueStudents,
    todaysBatches,
    recentPayments,
    revenueTrend: getMonthlyRevenueTrend(today),
  };
}

/** শেষ ৬ মাসের কালেকশন ট্রেন্ড — ড্যাশবোর্ড চার্টের জন্য */
export function getMonthlyRevenueTrend(today: Date = new Date(), monthsBack = 6) {
  const trend: { label: string; total: number }[] = [];
  const BN_MONTHS_SHORT = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = PAYMENTS.filter((p) => p.for_month.slice(0, 7) === key).reduce((sum, p) => sum + p.amount, 0);
    trend.push({ label: BN_MONTHS_SHORT[d.getMonth()], total });
  }
  return trend;
}
