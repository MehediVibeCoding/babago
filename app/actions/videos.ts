"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VideoLecture } from "@/lib/types";

const TABLE = "video_lectures";

export interface VideoActionResult {
  ok: boolean;
  message?: string;
  video?: VideoLecture;
}

export interface VideoLectureInput {
  title: string;
  video_url: string;
  thumbnail_url?: string | null;
  sort_order?: number;
}

// ১. সকল ভিডিও লেকচার লোড করা
export async function getVideoLectures(): Promise<VideoLecture[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching video lectures:", error.message);
    return [];
  }

  return (data || []) as VideoLecture[];
}

// ২. নতুন ভিডিও লেকচার যুক্ত করা
export async function createVideoLecture(
  input: VideoLectureInput
): Promise<VideoActionResult> {
  const supabase = await createClient();

  const title = input.title?.trim();
  const videoUrl = input.video_url?.trim();

  if (!title) return { ok: false, message: "ভিডিওর শিরোনাম দিন।" };
  if (!videoUrl) return { ok: false, message: "ইউটিউব বা ভিডিওর লিংক দিন।" };

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title,
      video_url: videoUrl,
      thumbnail_url: input.thumbnail_url?.trim() || null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "ভিডিও সংরক্ষণ ব্যর্থ: " + error.message };
  }

  revalidatePath("/videos");
  revalidatePath("/");
  return { ok: true, video: data as VideoLecture };
}

// ৩. ভিডিও লেকচার আপডেট করা
export async function updateVideoLecture(
  id: string,
  input: VideoLectureInput
): Promise<VideoActionResult> {
  const supabase = await createClient();

  const title = input.title?.trim();
  const videoUrl = input.video_url?.trim();

  if (!title) return { ok: false, message: "ভিডিওর শিরোনাম দিন।" };
  if (!videoUrl) return { ok: false, message: "ইউটিউব বা ভিডিওর লিংক দিন।" };

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      title,
      video_url: videoUrl,
      thumbnail_url: input.thumbnail_url?.trim() || null,
      sort_order: input.sort_order ?? 0,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/videos");
  revalidatePath("/");
  return { ok: true, video: data as VideoLecture };
}

// ৪. ভিডিও লেকচার মুছে ফেলা
export async function deleteVideoLecture(id: string): Promise<VideoActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/videos");
  revalidatePath("/");
  return { ok: true };
  }
