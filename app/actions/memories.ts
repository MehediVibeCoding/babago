"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { FarewellMemory } from "@/lib/types";

const TABLE = "farewell_memories";

export interface MemoryActionResult {
  ok: boolean;
  message?: string;
  memory?: FarewellMemory;
}

export interface FarewellMemoryInput {
  batch_tag: string;
  image_url: string;
  slot_type?: "hero_16_9" | "sub_9_16";
  focal_position?: "top" | "center" | "bottom";
  sort_order?: number;
}

// ১. সকল বিদায় ও স্মৃতি অ্যালবাম লোড করা
export async function getFarewellMemories(): Promise<FarewellMemory[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching farewell memories:", error.message);
    return [];
  }

  return (data || []) as FarewellMemory[];
}

// ২. নতুন স্মৃতি ছবি যুক্ত করা (সম্পূর্ণ ক্যাপশন-মুক্ত)
export async function createFarewellMemory(
  input: FarewellMemoryInput
): Promise<MemoryActionResult> {
  const supabase = await createAdminClient();

  const batchTag = input.batch_tag?.trim();
  const imageUrl = input.image_url?.trim();

  if (!imageUrl) {
    return { ok: false, message: "ছবির সঠিক লিংক (Cloudinary / Image URL) দিন।" };
  }
  if (!batchTag) {
    return { ok: false, message: "বিদায় ব্যাচ বা স্মৃতি ইভেন্টের ট্যাগ নির্বাচন করুন।" };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      batch_tag: batchTag,
      caption: "", // কোনো ক্যাপশন থাকবে না
      image_url: imageUrl,
      sort_order: input.sort_order ?? (input.slot_type === "hero_16_9" ? 0 : 1),
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "স্মৃতি ছবি সংরক্ষণ ব্যর্থ: " + error.message };
  }

  revalidatePath("/gallery/memories");
  revalidatePath("/");
  return { ok: true, memory: data as FarewellMemory };
}

// ৩. স্মৃতি ছবির ট্যাগ, লিংক বা স্লট আপডেট করা
export async function updateFarewellMemory(
  id: string,
  input: FarewellMemoryInput
): Promise<MemoryActionResult> {
  const supabase = await createAdminClient();

  const batchTag = input.batch_tag?.trim();
  const imageUrl = input.image_url?.trim();

  if (!imageUrl) {
    return { ok: false, message: "ছবির লিংক দিন।" };
  }
  if (!batchTag) {
    return { ok: false, message: "ব্যাচ ট্যাগ দিন।" };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      batch_tag: batchTag,
      caption: "",
      image_url: imageUrl,
      sort_order: input.sort_order ?? (input.slot_type === "hero_16_9" ? 0 : 1),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/gallery/memories");
  revalidatePath("/");
  return { ok: true, memory: data as FarewellMemory };
}

// ৪. স্মৃতি ছবি মুছে ফেলা
export async function deleteFarewellMemory(id: string): Promise<MemoryActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/gallery/memories");
  revalidatePath("/");
  return { ok: true };
}
