"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { BlogPost } from "@/lib/types";
import {
  createBlogPost,
  updateBlogPost,
  toggleBlogPublish,
  deleteBlogPost,
  type BlogPostInput,
} from "@/app/actions/blog";
import { useToast } from "@/components/admin/Toast";
import Modal from "@/components/admin/Modal";
import {
  Badge,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Field,
  TextInput,
  TextArea,
  EmptyState,
} from "@/components/admin/ui";
import { toBengaliDigits, formatBengaliDate } from "@/lib/bengaliNumerals";

const EMPTY_FORM: BlogPostInput = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  published: true,
};

// 🎯 উদাহরণ টেমপ্লেট — "উদাহরণ লোড করুন" চাপলে এই স্ট্যান্ডার্ড ব্লগটি ফর্মে বসবে
const EXAMPLE_BLOG_TEMPLATE: BlogPostInput = {
  title: "HSC English: Flow Chart লেখার সহজ ৫টি নিয়ম ও পূর্ণ নম্বর পাওয়ার কৌশল",
  slug: "hsc-english-flow-chart-writing-rules",
  excerpt: "Flow Chart লেখার ক্ষেত্রে বক্সে কী লিখতে হবে, সংযোজক শব্দের ব্যবহার এবং বোর্ড পরীক্ষার কমন ভুলগুলো এড়িয়ে কীভাবে পুরো ৫ নম্বর পাওয়া যায়—তার বিস্তারিত গাইড।",
  content: `Flow Chart হলো HSC English 1st Paper-এর অন্যতম সহজ এবং পূর্ণ নম্বর তোলার একটি গুরুত্বপূর্ণ অংশ। কিন্তু সামান্য ভুলের কারণে শিক্ষার্থীরা অনেক সময় পূর্ণ নম্বর থেকে বঞ্চিত হয়।

নিচে Flow Chart লেখার প্রধান ৫টি নিয়ম তুলে ধরা হলো:

### ১. সংক্ষিপ্ত নোট আকারে লেখা (Short Notes)
বক্সের ভেতরে কখনোই পুরো দীর্ঘ বাক্য লেখা যাবে না। সবসময় সংক্ষিপ্ত ফ্রেজ বা নোট আকারে লিখতে হবে।

### ২. গ্রামাটিক্যাল ধারাবাহিকতা (Parallel Structure)
প্রশ্নপত্রে দেওয়া প্রথম বক্সে যে গ্রামাটিক্যাল ফর্ম (যেমন: Gerund বা V+ing / Base Verb) ব্যবহার করা হয়েছে, বাকি ৫টি বক্সেও ঠিক একই ফর্ম বজায় রাখতে হবে।

### ৩. তীরচিহ্ন নিশ্চিত করা (Arrow Marks)
প্রতিটি বক্সের মাঝে স্পষ্টভাবে অনুভূমিক বা উল্লম্ব তীরচিহ্ন (→ বা ↓) দিতে হবে যাতে ধারাবাহিকতা স্পষ্ট থাকে।

### ৪. সঠিক ক্রম বজায় রাখা
প্যাসেজের ঘটনার ক্রম অনুযায়ী বক্সগুলো সাজাতে হবে, আগে-পরের ঘটনা এলোমেলো করা যাবে না।

### ৫. বক্সের সাইজ ও পরিচ্ছন্নতা
প্রতিটি বক্স যেন সমান সাইজের এবং পরিষ্কার-পরিচ্ছন্ন হয় সেদিকে খেয়াল রাখতে হবে।

উপসংহার:
নিয়মিত অনুশীলন এবং প্যাসেজ পড়ার অভ্যাস থাকলে Flow Chart-এ পুরো ৫ এ ৫ পাওয়া একেবারেই সহজ। ক্লাসে দেওয়া লেকচার শিট থেকে অন্তত ৫টি প্রশ্ন আজই সমাধান করো।`,
  cover_image_url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
  published: true,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");
}

export default function BlogPageClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const searchParams = useSearchParams();
  const { show: showToast } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogPostInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // সম্পূর্ণ পোস্ট পড়ার প্রিভিউ মোডাল
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      openAddModal();
    }
  }, [searchParams]);

  // ফিল্টার করা পোস্ট
  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.published) ||
        (statusFilter === "draft" && !p.published);

      return matchSearch && matchStatus;
    });
  }, [posts, search, statusFilter]);

  // পরিসংখ্যান
  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.published).length;
    const draft = total - published;
    return { total, published, draft };
  }, [posts]);

  function openAddModal() {
    setEditingPost(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(post: BlogPost) {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      cover_image_url: post.cover_image_url || "",
      published: post.published,
    });
    setModalOpen(true);
  }

  // 📝 স্মার্ট উদাহরণ টেমপ্লেট লোড
  function handleLoadExample() {
    setFormData(EXAMPLE_BLOG_TEMPLATE);
    showToast("উদাহরণ ব্লগ টেমপ্লেট ফর্মে লোড হয়েছে ✓", "info");
  }

  function handleTitleChange(title: string) {
    setFormData((prev) => ({
      ...prev,
      title,
      // যদি নতুন পোস্ট হয়, তাহলে শিরোনামের সাথে মিলিয়ে অটো স্লাগ সাজাবে
      slug: !editingPost ? slugify(title) : prev.slug,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("ব্লগের শিরোনাম আবশ্যক।", "error");
      return;
    }
    if (!formData.slug.trim()) {
      showToast("ব্লগের ইউআরএল স্লাগ দিন।", "error");
      return;
    }

    setSaving(true);
    if (editingPost) {
      const res = await updateBlogPost(editingPost.id, formData);
      setSaving(false);
      if (res.ok && res.post) {
        setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? res.post! : p)));
        showToast("ব্লগ পোস্ট সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createBlogPost(formData);
      setSaving(false);
      if (res.ok && res.post) {
        setPosts((prev) => [res.post!, ...prev]);
        showToast("নতুন ব্লগ সফলভাবে প্রকাশ হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "পোস্ট প্রকাশ করতে সমস্যা হয়েছে।", "error");
      }
    }
  }

  // ১-ক্লিক পাবলিশ সুইচ
  async function handleTogglePublish(post: BlogPost, currentPublished: boolean) {
    const nextState = !currentPublished;
    const res = await toggleBlogPublish(post.id, nextState);
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: nextState, published_at: nextState ? (p.published_at || new Date().toISOString()) : p.published_at } : p))
      );
      showToast(
        nextState
          ? `"${post.title.slice(0, 20)}..." ওয়েবসাইটে লাইভ প্রকাশ হয়েছে ✓`
          : `"${post.title.slice(0, 20)}..." ড্রাফট হিসেবে নামানো হয়েছে`,
        "info"
      );
    } else {
      showToast("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteBlogPost(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast("ব্লগ পোস্ট মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="ব্লগ ও আর্টিকেল ব্যবস্থাপনা"
        subtitle="স্টাডি টিপস, সিলেবাস বিশ্লেষণ, ইংরেজি ও আইসিটি প্রস্তুতি ব্লগ পরিচালনা করুন"
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন ব্লগ লিখুন</span>
          </PrimaryButton>
        }
      />

      {/* ওভারভিউ কার্ডস */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EBF5FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-700">মোট ব্লগ পোস্ট</p>
          <p className="mt-1 font-body text-[20px] font-black text-sky-950 sm:text-[22px]">{toBengaliDigits(stats.total)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">সর্বমোট লিখিত আর্টিকেল</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#ECFDF5] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-success">প্রকাশিত (Live)</p>
          <p className="mt-1 font-body text-[20px] font-black text-emerald-900 sm:text-[22px]">{toBengaliDigits(stats.published)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">মেইন ওয়েবসাইটে দৃশ্যমান</span>
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#FFFBEB] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-warn">ড্রাফট (সংরক্ষিত)</p>
          <p className="mt-1 font-body text-[20px] font-black text-amber-950 sm:text-[22px]">{toBengaliDigits(stats.draft)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">অপ্রকাশিত খসড়া</span>
        </div>
      </div>

      {/* সার্চ ও ফিল্টার বার */}
      <div className="mb-5 overflow-hidden rounded-[22px] border border-border-base/80 bg-white p-4 shadow-sh1 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-[240px] flex-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="ব্লগের শিরোনাম, স্লাগ বা ভেতরের লেখা দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[40px] w-full rounded-full border border-border-base/80 bg-surface-muted/60 pl-10 pr-9 font-body text-[13px] text-ink-800 placeholder:text-muted/70 outline-none transition-all focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-600/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted hover:text-ink-800"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল পোস্ট</option>
              <option value="published">🟢 শুধু প্রকাশিত (Live)</option>
              <option value="draft">🟡 শুধু ড্রাফট (Drafts)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🎯 ব্লগ কার্ড গ্রিড */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো ব্লগ পোস্ট পাওয়া যায়নি"
            hint="নতুন ব্লগ আর্টিকেল লিখুন অথবা সার্চ/ফিল্টার পরিবর্তন করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
            const dateStr = post.published_at ? formatBengaliDate(post.published_at.slice(0, 10)) : formatBengaliDate(post.created_at.slice(0, 10));

            return (
              <div
                key={post.id}
                className={`hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border bg-white p-5 shadow-sh1 transition-all duration-brand hover:shadow-sh2 ${
                  post.published ? "border-border-base/90" : "border-amber-200/80 bg-amber-50/20"
                }`}
              >
                <div>
                  {/* কার্ডের শীর্ষ: স্ট্যাটাস ও পাবলিশ সুইচ */}
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-border-base/50 pb-2.5">
                    <span className="font-body text-[11px] font-bold text-muted">
                      📅 {dateStr}
                    </span>

                    <div className="flex items-center gap-2">
                      <Badge tone={post.published ? "success" : "warn"}>
                        {post.published ? "🟢 প্রকাশিত" : "🟡 ড্রাফট"}
                      </Badge>
                      {/* ১-ক্লিক পাবলিশ টগল */}
                      <label className="flex cursor-pointer items-center" title={post.published ? "ওয়েবসাইটে লাইভ সক্রিয়" : "ওয়েবসাইটে বন্ধ"}>
                        <input
                          type="checkbox"
                          checked={post.published}
                          onChange={() => handleTogglePublish(post, post.published)}
                          className="h-4 w-4 rounded text-sky-600 focus:ring-sky-600"
                        />
                      </label>
                    </div>
                  </div>

                  {/* ব্লগের শিরোনাম */}
                  <h3 className="font-body text-[16px] font-black tracking-tight text-sky-950 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* স্লাগ ব্যাজ */}
                  <div className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-sky-700">
                    <span>🔗 /blog/{post.slug}</span>
                  </div>

                  {/* সংক্ষিপ্ত ভূমিকা */}
                  <p className="mt-2.5 line-clamp-3 font-body text-[12.5px] leading-relaxed text-ink-800/80">
                    {post.excerpt || "কোনো সংক্ষিপ্ত বিবরণ নেই।"}
                  </p>
                </div>

                {/* কার্ড ফুটার অ্যাকশনস */}
                <div className="mt-4 border-t border-border-base/60 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* প্রিভিউ বাটন */}
                    <button
                      type="button"
                      onClick={() => setPreviewPost(post)}
                      className="inline-flex items-center gap-1 font-body text-[12px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
                    >
                      <span>👁️ সম্পূর্ণ পোস্ট পড়ুন</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(post)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                        title="সম্পাদনা"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(post)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 text-danger transition-colors hover:bg-rose-100"
                        title="মুছে ফেলুন"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* নতুন ব্লগ / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPost ? "ব্লগ পোস্ট সম্পাদনা" : "নতুন ব্লগ আর্টিকেল লিখুন"}
        description="স্টাডি টিপস, গাইডলাইন বা একাডেমিক আলোচনার সম্পূর্ণ লেখাটি প্রস্তুত করুন।"
        maxWidth="max-w-2xl"
      >
        {/* 📝 mehediadmin স্টাইলে স্মার্ট উদাহরণ লোড বাটন */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">দ্রুত লেখার টেমপ্লেট</p>
              <p className="font-body text-[10.5px] text-sky-800">স্ট্যান্ডার্ড গাইডলাইন ও আর্টিকেলের নমুনা এক ক্লিকে লোড করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadExample}
            className="rounded-lg bg-white px-3 py-1.5 font-body text-[11.5px] font-extrabold text-sky-700 shadow-xs transition-colors hover:bg-sky-600 hover:text-white"
          >
            📝 উদাহরণ লোড করুন
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <Field label="ব্লগের শিরোনাম (Title) *" required>
            <TextInput
              required
              placeholder="যেমন: HSC English: Flow Chart লেখার সহজ ৫টি নিয়ম"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="ইউআরএল স্লাগ (URL Slug) *" required>
              <TextInput
                required
                placeholder="যেমন: hsc-english-flow-chart-rules"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
              />
            </Field>

            <Field label="কভার ছবির লিংক (ঐচ্ছিক)">
              <TextInput
                type="url"
                placeholder="https://images.unsplash.com/... বা ইমেজ URL"
                value={formData.cover_image_url || ""}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
              />
            </Field>
          </div>

          <Field label="সংক্ষিপ্ত ভূমিকা / সারসংক্ষেপ (Excerpt) *" required>
            <TextArea
              rows={2}
              required
              placeholder="২-৩ লাইনের আকর্ষণীয় ভূমিকা যা কার্ডে দেখাবে..."
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            />
          </Field>

          <Field label="মূল আর্টিকেল কনটেন্ট (Full Body Content) *" required>
            <TextArea
              rows={8}
              required
              placeholder={"এখানে সম্পূর্ণ লেখাটি প্যারাগ্রাফ, পয়েন্ট ও হেডিং আকারে লিখুন...\n\n### ১. প্রথম পয়েন্ট\nবিস্তারিত আলোচনা...\n\n### ২. দ্বিতীয় পয়েন্ট\nবিস্তারিত আলোচনা..."}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
            <div>
              <p className="font-body text-[12.5px] font-bold text-sky-950">সরাসরি ওয়েবসাইটে প্রকাশ করুন (Publish)</p>
              <p className="font-body text-[11px] text-muted">চালু থাকলে লেখাটি ওয়েবসাইটে সাথে সাথে লাইভ প্রদর্শিত হবে।</p>
            </div>
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="h-5 w-5 rounded text-sky-600 focus:ring-sky-600"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingPost ? "হালনাগাদ করুন" : formData.published ? "✓ প্রকাশ করুন" : "খসড়া সংরক্ষণ করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 👁️ সম্পূর্ণ ব্লগ পোস্ট পড়ার প্রিভিউ মোডাল */}
      <Modal
        open={!!previewPost}
        onClose={() => setPreviewPost(null)}
        title={previewPost?.title || "ব্লগ প্রিভিউ"}
        description={`প্রকাশের তারিখ: ${previewPost?.published_at ? formatBengaliDate(previewPost.published_at.slice(0, 10)) : "ড্রাফট"} · /blog/${previewPost?.slug || ""}`}
        maxWidth="max-w-2xl"
      >
        {previewPost && (
          <div className="space-y-4 max-h-[500px] overflow-y-auto sleek-scrollbar pr-2">
            {previewPost.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewPost.cover_image_url}
                alt={previewPost.title}
                className="h-48 w-full rounded-2xl object-cover border border-border-base/70 shadow-sm"
              />
            )}

            <div className="rounded-xl bg-sky-50/70 p-3.5 border border-sky-100 font-body text-[13px] font-medium leading-relaxed text-sky-950 italic">
              &ldquo;{previewPost.excerpt}&rdquo;
            </div>

            <div className="space-y-3 font-body text-[13.5px] leading-relaxed text-ink-800 whitespace-pre-line border-t border-border-base/50 pt-3">
              {previewPost.content}
            </div>

            <div className="flex justify-end border-t border-border-base/60 pt-3">
              <SecondaryButton type="button" onClick={() => setPreviewPost(null)}>
                বন্ধ করুন
              </SecondaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ডিলিট কনফার্মেশন মোডাল */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="ব্লগ পোস্ট মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">&quot;{deleteTarget?.title}&quot;</b> পোস্টটি মুছে ফেলতে চান?
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              বাতিল
            </SecondaryButton>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="rounded-full bg-danger px-5 py-2.5 font-body text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {deleting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
                        }
