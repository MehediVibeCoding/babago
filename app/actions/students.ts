"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Student, StudentStatus, Batch, Payment } from "@/lib/types";

const STUDENTS_TABLE = "students";
const BATCHES_TABLE = "batches";
const PAYMENTS_TABLE = "payments";

export interface StudentActionResult {
  ok: boolean;
  message?: string;
  student?: Student;
}

export interface StudentInput {
  full_name: string;
  college: string;
  college_roll: string;
  group_name: string;
  batch_id: string | null;
  batch_name_snapshot: string | null;
  phone: string;
  guardian_phone: string;
  status: StudentStatus;
}

// ১. শিক্ষার্থীদের তালিকা ও সংশ্লিষ্ট তথ্য লোড করা
export async function getStudentsData(): Promise<{
  students: Student[];
  batches: Batch[];
  payments: Payment[];
}> {
  const supabase = await createClient();

  const [
    { data: studentsData, error: sErr },
    { data: batchesData, error: bErr },
    { data: paymentsData, error: pErr },
  ] = await Promise.all([
    supabase.from(STUDENTS_TABLE).select("*").order("created_at", { ascending: false }),
    supabase.from(BATCHES_TABLE).select("*").order("sort_order", { ascending: true }),
    supabase.from(PAYMENTS_TABLE).select("*").order("created_at", { ascending: false }),
  ]);

  if (sErr) console.error("Error fetching students:", sErr.message);
  if (bErr) console.error("Error fetching batches:", bErr.message);
  if (pErr) console.error("Error fetching payments:", pErr.message);

  return {
    students: (studentsData || []) as Student[],
    batches: (batchesData || []) as Batch[],
    payments: (paymentsData || []) as Payment[],
  };
}

// ২. নতুন শিক্ষার্থী যুক্ত করা
export async function createStudent(input: StudentInput): Promise<StudentActionResult> {
  const supabase = await createClient();

  const name = input.full_name?.trim();
  const phone = input.phone?.trim();
  if (!name) return { ok: false, message: "শিক্ষার্থীর নাম আবশ্যক।" };
  if (!phone) return { ok: false, message: "মোবাইল নম্বর আবশ্যক।" };

  const { data, error } = await supabase
    .from(STUDENTS_TABLE)
    .insert({
      full_name: name,
      college: input.college?.trim() || "",
      college_roll: input.college_roll?.trim() || "",
      group_name: input.group_name?.trim() || "বিজ্ঞান বিভাগ",
      batch_id: input.batch_id || null,
      batch_name_snapshot: input.batch_name_snapshot || null,
      phone,
      guardian_phone: input.guardian_phone?.trim() || "",
      status: input.status || "confirmed",
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "শিক্ষার্থী যোগ করতে ব্যর্থ: " + error.message };
  }

  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true, student: data as Student };
}

// ৩. শিক্ষার্থী তথ্য আপডেট করা
export async function updateStudent(id: string, input: StudentInput): Promise<StudentActionResult> {
  const supabase = await createClient();

  const name = input.full_name?.trim();
  const phone = input.phone?.trim();
  if (!name) return { ok: false, message: "শিক্ষার্থীর নাম আবশ্যক।" };
  if (!phone) return { ok: false, message: "মোবাইল নম্বর আবশ্যক।" };

  const { data, error } = await supabase
    .from(STUDENTS_TABLE)
    .update({
      full_name: name,
      college: input.college?.trim() || "",
      college_roll: input.college_roll?.trim() || "",
      group_name: input.group_name?.trim() || "বিজ্ঞান বিভাগ",
      batch_id: input.batch_id || null,
      batch_name_snapshot: input.batch_name_snapshot || null,
      phone,
      guardian_phone: input.guardian_phone?.trim() || "",
      status: input.status || "confirmed",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true, student: data as Student };
}

// ৪. শিক্ষার্থীর স্ট্যাটাস পরিবর্তন (confirmed / pending / inactive)
export async function updateStudentStatus(id: string, status: StudentStatus): Promise<StudentActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(STUDENTS_TABLE)
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "স্ট্যাটাস পরিবর্তন ব্যর্থ: " + error.message };
  }

  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true, student: data as Student };
}

// ৫. শিক্ষার্থী মুছে ফেলা
export async function deleteStudent(id: string): Promise<StudentActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from(STUDENTS_TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা ব্যর্থ হয়েছে: " + error.message };
  }

  revalidatePath("/students");
  revalidatePath("/");
  return { ok: true };
      }
