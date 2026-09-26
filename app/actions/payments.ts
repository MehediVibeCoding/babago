"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Payment, Student, Batch, PaymentMethod } from "@/lib/types";

const PAYMENTS_TABLE = "payments";
const STUDENTS_TABLE = "students";
const BATCHES_TABLE = "batches";

export interface PaymentActionResult {
  ok: boolean;
  message?: string;
  payment?: Payment;
}

export interface PaymentInput {
  student_id: string;
  amount: number;
  method: PaymentMethod;
  for_month: string; // YYYY-MM-01
  note?: string | null;
}

export interface QuickStudentAndPaymentInput {
  full_name: string;
  phone: string;
  college?: string;
  college_roll?: string;
  group_name?: string;
  batch_id?: string | null;
  batch_name_snapshot?: string | null;
  created_at?: string; // 🎯 কাস্টম ভর্তির তারিখ (YYYY-MM-DD)
  amount: number;
  method: PaymentMethod;
  for_month: string;
  note?: string | null;
}

// ১. পেমেন্ট ও শিক্ষার্থীর তালিকা লোড করা
export async function getPaymentsData(): Promise<{
  payments: Payment[];
  students: Student[];
  batches: Batch[];
}> {
  const supabase = await createClient();

  const [
    { data: paymentsData, error: pErr },
    { data: studentsData, error: sErr },
    { data: batchesData, error: bErr },
  ] = await Promise.all([
    supabase.from(PAYMENTS_TABLE).select("*").order("created_at", { ascending: false }),
    supabase.from(STUDENTS_TABLE).select("*").order("full_name", { ascending: true }),
    supabase.from(BATCHES_TABLE).select("*").order("sort_order", { ascending: true }),
  ]);

  if (pErr) console.error("Error fetching payments:", pErr.message);
  if (sErr) console.error("Error fetching students:", sErr.message);
  if (bErr) console.error("Error fetching batches:", bErr.message);

  return {
    payments: (paymentsData || []) as Payment[],
    students: (studentsData || []) as Student[],
    batches: (batchesData || []) as Batch[],
  };
}

// ২. শিক্ষার্থীর বেতন/পেমেন্ট এন্ট্রি করা (নগদ বা অনলাইন)
export async function recordPayment(input: PaymentInput): Promise<PaymentActionResult> {
  const supabase = await createClient();

  if (!input.student_id) return { ok: false, message: "শিক্ষার্থী নির্বাচন করুন।" };
  if (!input.amount || input.amount <= 0) return { ok: false, message: "সঠিক টাকার পরিমাণ দিন।" };
  if (!input.for_month) return { ok: false, message: "কোন মাসের বেতন তা নির্বাচন করুন।" };

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .insert({
      student_id: input.student_id,
      amount: Number(input.amount),
      method: input.method || "cash",
      for_month: input.for_month,
      note: input.note?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "পেমেন্ট রেকর্ড ব্যর্থ: " + error.message };
  }

  revalidatePath("/payments");
  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true, payment: data as Payment };
}

// ৩. নতুন শিক্ষার্থী ভর্তি + সাথে সাথে প্রথম পেমেন্ট গ্রহণ (কাস্টম ভর্তির তারিখ সহ)
export async function recordNewStudentAndPayment(
  input: QuickStudentAndPaymentInput
): Promise<PaymentActionResult> {
  const supabase = await createClient();

  const name = input.full_name?.trim();
  const phone = input.phone?.trim();
  if (!name) return { ok: false, message: "শিক্ষার্থীর নাম দিন।" };
  if (!phone) return { ok: false, message: "মোবাইল নম্বর দিন।" };
  if (!input.amount || input.amount <= 0) return { ok: false, message: "বেতনের পরিমাণ দিন।" };

  const studentInsert: Record<string, unknown> = {
    full_name: name,
    phone,
    college: input.college?.trim() || "চৌদ্দগ্রাম সরকারি কলেজ",
    college_roll: input.college_roll?.trim() || "",
    group_name: input.group_name?.trim() || "বিজ্ঞান বিভাগ",
    batch_id: input.batch_id || null,
    batch_name_snapshot: input.batch_name_snapshot || null,
    status: "confirmed",
  };

  if (input.created_at) {
    studentInsert.created_at = new Date(input.created_at).toISOString();
  }

  // প্রথমে শিক্ষার্থী তৈরি
  const { data: studentData, error: studentErr } = await supabase
    .from(STUDENTS_TABLE)
    .insert(studentInsert)
    .select()
    .single();

  if (studentErr || !studentData) {
    return { ok: false, message: "শিক্ষার্থী তৈরি ব্যর্থ: " + (studentErr?.message || "") };
  }

  // এরপর তার পেমেন্ট এন্ট্রি
  const { data: paymentData, error: paymentErr } = await supabase
    .from(PAYMENTS_TABLE)
    .insert({
      student_id: studentData.id,
      amount: Number(input.amount),
      method: input.method || "cash",
      for_month: input.for_month,
      note: input.note?.trim() || "ভর্তিকালীন প্রথম মাসের বেতন (নগদ)",
    })
    .select()
    .single();

  if (paymentErr) {
    return { ok: false, message: "শিক্ষার্থী তৈরি হলেও পেমেন্ট সেভ করা যায়নি: " + paymentErr.message };
  }

  revalidatePath("/payments");
  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true, payment: paymentData as Payment };
}

// ৪. পেমেন্ট তথ্য এডিট করা (টাকা, মাধ্যম, মাস, নোট)
export async function updatePayment(
  id: string,
  input: Omit<PaymentInput, "student_id">
): Promise<PaymentActionResult> {
  const supabase = await createClient();

  if (!input.amount || input.amount <= 0) return { ok: false, message: "সঠিক টাকার পরিমাণ দিন।" };

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .update({
      amount: Number(input.amount),
      method: input.method,
      for_month: input.for_month,
      note: input.note?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "পেমেন্ট আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/payments");
  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true, payment: data as Payment };
}

// ৫. পেমেন্ট রেকর্ড মুছে ফেলা
export async function deletePayment(id: string): Promise<PaymentActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from(PAYMENTS_TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "পেমেন্ট ডিলিট করা যায়নি: " + error.message };
  }

  revalidatePath("/payments");
  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true };
}
