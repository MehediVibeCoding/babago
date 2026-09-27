"use server";

import { createClient } from "@/lib/supabase/server";
import type { Batch, Payment, Student } from "@/lib/types";
import { currentMonthKey, dueMonthsForStudent, isBatchToday } from "@/lib/utils";
import { bengaliDayName, toBengaliDigits } from "@/lib/bengaliNumerals";

export type DueStudentData = {
  student: Student;
  dueMonths: number;
};

export type RevenueTrendItem = {
  label: string;
  total: number;
};

export type LiveDashboardData = {
  totalStudents: number;
  totalBatches: number;
  collectedThisMonth: number;
  collectedLifetime: number;
  dueCount: number;
  todaysClassCount: number;
  publishedBlogCount: number;
  dueStudents: DueStudentData[];
  todaysBatches: Batch[];
  recentPayments: Payment[];
  allStudents: Student[];
  revenueTrend: RevenueTrendItem[];
  todayLabel: string;
};

// ⚡ Supabase থেকে রিয়েলটাইম লাইভ ডাটা ফেচিং ইঞ্জিন (কোনো মক ডাটা ছাড়া)
export async function getLiveDashboardData(): Promise<LiveDashboardData> {
  const supabase = await createClient();
  const today = new Date();
  const monthKey = currentMonthKey(today);

  // প্যারালাল ও অপ্টিমাইজড লাইভ ডাটা ফেচিং
  const [
    { data: studentsData, error: sErr },
    { data: batchesData, error: bErr },
    { data: paymentsData, error: pErr },
    { data: blogsData, error: blErr },
  ] = await Promise.all([
    supabase.from("students").select("*").order("created_at", { ascending: false }),
    supabase.from("batches").select("*").order("sort_order", { ascending: true }),
    supabase.from("payments").select("*").order("created_at", { ascending: false }),
    supabase.from("blog_posts").select("id, published").eq("published", true),
  ]);

  if (sErr) console.error("Dashboard students fetch error:", sErr.message);
  if (bErr) console.error("Dashboard batches fetch error:", bErr.message);
  if (pErr) console.error("Dashboard payments fetch error:", pErr.message);
  if (blErr) console.error("Dashboard blogs fetch error:", blErr.message);

  const students = (studentsData || []) as Student[];
  const batches = (batchesData || []) as Batch[];
  const payments = (paymentsData || []) as Payment[];

  const activeStudents = students.filter((s) => s.status !== "inactive");
  const activeBatches = batches.filter((b) => b.is_active);

  // চলতি মাসের আসল কালেকশন ও সর্বমোট কালেকশন
  const thisMonthPayments = payments.filter((p) => (p.for_month || "").slice(0, 7) === monthKey);
  const collectedThisMonth = thisMonthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const collectedLifetime = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // রানিং মাস বাদ দিয়ে প্রকৃত বকেয়া তালিকা (Due Students)
  const dueStudents: DueStudentData[] = activeStudents
    .filter((s) => s.status === "confirmed")
    .map((s) => ({
      student: s,
      dueMonths: dueMonthsForStudent(s, payments, today),
    }))
    .filter((d) => d.dueMonths > 0)
    .sort((a, b) => b.dueMonths - a.dueMonths);

  // আজকের বারে কোন কোন ব্যাচের ক্লাস আছে
  const todaysBatches: Batch[] = activeBatches.filter((b) => isBatchToday(b.schedule, today));

  // সর্বশেষ ৬টি আসল পেমেন্ট লেনদেন
  const recentPayments: Payment[] = payments.slice(0, 6);

  // শেষ ৬ মাসের লাইভ কালেকশন চার্ট ডাটা
  const BN_MONTHS_SHORT = [
    "জানু",
    "ফেব্রু",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টে",
    "অক্টো",
    "নভে",
    "ডিসে",
  ];

  const revenueTrend: RevenueTrendItem[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = payments
      .filter((p) => (p.for_month || "").slice(0, 7) === key)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    revenueTrend.push({ label: BN_MONTHS_SHORT[d.getMonth()], total });
  }

  const todayLabel = `${bengaliDayName(today.getDay())}বার, ${toBengaliDigits(today.getDate())} তারিখ`;

  return {
    totalStudents: activeStudents.length,
    totalBatches: activeBatches.length,
    collectedThisMonth,
    collectedLifetime,
    dueCount: dueStudents.length,
    todaysClassCount: todaysBatches.length,
    publishedBlogCount: blogsData?.length || 0,
    dueStudents,
    todaysBatches,
    recentPayments,
    allStudents: students,
    revenueTrend,
    todayLabel,
  };
}
