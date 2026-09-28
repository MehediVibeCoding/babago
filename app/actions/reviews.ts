"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { TestimonialItem } from "@/lib/types";

const TABLE = "testimonials";

export interface TestimonialActionResult {
  ok: boolean;
  message?: string;
  testimonial?: TestimonialItem;
}

export interface TestimonialInput {
  name: string;
  role_type: "শিক্ষার্থী" | "অভিভাবক";
  batch_year: string; // e.g. "HSC 2026", "HSC 2027"
  quote: string;
  is_featured?: boolean;
  sort_order?: number;
}

// ১. সকল রিভিউ ও মতামত লোড করা
export async function getTestimonials(): Promise<TestimonialItem[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching testimonials:", error.message);
    return [];
  }

  return (data || []) as TestimonialItem[];
}

// ২. নতুন রিভিউ যুক্ত করা
export async function createTestimonial(
  input: TestimonialInput
): Promise<TestimonialActionResult> {
  const supabase = await createAdminClient();

  const name = input.name?.trim();
  const quote = input.quote?.trim();
  const batchYear = input.batch_year?.trim();

  if (!name) return { ok: false, message: "নাম দিন।" };
  if (!quote) return { ok: false, message: "মতামত বা রিভিউ টেক্সট লিখুন।" };
  if (!batchYear) return { ok: false, message: "শিক্ষাবর্ষ বা ব্যাচ দিন।" };

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name,
      role_type: input.role_type || "শিক্ষার্থী",
      batch_year: batchYear,
      quote,
      is_featured: input.is_featured ?? false,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "রিভিউ সংরক্ষণ ব্যর্থ: " + error.message };
  }

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true, testimonial: data as TestimonialItem };
}

// ৩. রিভিউ আপডেট করা
export async function updateTestimonial(
  id: string,
  input: TestimonialInput
): Promise<TestimonialActionResult> {
  const supabase = await createAdminClient();

  const name = input.name?.trim();
  const quote = input.quote?.trim();
  const batchYear = input.batch_year?.trim();

  if (!name) return { ok: false, message: "নাম দিন।" };
  if (!quote) return { ok: false, message: "রিভিউ টেক্সট লিখুন।" };

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      name,
      role_type: input.role_type || "শিক্ষার্থী",
      batch_year: batchYear,
      quote,
      is_featured: input.is_featured ?? false,
      sort_order: input.sort_order ?? 0,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true, testimonial: data as TestimonialItem };
}

// ৪. ১-ক্লিক ফিচার্ড টগল (হোমপেজের উপরের ৩টি মূল কার্ডে দেখাবে কি না)
export async function toggleFeaturedTestimonial(
  id: string,
  is_featured: boolean
): Promise<TestimonialActionResult> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_featured })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "ফিচার্ড স্ট্যাটাস পরিবর্তন ব্যর্থ: " + error.message };
  }

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true, testimonial: data as TestimonialItem };
}

// ৫. রিভিউ মুছে ফেলা
export async function deleteTestimonial(id: string): Promise<TestimonialActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true };
    }
