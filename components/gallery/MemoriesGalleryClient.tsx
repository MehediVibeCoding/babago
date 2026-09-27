"use client";

import { useMemo, useState } from "react";
import type { FarewellMemory } from "@/lib/types";
import {
  createFarewellMemory,
  updateFarewellMemory,
  deleteFarewellMemory,
  type FarewellMemoryInput,
} from "@/app/actions/memories";
import { useToast } from "@/components/admin/Toast";
import Modal from "@/components/admin/Modal";
import {
  Badge,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Field,
  TextInput,
  Select,
  EmptyState,
} from "@/components/admin/ui";
import { toBengaliDigits, formatBengaliDate } from "@/lib/bengaliNumerals";

// শুধুমাত্র বিদায় ব্যাচসমূহ ও স্মৃতি অ্যালবাম ট্যাগ (ক্লাসরুম মোমেন্টস সম্পূর্ণ বাদ)
const DEFAULT_BATCH_TAGS = [
  "HSC 2025 বিদায় সংবর্ধনা",
  "HSC 2026 বিদায় উৎসব",
  "পুরস্কার বিতরণী ও স্মৃতি",
  "বিশেষ স্মৃতি অ্যালবাম",
];

const EMPTY_FORM: FarewellMemoryInput = {
  batch_tag: "HSC 2025 বিদায় সংবর্ধনা",
  caption: "",
  image_url: "",
  sort_order: 0,
};

// 🎯 উদাহরণ টেমপ্লেট
const EXAMPLE_MEMORY_TEMPLATE: FarewellMemoryInput = {
  batch_tag: "HSC 2025 বিদায় সংবর্ধনা",
  caption: "বিদায়ের ক্ষণে শিক্ষক ও শিক্ষার্থীদের আন্তরিক ভালোবাসার উপহার বিতরণী মুহূর্ত",
  image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  sort_order: 1,
};

export default function MemoriesGalleryClient({
  initialMemories,
}: {
  initialMemories: FarewellMemory[];
}) {
  const { show: showToast } = useToast();

  const [memories, setMemories] = useState<FarewellMemory[]>(initialMemories);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<FarewellMemory | null>(null);
  const [formData, setFormData] = useState<FarewellMemoryInput>(EMPTY_FORM);
  const [customTagMode, setCustomTagMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // ফুলস্ক্রিন প্রিভিউ লাইটবক্স
  const [previewMemory, setPreviewMemory] = useState<FarewellMemory | null>(null);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<FarewellMemory | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ইউনিক ব্যাচ ট্যাগ তালিকা (ক্লাসরুম মোমেন্টস ফিল্টার আউট করে)
  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>(DEFAULT_BATCH_TAGS);
    memories.forEach((m) => {
      if (m.batch_tag && !m.batch_tag.includes("ক্লাসরুম মোমেন্টস")) {
        tags.add(m.batch_tag);
      }
    });
    return Array.from(tags);
  }, [memories]);

  // ফিল্টার করা মেমোরিজ তালিকা
  const filteredMemories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return memories.filter((m) => {
      const isNotClassroom = !m.batch_tag || !m.batch_tag.includes("ক্লাসরুম মোমেন্টস");
      const matchSearch =
        !q ||
        m.caption.toLowerCase().includes(q) ||
        m.batch_tag.toLowerCase().includes(q);

      const matchTag = tagFilter === "all" || m.batch_tag === tagFilter;

      return isNotClassroom && matchSearch && matchTag;
    });
  }, [memories, search, tagFilter]);

  function openAddModal() {
    setEditingMemory(null);
    setCustomTagMode(false);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(memory: FarewellMemory) {
    setEditingMemory(memory);
    const inDefault = DEFAULT_BATCH_TAGS.includes(memory.batch_tag);
    setCustomTagMode(!inDefault);
    setFormData({
      batch_tag: memory.batch_tag,
      caption: memory.caption,
      image_url: memory.image_url,
      sort_order: memory.sort_order,
    });
    setModalOpen(true);
  }

  function handleLoadExample() {
    setFormData(EXAMPLE_MEMORY_TEMPLATE);
    setCustomTagMode(false);
    showToast("উদাহরণ মেমোরি লিংক ও রেফারেন্স লোড হয়েছে ✓", "info");
  }

  function handleTagSelectChange(val: string) {
    if (val === "__custom__") {
      setCustomTagMode(true);
      setFormData((prev) => ({ ...prev, batch_tag: "" }));
    } else {
      setCustomTagMode(false);
      setFormData((prev) => ({ ...prev, batch_tag: val }));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      showToast("ছবির লিংক (Cloudinary/Image URL) দিন।", "error");
      return;
    }
    if (!formData.caption.trim()) {
      showToast("ছবির চেনার সুবিধার রেফারেন্স শিরোনাম দিন।", "error");
      return;
    }
    if (!formData.batch_tag.trim()) {
      showToast("বিদায় ব্যাচের ট্যাগ নির্বাচন করুন।", "error");
      return;
    }

    setSaving(true);
    if (editingMemory) {
      const res = await updateFarewellMemory(editingMemory.id, formData);
      setSaving(false);
      if (res.ok && res.memory) {
        setMemories((prev) => prev.map((m) => (m.id === editingMemory.id ? res.memory! : m)));
        showToast("স্মৃতি ছবি সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createFarewellMemory(formData);
      setSaving(false);
      if (res.ok && res.memory) {
        setMemories((prev) => [res.memory!, ...prev]);
        showToast("নতুন স্মৃতি ছবি যুক্ত হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "ছবি যুক্ত করা যায়নি।", "error");
      }
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteFarewellMemory(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setMemories((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      showToast("স্মৃতি ছবি মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="বিদায় সংবর্ধনা ও স্মৃতি অ্যালবাম"
        subtitle="মেইন ওয়েবসাইটের 'যে মুহূর্তগুলো আমাদের গর্বিত করে' সেকশনে প্রদর্শিত ব্যাচ স্মৃতি ছবি পরিচালনা করুন"
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন স্মৃতি যোগ করুন</span>
          </PrimaryButton>
        }
      />

      {/* 💡 ১৬:৯ ও ২-স্প্লিট লেআউট সাইজিং গাইডলাইন ব্যানার */}
      <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-sky-200 bg-sky-50/80 p-4 shadow-sh1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white text-base">
          🎓
        </span>
        <div className="font-body text-xs sm:text-[13px] text-sky-950 leading-relaxed">
          <p className="font-bold text-sky-900">বিদায় স্মৃতি গ্যালারি সাইজিং নিয়ম:</p>
          <p className="mt-0.5 text-sky-800/90">
            মেইন ওয়েবসাইটে প্রতি ৩টি স্মৃতি ছবি একটি গ্রুপ হিসেবে প্রদর্শিত হয়—গ্রুপের ১ম ছবিটি ওপরে <b>১৬:৯ (1200×675 px)</b> সাইজে এবং পরের ২টি ছবি নিচে সমান ভাগে স্প্লিট আকারে থাকে। ওয়েবসাইটে কোনো টেক্সট ক্যাপশন দেখাবে না, ক্যাপশনটি শুধু আপনার চেনার সুবিধার জন্য।
          </p>
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
              placeholder="রেফারেন্স শিরোনাম বা ব্যাচ দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[40px] w-full rounded-full border border-border-base/80 bg-surface-muted/60 pl-10 pr-9 font-body text-[13px] text-ink-800 placeholder:text-muted/70 outline-none focus:border-sky-600 focus:bg-white"
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

          {/* ব্যাচ ট্যাগ ফিল্টার */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="h-[38px] max-w-[240px] truncate rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল বিদায় স্মৃতি ({toBengaliDigits(filteredMemories.length)}টি)</option>
              {allUniqueTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🎯 স্মৃতি ফটো গ্রিড */}
      {filteredMemories.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো স্মৃতি ছবি পাওয়া যায়নি"
            hint="Cloudinary লিংক ব্যবহার করে বিদায় সংবর্ধনা বা ব্যাচ স্মৃতির ছবি যুক্ত করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMemories.map((memory, idx) => (
            <div
              key={memory.id}
              className="hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border border-border-base/90 bg-white p-3.5 shadow-sh1 transition-all duration-brand hover:shadow-sh2"
            >
              <div>
                {/* ইমেজ ফ্রেম */}
                <div
                  onClick={() => setPreviewMemory(memory)}
                  className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-surface-muted border border-border-base/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={memory.image_url}
                    alt={memory.caption}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-sky-950/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full bg-white/90 px-3 py-1 font-body text-[11px] font-extrabold text-sky-950 shadow-md">
                      👁️ বড় করে দেখুন
                    </span>
                  </div>

                  {/* স্লট পজিশন ইন্ডিকেটর */}
                  <span className="absolute top-2 left-2 rounded-md bg-sky-950/70 px-2 py-0.5 font-body text-[10px] font-bold text-white backdrop-blur-sm">
                    {idx % 3 === 0 ? "১৬:৯ প্রধান ছবি" : "সাব-স্প্লিট ছবি"}
                  </span>
                </div>

                {/* ব্যাচ ট্যাগ */}
                <div className="mt-2.5">
                  <span className="inline-block rounded-md bg-sky-100 px-2.5 py-0.5 font-body text-[10.5px] font-bold text-sky-900">
                    {memory.batch_tag}
                  </span>
                </div>

                {/* রেফারেন্স শিরোনাম */}
                <p className="mt-1.5 font-body text-[13px] font-bold leading-snug text-sky-950 line-clamp-2">
                  {memory.caption}
                </p>
              </div>

              {/* কার্ড ফুটার */}
              <div className="mt-3.5 flex items-center justify-between border-t border-border-base/60 pt-2.5">
                <span className="font-body text-[11px] font-medium text-muted">
                  {formatBengaliDate(memory.created_at.slice(0, 10))}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(memory)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                    title="সম্পাদনা"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(memory)}
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
          ))}
        </div>
      )}

      {/* নতুন মেমোরি / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMemory ? "স্মৃতি ছবি সম্পাদনা" : "নতুন বিদায় স্মৃতি ছবি যুক্ত করুন"}
        description="বিদায় ব্যাচ ট্যাগ, ১৬:৯ বা ল্যান্ডস্কেপ Cloudinary লিংক এবং চেনার রেফারেন্স নাম দিন।"
      >
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">নমুনা বিদায় স্মৃতি</p>
              <p className="font-body text-[10.5px] text-sky-800">ডেমো ট্যাগ ও ১৬:৯ ছবি লোড করুন</p>
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
          <Field label="বিদায় ব্যাচ ট্যাগ *" required>
            {!customTagMode ? (
              <Select
                value={formData.batch_tag}
                onChange={(e) => handleTagSelectChange(e.target.value)}
              >
                {allUniqueTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
                <option value="__custom__">✍️ নতুন ব্যাচ লিখুন (যেমন: HSC 2027 বিদায় উৎসব)...</option>
              </Select>
            ) : (
              <div className="flex gap-1.5">
                <TextInput
                  required
                  placeholder="যেমন: HSC 2027 বিদায় উৎসব"
                  value={formData.batch_tag}
                  onChange={(e) => setFormData({ ...formData, batch_tag: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setCustomTagMode(false)}
                  className="shrink-0 rounded-xl border border-border-base px-2.5 text-xs font-bold text-muted hover:bg-surface-muted"
                  title="ড্রপডাউনে ফিরে যান"
                >
                  ↩
                </button>
              </div>
            )}
          </Field>

          <Field label="ছবির লিংক (Cloudinary / Image URL) *" required>
            <TextInput
              type="url"
              required
              placeholder="https://res.cloudinary.com/... বা ইমেজ লিংক"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </Field>

          {/* 🖼️ লাইভ ১৬:৯ ইমেজ প্রিভিউয়ার */}
          {formData.image_url && (
            <div className="overflow-hidden rounded-xl border border-border-base bg-surface-muted/50 p-2 text-center">
              <p className="mb-1 text-[11px] font-bold text-muted">লাইভ ফ্রেম প্রিভিউ:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.image_url}
                alt="Preview"
                className="mx-auto max-h-40 rounded-lg aspect-video object-cover shadow-2xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <Field label="ছবির অভ্যন্তরীণ রেফারেন্স নাম *" required>
            <TextInput
              required
              placeholder="যেমন: HSC 2025 বিদায়ের ক্ষণে স্মৃতির উপহার"
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
            />
            <span className="mt-1 block font-body text-[10.5px] text-muted">
              (এই নামটি শুধুমাত্র অ্যাডমিন প্যানেলে আপনার চেনার জন্য থাকবে, ওয়েবসাইটে কোনো ক্যাপশন টেক্সট দেখাবে না।)
            </span>
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingMemory ? "হালনাগাদ করুন" : "✓ স্মৃতি যোগ করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 👁️ ফুলস্ক্রিন প্রিভিউ মোডাল (লাইটবক্স) */}
      <Modal
        open={!!previewMemory}
        onClose={() => setPreviewMemory(null)}
        title={previewMemory?.batch_tag || "স্মৃতি প্রিভিউ"}
        maxWidth="max-w-2xl"
      >
        {previewMemory && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewMemory.image_url}
              alt={previewMemory.caption}
              className="w-full max-h-[460px] rounded-2xl aspect-video object-cover border border-border-base shadow-sm"
            />
            <div className="flex items-center justify-between gap-2 border-t border-border-base/50 pt-2.5">
              <span className="font-body text-[13.5px] font-bold text-sky-950">
                রেফারেন্স: {previewMemory.caption}
              </span>
              <Badge tone="info">{previewMemory.batch_tag}</Badge>
            </div>
            <div className="flex justify-end border-t border-border-base/60 pt-3">
              <SecondaryButton type="button" onClick={() => setPreviewMemory(null)}>
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
        title="স্মৃতি ছবি মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে এই স্মৃতি ছবিটি মুছে ফেলতে চান?
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
