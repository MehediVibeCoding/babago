"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { SuccessTopper } from "@/lib/types";

const TABLE = "success_toppers";

export interface TopperActionResult {
  ok: boolean;
  message?: string;
  topper?: SuccessTopper;
}

export interface SuccessTopperInput {
  name: string;
  batch: string;
  result: string; // e.g. "GPA 5.00"
  subject: string; // e.g. "English A+, ICT A+"
  college: string;
  photo_url?: string | null;
  sort_order?: number;
}

// ১. সকল কৃতি শিক্ষার্থীর তথ্য লোড করা
export async function getSuccessToppers(): Promise<SuccessTopper[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching toppers:", error.message);
    return [];
  }

  return (data || []) as SuccessTopper[];
}

// ২. নতুন কৃতি শিক্ষার্থী যুক্ত করা
export async function createSuccessTopper(
  input: SuccessTopperInput
): Promise<TopperActionResult> {
  const supabase = await createAdminClient();

  const name = input.name?.trim();
  const batch = input.batch?.trim();
  const result = input.result?.trim();
  const subject = input.subject?.trim();
  const college = input.college?.trim();

  if (!name) return { ok: false, message: "শিক্ষার্থীর নাম দিন।" };
  if (!batch) return { ok: false, message: "ব্যাচ বা বছর দিন (যেমন: HSC 2025)।" };
  if (!result) return { ok: false, message: "প্রাপ্ত রেজাল্ট দিন (যেমন: GPA 5.00)।" };
  if (!subject) return { ok: false, message: "বিষয়ভিত্তিক ফলাফল দিন (যেমন: English A+)।" };
  if (!college) return { ok: false, message: "কলেজের নাম দিন।" };

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name,
      batch,
      result,
      subject,
      college,
      photo_url: input.photo_url?.trim() || null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "কৃতি শিক্ষার্থী সংরক্ষণ ব্যর্থ: " + error.message };
  }

  revalidatePath("/toppers");
  revalidatePath("/");
  return { ok: true, topper: data as SuccessTopper };
}

// ৩. কৃতি শিক্ষার্থীর তথ্য আপডেট করা
export async function updateSuccessTopper(
  id: string,
  input: SuccessTopperInput
): Promise<TopperActionResult> {
  const supabase = await createAdminClient();

  const name = input.name?.trim();
  const batch = input.batch?.trim();
  const result = input.result?.trim();
  const subject = input.subject?.trim();
  const college = input.college?.trim();

  if (!name) return { ok: false, message: "শিক্ষার্থীর নাম দিন।" };
  if (!batch) return { ok: false, message: "ব্যাচ দিন।" };
  if (!result) return { ok: false, message: "রেজাল্ট দিন।" };
  if (!subject) return { ok: false, message: "বিষয়ভিত্তিক ফলাফল দিন।" };
  if (!college) return { ok: false, message: "কলেজের নাম দিন।" };

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      name,
      batch,
      result,
      subject,
      college,
      photo_url: input.photo_url?.trim() || null,
      sort_order: input.sort_order ?? 0,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/toppers");
  revalidatePath("/");
  return { ok: true, topper: data as SuccessTopper };
}

// ৪. কৃতি শিক্ষার্থী মুছে ফেলা
export async function deleteSuccessTopper(id: string): Promise<TopperActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/toppers");
  revalidatePath("/");
  return { ok: true };
          }
