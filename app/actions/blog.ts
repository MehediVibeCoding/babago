"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/types";

const BLOG_TABLE = "blog_posts";

export interface BlogActionResult {
  ok: boolean;
  message?: string;
  post?: BlogPost;
}

export interface BlogPostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url?: string | null;
  published: boolean;
}

// ১. সকল ব্লগ পোস্ট লোড করা
export async function getBlogPostsData(): Promise<BlogPost[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error.message);
    return [];
  }

  return (data || []) as BlogPost[];
}

// ২. নতুন ব্লগ পোস্ট তৈরি করা
export async function createBlogPost(input: BlogPostInput): Promise<BlogActionResult> {
  const supabase = await createAdminClient();

  const title = input.title?.trim();
  const slug = input.slug
    ?.trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");

  if (!title) return { ok: false, message: "ব্লগের শিরোনাম দিন।" };
  if (!slug) return { ok: false, message: "ব্লগের সঠিক ইউআরএল স্লাগ দিন।" };

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .insert({
      title,
      slug,
      excerpt: input.excerpt?.trim() || "",
      content: input.content?.trim() || "",
      cover_image_url: input.cover_image_url?.trim() || null,
      published: input.published ?? false,
      published_at: input.published ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return {
      ok: false,
      message: isDuplicate
        ? "এই স্লাগ দিয়ে ইতিমধ্যে একটি ব্লগ আছে, অন্য স্লাগ দিন।"
        : "পোস্ট তৈরি ব্যর্থ: " + error.message,
    };
  }

  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true, post: data as BlogPost };
}

// ৩. ব্লগ পোস্ট আপডেট করা
export async function updateBlogPost(id: string, input: BlogPostInput): Promise<BlogActionResult> {
  const supabase = await createAdminClient();

  const title = input.title?.trim();
  const slug = input.slug
    ?.trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");

  if (!title) return { ok: false, message: "ব্লগের শিরোনাম দিন।" };
  if (!slug) return { ok: false, message: "ব্লগের সঠিক ইউআরএল স্লাগ দিন।" };

  const { data: existing } = await supabase
    .from(BLOG_TABLE)
    .select("published_at")
    .eq("id", id)
    .single();

  const shouldSetPublishedAt = input.published && !existing?.published_at;

  const updateData: Record<string, unknown> = {
    title,
    slug,
    excerpt: input.excerpt?.trim() || "",
    content: input.content?.trim() || "",
    cover_image_url: input.cover_image_url?.trim() || null,
    published: input.published,
  };

  if (shouldSetPublishedAt) {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true, post: data as BlogPost };
}

// ৪. ১-ক্লিক পাবলিশ / আনপাবলিশ টগল (মেইন ওয়েবসাইটে লাইভ কন্ট্রোল)
export async function toggleBlogPublish(id: string, published: boolean): Promise<BlogActionResult> {
  const supabase = await createAdminClient();

  const { data: existing } = await supabase
    .from(BLOG_TABLE)
    .select("published_at")
    .eq("id", id)
    .single();

  const published_at = published ? existing?.published_at || new Date().toISOString() : null;

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .update({
      published,
      published_at,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "পাবলিশ স্ট্যাটাস পরিবর্তন ব্যর্থ: " + error.message };
  }

  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true, post: data as BlogPost };
}

// ৫. ব্লগ পোস্ট মুছে ফেলা
export async function deleteBlogPost(id: string): Promise<BlogActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from(BLOG_TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true };
    }
