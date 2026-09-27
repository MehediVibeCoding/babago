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

// ১. ইউটিউব ভিডিও আইডি পার্সার
function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// ২. ফেসবুক বা যেকোনো ভিডিও লিংক থেকে আসল থাম্বনেইল (OpenGraph) বের করার ইঞ্জিন
async function extractOpenGraphImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);

    if (ogMatch && ogMatch[1]) {
      return ogMatch[1].replace(/&amp;/g, "&");
    }
    return null;
  } catch {
    return null;
  }
}

// ৩. অটো-থাম্বনেইল রেজলভার
async function resolveAutoThumbnail(videoUrl: string, customThumb?: string | null): Promise<string | null> {
  if (customThumb?.trim()) return customThumb.trim();

  // ক. ইউটিউব হলে
  const ytId = parseYouTubeId(videoUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  // খ. ফেসবুক বা অন্য লিংক হলে
  const ogImg = await extractOpenGraphImage(videoUrl);
  if (ogImg) return ogImg;

  return null;
}

// ৪. ক্লায়েন্ট থেকে লাইভ থাম্বনেইল ডিটেক্ট করার সার্ভার অ্যাকশন
export async function fetchLiveThumbnailAction(videoUrl: string): Promise<{ thumbnailUrl: string | null }> {
  const thumb = await resolveAutoThumbnail(videoUrl);
  return { thumbnailUrl: thumb };
}

// ৫. সকল ভিডিও লেকচার লোড করা
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

// ৬. নতুন ভিডিও লেকচার যুক্ত করা (অটোমেটিক আসল থাম্বনেইল সহ)
export async function createVideoLecture(
  input: VideoLectureInput
): Promise<VideoActionResult> {
  const supabase = await createClient();

  const title = input.title?.trim();
  const videoUrl = input.video_url?.trim();

  if (!title) return { ok: false, message: "ভিডিওর শিরোনাম দিন।" };
  if (!videoUrl) return { ok: false, message: "ফেসবুক বা ইউটিউব ভিডিওর লিংক দিন।" };

  // সার্ভার স্বয়ংক্রিয়ভাবে ভিডিও লিংক থেকে আসল থাম্বনেইল টেনে বের করবে
  const autoThumbnail = await resolveAutoThumbnail(videoUrl, input.thumbnail_url);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title,
      video_url: videoUrl,
      thumbnail_url: autoThumbnail,
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

// ৭. ভিডিও লেকচার আপডেট করা
export async function updateVideoLecture(
  id: string,
  input: VideoLectureInput
): Promise<VideoActionResult> {
  const supabase = await createClient();

  const title = input.title?.trim();
  const videoUrl = input.video_url?.trim();

  if (!title) return { ok: false, message: "ভিডিওর শিরোনাম দিন।" };
  if (!videoUrl) return { ok: false, message: "ভিডিওর লিংক দিন।" };

  const autoThumbnail = await resolveAutoThumbnail(videoUrl, input.thumbnail_url);

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      title,
      video_url: videoUrl,
      thumbnail_url: autoThumbnail,
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

// ৮. ভিডিও লেকচার মুছে ফেলা
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
