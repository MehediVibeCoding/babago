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
 * ব্যাচের schedule ফ্রি-টেক্সট ফিল্ড (যেমন "শনি, সোম, বুধ — বিকাল ৪:০০ টা") থেকে
 * আন্দাজ করে আজকে এই ব্যাচের ক্লাস আছে কিনা। এটা একটা heuristic — schedule
 * এখনো structured (days[]) না হওয়ায় টেক্সট ম্যাচ করা হচ্ছে। ভবিষ্যতে batches
 * টেবিলে আলাদা days: text[] কলাম যোগ করলে এই ফাংশনটা আর দরকার হবে না।
 */
export function isBatchToday(schedule: string, today: Date = new Date()): boolean {
  const dayIdx = today.getDay(); // 0=রবি ... 6=শনি
  const todayName = BENGALI_DAY_NAMES[dayIdx];

  if (schedule.includes(todayName)) return true;

  // "সপ্তাহে ৬ দিন" জাতীয় টেক্সট থাকলে ধরে নেওয়া হচ্ছে শুক্রবার ছাড়া বাকি সব দিন ক্লাস আছে
  if (schedule.includes("সপ্তাহে") && dayIdx !== 5) return true;

  return false;
}

/** এন্ট্রোলমেন্টের তারিখ থেকে আজ পর্যন্ত (বর্তমান মাস ধরে) মোট কত মাস হয়েছে */
export function monthsEnrolled(createdAt: string, today: Date = new Date()): number {
  const start = new Date(createdAt);
  const months =
    (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth()) + 1;
  return Math.max(1, months);
}

/** একজন শিক্ষার্থীর জন্য কত মাসের বেতন বাকি আছে হিসাব করে (paid মাস বাদ দিয়ে) */
export function dueMonthsForStudent(
  student: Student,
  payments: Payment[],
  today: Date = new Date()
): number {
  const totalMonths = monthsEnrolled(student.created_at, today);
  const distinctPaidMonths = new Set(
    payments.filter((p) => p.student_id === student.id).map((p) => p.for_month.slice(0, 7))
  ).size;
  return Math.max(0, totalMonths - distinctPaidMonths);
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
