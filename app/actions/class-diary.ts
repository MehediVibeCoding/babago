"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { ClassDiaryEntry, Batch } from "@/lib/types";

const DIARY_TABLE = "class_diary_entries";
const BATCHES_TABLE = "batches";

export interface ClassDiaryActionResult {
  ok: boolean;
  message?: string;
  entry?: ClassDiaryEntry;
}

export interface ClassDiaryInput {
  entry_date: string; // YYYY-MM-DD
  batch_id?: string | null;
  batch_name_snapshot: string;
  topic: string;
  note: string;
  slide_url?: string | null;
}

// ১. সকল ক্লাস ডায়েরি এন্ট্রি ও ব্যাচসমূহ লোড করা
export async function getClassDiaryData(): Promise<{
  entries: ClassDiaryEntry[];
  batches: Batch[];
}> {
  const supabase = await createAdminClient();

  const [
    { data: diaryData, error: dErr },
    { data: batchesData, error: bErr },
  ] = await Promise.all([
    supabase.from(DIARY_TABLE).select("*").order("entry_date", { ascending: false }),
    supabase.from(BATCHES_TABLE).select("*").order("sort_order", { ascending: true }),
  ]);

  if (dErr) console.error("Error fetching class diary:", dErr.message);
  if (bErr) console.error("Error fetching batches:", bErr.message);

  return {
    entries: (diaryData || []) as ClassDiaryEntry[],
    batches: (batchesData || []) as Batch[],
  };
}

// ২. নতুন ক্লাস ডায়েরি এন্ট্রি যুক্ত করা
export async function createClassDiaryEntry(input: ClassDiaryInput): Promise<ClassDiaryActionResult> {
  const supabase = await createAdminClient();

  const topic = input.topic?.trim();
  if (!topic) return { ok: false, message: "ক্লাসের মূল টপিক বা শিরোনাম দিন।" };
  if (!input.entry_date) return { ok: false, message: "ক্লাসের তারিখ নির্বাচন করুন।" };
  if (!input.batch_name_snapshot?.trim()) return { ok: false, message: "ব্যাচ বা শ্রেণির ট্যাগ দিন।" };

  const { data, error } = await supabase
    .from(DIARY_TABLE)
    .insert({
      entry_date: input.entry_date,
      batch_id: input.batch_id || null,
      batch_name_snapshot: input.batch_name_snapshot.trim(),
      topic,
      note: input.note?.trim() || "",
      slide_url: input.slide_url?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "ক্লাস ডায়েরি পোস্ট করতে ব্যর্থ: " + error.message };
  }

  revalidatePath("/class-diary");
  revalidatePath("/");
  return { ok: true, entry: data as ClassDiaryEntry };
}

// ৩. ক্লাস ডায়েরি এন্ট্রি আপডেট করা
export async function updateClassDiaryEntry(
  id: string,
  input: ClassDiaryInput
): Promise<ClassDiaryActionResult> {
  const supabase = await createAdminClient();

  const topic = input.topic?.trim();
  if (!topic) return { ok: false, message: "ক্লাসের মূল টপিক বা শিরোনাম দিন।" };
  if (!input.entry_date) return { ok: false, message: "ক্লাসের তারিখ নির্বাচন করুন।" };

  const { data, error } = await supabase
    .from(DIARY_TABLE)
    .update({
      entry_date: input.entry_date,
      batch_id: input.batch_id || null,
      batch_name_snapshot: input.batch_name_snapshot.trim(),
      topic,
      note: input.note?.trim() || "",
      slide_url: input.slide_url?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/class-diary");
  revalidatePath("/");
  return { ok: true, entry: data as ClassDiaryEntry };
}

// ৪. ক্লাস ডায়েরি এন্ট্রি মুছে ফেলা
export async function deleteClassDiaryEntry(id: string): Promise<ClassDiaryActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from(DIARY_TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/class-diary");
  revalidatePath("/");
  return { ok: true };
}
