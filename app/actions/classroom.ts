"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ClassroomPhoto } from "@/lib/types";

const TABLE = "classroom_photos";

export interface ClassroomActionResult {
  ok: boolean;
  message?: string;
  photo?: ClassroomPhoto;
}

export interface ClassroomPhotoInput {
  image_url: string;
  slot_type?: "hero_16_9" | "sub_9_16";
  focal_position?: "top" | "center" | "bottom";
  sort_order?: number;
}

// ১. সকল ক্লাসরুমের ছবি লোড করা
export async function getClassroomPhotos(): Promise<ClassroomPhoto[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching classroom photos:", error.message);
    return [];
  }

  return (data || []) as ClassroomPhoto[];
}

// ২. নতুন ক্লাসরুম ছবি যুক্ত করা (সম্পূর্ণ ক্যাপশন-মুক্ত)
export async function createClassroomPhoto(
  input: ClassroomPhotoInput
): Promise<ClassroomActionResult> {
  const supabase = await createClient();
  const imageUrl = input.image_url?.trim();

  if (!imageUrl) {
    return { ok: false, message: "ছবির সঠিক লিংক (Cloudinary / Image URL) দিন।" };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      caption: "", // কোনো ক্যাপশন থাকবে না
      image_url: imageUrl,
      sort_order: input.sort_order ?? (input.slot_type === "hero_16_9" ? 0 : 1),
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "ছবি সংরক্ষণ ব্যর্থ: " + error.message };
  }

  revalidatePath("/gallery/classroom");
  revalidatePath("/");
  return { ok: true, photo: data as ClassroomPhoto };
}

// ৩. ছবির লিংক বা ক্রম আপডেট করা
export async function updateClassroomPhoto(
  id: string,
  input: ClassroomPhotoInput
): Promise<ClassroomActionResult> {
  const supabase = await createClient();
  const imageUrl = input.image_url?.trim();

  if (!imageUrl) {
    return { ok: false, message: "ছবির লিংক দিন।" };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({
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

  revalidatePath("/gallery/classroom");
  revalidatePath("/");
  return { ok: true, photo: data as ClassroomPhoto };
}

// ৪. ক্লাসরুম ছবি মুছে ফেলা
export async function deleteClassroomPhoto(id: string): Promise<ClassroomActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/gallery/classroom");
  revalidatePath("/");
  return { ok: true };
}
