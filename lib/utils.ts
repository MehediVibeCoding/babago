import { toBengaliDigits } from "./bengaliNumerals";
import type { Batch, Payment, Student } from "./types";

/** ছোট classnames হেল্পার — কন্ডিশনাল Tailwind ক্লাস জোড়া দেওয়ার জন্য */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** ৳ চিহ্ন সহ বাংলা অঙ্কে, হাজার-কমা গ্রুপিং সহ টাকা ফরম্যাট করে */
export function formatTaka(amount: number): string {
  return `৳${toBengaliDigits(amount, { grouped: true })}`;
}

const BENGALI_DAY_NAMES = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];

/** JS Date#getDay() ইনডেক্স (০=রবিবার) থেকে বাংলা বার-এর নাম */
export function bengaliDayName(dayIndex: number): string {
  return BENGALI_DAY_NAMES[dayIndex] ?? "";
}

/**
 * ব্যাচের schedule ফ্রি-টেক্সট ফিল্ড থেকে আজ ক্লাস আছে কিনা বের করে
 */
export function isBatchToday(schedule: string, today: Date = new Date()): boolean {
  const dayIdx = today.getDay(); // 0=রবি ... 6=শনি
  const todayName = BENGALI_DAY_NAMES[dayIdx];

  if (schedule.includes(todayName)) return true;
  if (schedule.includes("সপ্তাহে") && dayIdx !== 5) return true;

  return false;
}

/**
 * 🎯 নিখুঁত ডায়নামিক সাইকেল হিসাব:
 * ভর্তির তারিখ (যেমন ১৫ তারিখ) থেকে আজ পর্যন্ত মোট কয়টি "পূর্ণাঙ্গ মাস" সমাপ্ত হয়েছে তা বের করে।
 * চলতি রানিং সাইকেলকে কখনো গণনা করে না (Grace Period)।
 */
export function getCompletedBillingMonths(
  enrollmentDateStr: string,
  today: Date = new Date()
): number {
  if (!enrollmentDateStr) return 0;
  const start = new Date(enrollmentDateStr.slice(0, 10) + "T00:00:00");
  if (isNaN(start.getTime()) || start > today) return 0;

  let months =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth());

  // আজকের তারিখ যদি ভর্তির দিনের চেয়ে ছোট হয়, তার মানে চলতি মাসের সাইকেল এখনো চলছে (পূর্ণ হয়নি)
  if (today.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

/** এনরোলমেন্টের মোট সময়কাল */
export function monthsEnrolled(createdAt: string, today: Date = new Date()): number {
  return getCompletedBillingMonths(createdAt, today);
}

/**
 * 🎯 আসল বকেয়া মাস গণনা:
 * মোট সমাপ্ত হওয়া সাইকেল সংখ্যা থেকে মোট পরিশোধিত মাসের সংখ্যা বিয়োগ করে।
 * রানিং মাসের কোনো বকেয়া দেখাবে না।
 */
export function dueMonthsForStudent(
  student: Student,
  payments: Payment[],
  today: Date = new Date()
): number {
  const completedCycles = getCompletedBillingMonths(student.created_at, today);
  const distinctPaidMonths = new Set(
    payments.filter((p) => p.student_id === student.id).map((p) => p.for_month.slice(0, 7))
  ).size;

  return Math.max(0, completedCycles - distinctPaidMonths);
}

export function totalPaidByStudent(studentId: string, payments: Payment[]): number {
  return payments.filter((p) => p.student_id === studentId).reduce((sum, p) => sum + p.amount, 0);
}

/** YYYY-MM-DD থেকে "চলতি মাস" YYYY-MM বের করে */
export function currentMonthKey(today: Date = new Date()): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function studentCountInBatch(batchId: string, students: Student[]): number {
  return students.filter((s) => s.batch_id === batchId && s.status !== "inactive").length;
}

export function getActiveBatchOptions(batches: Batch[]) {
  return batches.filter((b) => b.is_active);
}
