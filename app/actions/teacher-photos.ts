"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { TeacherPhoto } from "@/lib/types";

const TABLE = "teacher_photos";

export interface TeacherPhotoResult {
  ok: boolean;
  message?: string;
  photo?: TeacherPhoto;
  photos?: TeacherPhoto[];
}

function validUrl(raw: string | undefined): string | null {
  const url = raw?.trim();
  if (!url || url.length > 2000) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// ১. সব ছবি (ক্রম অনুযায়ী)
export async function getTeacherPhotos(): Promise<TeacherPhoto[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching teacher photos:", error.message);
    return [];
  }
  return (data || []) as TeacherPhoto[];
}

// ২. নতুন ছবি যুক্ত করা (সবার শেষে বসবে)
export async function createTeacherPhoto(imageUrl: string): Promise<TeacherPhotoResult> {
  const supabase = await createAdminClient();
  const url = validUrl(imageUrl);
  if (!url) {
    return { ok: false, message: "ছবির সঠিক লিংক দিন (https:// দিয়ে শুরু হতে হবে)।" };
  }

  const { data: last } = await supabase
    .from(TABLE)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = ((last?.sort_order as number | undefined) ?? 0) + 1;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ image_url: url, sort_order: nextOrder })
    .select()
    .single();

  if (error) return { ok: false, message: "ছবি সংরক্ষণ ব্যর্থ: " + error.message };

  revalidatePath("/gallery/teacher");
  return { ok: true, photo: data as TeacherPhoto };
}

// ৩. ছবির লিংক বদলানো
export async function updateTeacherPhoto(id: string, imageUrl: string): Promise<TeacherPhotoResult> {
  const supabase = await createAdminClient();
  const url = validUrl(imageUrl);
  if (!url) {
    return { ok: false, message: "ছবির সঠিক লিংক দিন (https:// দিয়ে শুরু হতে হবে)।" };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ image_url: url })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };

  revalidatePath("/gallery/teacher");
  return { ok: true, photo: data as TeacherPhoto };
}

// ৪. ক্রম পরিবর্তন: পুরো তালিকার নতুন ক্রম (আইডির তালিকা) পাঠালে সেই অনুযায়ী সাজাবে
export async function reorderTeacherPhotos(orderedIds: string[]): Promise<TeacherPhotoResult> {
  const supabase = await createAdminClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from(TABLE)
      .update({ sort_order: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) return { ok: false, message: "ক্রম পরিবর্তন ব্যর্থ: " + error.message };
  }

  revalidatePath("/gallery/teacher");
  return { ok: true };
}

// ৫. ছবি মুছে ফেলা
export async function deleteTeacherPhoto(id: string): Promise<TeacherPhotoResult> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };

  revalidatePath("/gallery/teacher");
  return { ok: true };
}
