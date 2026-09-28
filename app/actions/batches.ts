"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { Batch, Student } from "@/lib/types";

const BATCHES_TABLE = "batches";
const STUDENTS_TABLE = "students";

export interface BatchActionResult {
  ok: boolean;
  message?: string;
  batch?: Batch;
}

export interface BatchInput {
  name: string;
  target_cohort: string;
  badge: string;
  schedule: string;
  location: string;
  features: string[];
  seats_left: number | null;
  is_active: boolean;
  sort_order?: number;
}

// ১. ব্যাচসমূহ ও শিক্ষার্থীদের তালিকা লোড করা (প্রতি ব্যাচে কতজন শিক্ষার্থী আছে তা গণনার জন্য)
export async function getBatchesData(): Promise<{
  batches: Batch[];
  students: Student[];
}> {
  const supabase = await createAdminClient();

  const [
    { data: batchesData, error: bErr },
    { data: studentsData, error: sErr },
  ] = await Promise.all([
    supabase.from(BATCHES_TABLE).select("*").order("sort_order", { ascending: true }),
    supabase.from(STUDENTS_TABLE).select("id, batch_id, status"),
  ]);

  if (bErr) console.error("Error fetching batches:", bErr.message);
  if (sErr) console.error("Error fetching students:", sErr.message);

  return {
    batches: (batchesData || []) as Batch[],
    students: (studentsData || []) as Student[],
  };
}

// ২. নতুন ব্যাচ তৈরি করা
export async function createBatch(input: BatchInput): Promise<BatchActionResult> {
  const supabase = await createAdminClient();

  const name = input.name?.trim();
  if (!name) return { ok: false, message: "ব্যাচের নাম আবশ্যক।" };
  if (!input.schedule?.trim()) return { ok: false, message: "ক্লাসের শিডিউল দিন।" };

  const { data, error } = await supabase
    .from(BATCHES_TABLE)
    .insert({
      name,
      target_cohort: input.target_cohort?.trim() || "HSC 2028 ব্যাচ",
      badge: input.badge?.trim() || "ভর্তি চলছে",
      schedule: input.schedule?.trim(),
      location: input.location?.trim() || "চৌদ্দগ্রাম একাডেমি শাখা",
      features: input.features || [],
      seats_left: input.seats_left !== null && input.seats_left !== undefined ? Number(input.seats_left) : 10,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 10,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "ব্যাচ তৈরি ব্যর্থ: " + error.message };
  }

  revalidatePath("/batches");
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/");
  return { ok: true, batch: data as Batch };
}

// ৩. ব্যাচের তথ্য আপডেট করা
export async function updateBatch(id: string, input: BatchInput): Promise<BatchActionResult> {
  const supabase = await createAdminClient();

  const name = input.name?.trim();
  if (!name) return { ok: false, message: "ব্যাচের নাম আবশ্যক।" };

  const { data, error } = await supabase
    .from(BATCHES_TABLE)
    .update({
      name,
      target_cohort: input.target_cohort?.trim() || "HSC 2028 ব্যাচ",
      badge: input.badge?.trim() || "ভর্তি চলছে",
      schedule: input.schedule?.trim(),
      location: input.location?.trim() || "চৌদ্দগ্রাম একাডেমি শাখা",
      features: input.features || [],
      seats_left: input.seats_left !== null && input.seats_left !== undefined ? Number(input.seats_left) : 10,
      is_active: input.is_active ?? true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "ব্যাচ আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/batches");
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/");
  return { ok: true, batch: data as Batch };
}

// ৪. ব্যাচ সক্রিয়/নিষ্ক্রিয় টগল করা (মেইন ওয়েবসাইটের সিঙ্ক)
export async function toggleBatchActive(id: string, is_active: boolean): Promise<BatchActionResult> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from(BATCHES_TABLE)
    .update({ is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "স্ট্যাটাস পরিবর্তন ব্যর্থ: " + error.message };
  }

  revalidatePath("/batches");
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/");
  return { ok: true, batch: data as Batch };
}

// ৫. ব্যাচ মুছে ফেলা
export async function deleteBatch(id: string): Promise<BatchActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from(BATCHES_TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "ব্যাচ মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/batches");
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/");
  return { ok: true };
                 }
