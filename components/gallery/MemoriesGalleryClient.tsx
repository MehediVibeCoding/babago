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

type SlotType = "hero_16_9" | "sub_9_16";
type FocalPosition = "top" | "center" | "bottom";

interface FormState {
  batch_tag: string;
  image_url: string;
  slot_type: SlotType;
  focal_position: FocalPosition;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  batch_tag: "HSC 2025 বিদায় সংবর্ধনা",
  image_url: "",
  slot_type: "hero_16_9",
  focal_position: "center",
  sort_order: 0,
};

// 🎯 উদাহরণ টেমপ্লেট
const EXAMPLE_MEMORY_TEMPLATE: FormState = {
  batch_tag: "HSC 2025 বিদায় সংবর্ধনা",
  image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  slot_type: "hero_16_9",
  focal_position: "top",
  sort_order: 0,
};

export default function MemoriesGalleryClient({
  initialMemories,
}: {
  initialMemories: FarewellMemory[];
}) {
  const { show: showToast } = useToast();

  const [memories, setMemories] = useState<FarewellMemory[]>(initialMemories);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [slotFilter, setSlotFilter] = useState<string>("all");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<FarewellMemory | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [customTagMode, setCustomTagMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // ফুলস্ক্রিন প্রিভিউ লাইটবক্স
  const [previewMemory, setPreviewMemory] = useState<FarewellMemory | null>(null);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<FarewellMemory | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ইউনিক ব্যাচ ট্যাগ তালিকা (ক্লাসরুম মোমেন্টস বাদ)
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
    return memories.filter((m) => {
      const isNotClassroom = !m.batch_tag || !m.batch_tag.includes("ক্লাসরুম মোমেন্টস");
      const matchTag = tagFilter === "all" || m.batch_tag === tagFilter;
      const matchSlot =
        slotFilter === "all" ||
        (slotFilter === "hero" && m.sort_order === 0) ||
        (slotFilter === "sub" && m.sort_order !== 0);

      return isNotClassroom && matchTag && matchSlot;
    });
  }, [memories, tagFilter, slotFilter]);

  function openAddModal(defaultSlot: SlotType = "hero_16_9") {
    setEditingMemory(null);
    setCustomTagMode(false);
    setFormData({
      ...EMPTY_FORM,
      slot_type: defaultSlot,
      sort_order: defaultSlot === "hero_16_9" ? 0 : 1,
    });
    setModalOpen(true);
  }

  function openEditModal(memory: FarewellMemory) {
    setEditingMemory(memory);
    const inDefault = DEFAULT_BATCH_TAGS.includes(memory.batch_tag);
    setCustomTagMode(!inDefault);
    setFormData({
      batch_tag: memory.batch_tag,
      image_url: memory.image_url,
      slot_type: memory.sort_order === 0 ? "hero_16_9" : "sub_9_16",
      focal_position: "center",
      sort_order: memory.sort_order,
    });
    setModalOpen(true);
  }

  function handleLoadExample() {
    setFormData(EXAMPLE_MEMORY_TEMPLATE);
    setCustomTagMode(false);
    showToast("উদাহরণ মেমোরি লিংক ও ১৬:৯ ফ্রেম লোড হয়েছে ✓", "info");
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
      showToast("ছবির লিংক (Cloudinary / Image URL) দিন।", "error");
      return;
    }
    if (!formData.batch_tag.trim()) {
      showToast("বিদায় ব্যাচের ট্যাগ নির্বাচন করুন।", "error");
      return;
    }

    setSaving(true);
    const payload: FarewellMemoryInput = {
      batch_tag: formData.batch_tag.trim(),
      image_url: formData.image_url.trim(),
      slot_type: formData.slot_type,
      focal_position: formData.focal_position,
      sort_order: formData.slot_type === "hero_16_9" ? 0 : 1,
    };

    if (editingMemory) {
      const res = await updateFarewellMemory(editingMemory.id, payload);
      setSaving(false);
      if (res.ok && res.memory) {
        setMemories((prev) => prev.map((m) => (m.id === editingMemory.id ? res.memory! : m)));
        showToast("স্মৃতি ছবি সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createFarewellMemory(payload);
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
        subtitle="মেইন ওয়েবসাইটের ১৬:৯ প্রধান ছবি ও নিচে ৯:১৬ সাব-স্প্লিট ছবি পরিচালনা করুন"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openAddModal("hero_16_9")}
              className="flex items-center gap-1.5 rounded-full bg-sky-950 px-4 py-2.5 font-body text-xs font-bold text-white shadow-xs hover:bg-sky-900 active:scale-95"
            >
              <span>🖼️</span>
              <span>+ ১৬:৯ প্রধান স্মৃতি</span>
            </button>

            <PrimaryButton onClick={() => openAddModal("sub_9_16")}>
              <span>📱 + ৯:১৬ সাব-স্মৃতি</span>
            </PrimaryButton>
          </div>
        }
      />

      {/* 💡 সাইজিং ও স্লট গাইডলাইন ব্যানার */}
      <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-sky-200 bg-sky-50/80 p-4 shadow-sh1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white text-base">
          🎓
        </span>
        <div className="font-body text-xs sm:text-[13px] text-sky-950 leading-relaxed">
          <p className="font-bold text-sky-900">বিদায় স্মৃতি গ্যালারি স্লট ও ক্রপ গাইডলাইন:</p>
          <p className="mt-0.5 text-sky-800/90">
            মেইন ওয়েবসাইটে প্রতি ৩টি স্মৃতি ছবি একটি গ্রুপ: ওপরে থাকে <b>১৬:৯ প্রধান ছবি</b> এবং নিচে পাশাপাশি থাকে <b>২টি ৯:১৬ সাব-ছবি</b>। ছবি যুক্ত করার সময় নিচে বা ওপরে কোনো মুখ বা মাথা থাকলে <b>ফোকাস পজিশন</b> সিলেক্ট করে দিলে ছবি কখনোই ভুলভাবে কাটবে না। (কোনো ক্যাপশন দেওয়ার প্রয়োজন নেই)।
          </p>
        </div>
      </div>

      {/* ফিল্টার ও সার্চ বার */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between overflow-hidden rounded-[22px] border border-border-base/80 bg-white p-4 shadow-sh1 backdrop-blur-xl">
        <div className="flex items-center gap-2 font-body text-[13.5px] font-bold text-sky-950">
          <span>মোট স্মৃতি ছবি:</span>
          <span className="rounded-lg bg-sky-100 px-2.5 py-0.5 font-black text-sky-800">
            {toBengaliDigits(memories.length)}টি
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ব্যাচ ট্যাগ ফিল্টার */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="h-[38px] max-w-[220px] truncate rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-bold text-ink-800 outline-none focus:border-sky-600"
          >
            <option value="all">সকল বিদায় ব্যাচ</option>
            {allUniqueTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          {/* স্লট ফিল্টার */}
          <select
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
            className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-bold text-ink-800 outline-none focus:border-sky-600"
          >
            <option value="all">সকল স্লট</option>
            <option value="hero">🖼️ শুধু ১৬:৯ প্রধান ছবি</option>
            <option value="sub">📱 শুধু ৯:১৬ সাব-ছবি</option>
          </select>
        </div>
      </div>

      {/* 🎯 স্মৃতি ফটো গ্রিড (সম্পূর্ণ ক্যাপশন-মুক্ত ও স্লট ইন্ডিকেটর সহ) */}
      {filteredMemories.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো স্মৃতি ছবি পাওয়া যায়নি"
            hint="১৬:৯ প্রধান ছবি বা ৯:১৬ সাব-ছবি হিসেবে নতুন স্মৃতি যুক্ত করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMemories.map((memory) => {
            const isHero = memory.sort_order === 0;

            return (
              <div
                key={memory.id}
                className="hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border border-border-base/90 bg-white p-3 shadow-sh1 transition-all duration-brand hover:shadow-sh2"
              >
                <div>
                  {/* ইমেজ ফ্রেম */}
                  <div
                    onClick={() => setPreviewMemory(memory)}
                    className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-100 border border-border-base/60 ${
                      isHero ? "aspect-video" : "aspect-[16/10]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={memory.image_url}
                      alt="Memory Shot"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80";
                      }}
                    />

                    {/* স্লট ব্যাজ ওভারলে */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`rounded-md px-2.5 py-1 font-body text-[10.5px] font-black text-white shadow-md backdrop-blur-md ${
                        isHero ? "bg-sky-600/90" : "bg-slate-800/80"
                      }`}>
                        {isHero ? "১৬:৯ প্রধান হিরো স্লট" : "৯:১৬ সাব-স্প্লিট স্লট"}
                      </span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center bg-sky-950/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-full bg-white/90 px-3 py-1 font-body text-[11px] font-extrabold text-sky-950 shadow-md">
                        👁️ বড় করে দেখুন
                      </span>
                    </div>
                  </div>

                  {/* ব্যাচ ট্যাগ */}
                  <div className="mt-2.5">
                    <span className="inline-block rounded-md bg-sky-100 px-2.5 py-0.5 font-body text-[11px] font-bold text-sky-900">
                      {memory.batch_tag}
                    </span>
                  </div>
                </div>

                {/* কার্ড ফুটার */}
                <div className="mt-3 flex items-center justify-between border-t border-border-base/60 pt-2">
                  <span className="font-body text-[10.5px] font-medium text-muted">
                    {formatBengaliDate(memory.created_at.slice(0, 10))}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(memory)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                      title="সম্পাদনা"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(memory)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 text-danger transition-colors hover:bg-rose-100"
                      title="মুছে ফেলুন"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* নতুন মেমোরি / এডিট মোডাল (সম্পূর্ণ ক্যাপশন-মুক্ত ও লাইভ ক্রপার সহ) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMemory ? "স্মৃতি ছবির স্লট ও ফোকাস সম্পাদনা" : "নতুন বিদায় স্মৃতি ছবি যুক্ত করুন"}
        description="বিদায় ব্যাচ ট্যাগ, ছবির লিংক ও সেটির ক্রপ ফোকাস পজিশন নির্ধারণ করুন।"
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
            className="rounded-lg bg-white px-3 py-1.5 font-body text-[11.5px] font-extrabold text-sky-700 shadow-xs hover:bg-sky-600 hover:text-white transition-colors"
          >
            📝 উদাহরণ লোড করুন
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* ব্যাচ ট্যাগ */}
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

          {/* ছবির লিংক */}
          <Field label="ছবির লিংক (Cloudinary / Image URL) *" required>
            <TextInput
              type="url"
              required
              placeholder="https://res.cloudinary.com/... বা ইমেজ লিংক পেস্ট করুন"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </Field>

          {/* স্লট ও ক্রপ নির্বাচন */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-body text-[12px] font-bold text-ink-800">
                গ্যালারি স্লটের ধরন *
              </label>
              <div className="flex flex-col gap-2 pt-0.5">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-base bg-white p-2.5 font-body text-xs font-bold text-sky-950 hover:bg-sky-50">
                  <input
                    type="radio"
                    name="slot_choice_mem"
                    value="hero_16_9"
                    checked={formData.slot_type === "hero_16_9"}
                    onChange={() => setFormData({ ...formData, slot_type: "hero_16_9", sort_order: 0 })}
                    className="h-4 w-4 text-sky-600"
                  />
                  <span>🖼️ ১৬:৯ প্রধান স্মৃতি ছবি (ওপরে)</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-base bg-white p-2.5 font-body text-xs font-bold text-sky-950 hover:bg-sky-50">
                  <input
                    type="radio"
                    name="slot_choice_mem"
                    value="sub_9_16"
                    checked={formData.slot_type === "sub_9_16"}
                    onChange={() => setFormData({ ...formData, slot_type: "sub_9_16", sort_order: 1 })}
                    className="h-4 w-4 text-sky-600"
                  />
                  <span>📱 ৯:১৬ সাব-ছবি (নিচে স্প্লিট)</span>
                </label>
              </div>
            </div>

            {/* ক্রপিং ফোকাস পজিশন */}
            <div>
              <label className="mb-1.5 block font-body text-[12px] font-bold text-ink-800">
                ক্রপ ফোকাস পজিশন (মাথা/মুখ কাটা রোধে)
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: "top", label: "🎯 উপরে / মুখ ফোকাস (Top)" },
                  { value: "center", label: "🎯 কেন্দ্র ফোকাস (Center)" },
                  { value: "bottom", label: "🎯 নিচে ফোকাস (Bottom)" },
                ].map((f) => (
                  <label
                    key={f.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 font-body text-xs font-semibold transition-all ${
                      formData.focal_position === f.value
                        ? "border-sky-400 bg-sky-50 text-sky-900 font-bold"
                        : "border-border-base bg-white text-slate-700 hover:bg-surface-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="focal_choice_mem"
                      value={f.value}
                      checked={formData.focal_position === f.value}
                      onChange={() => setFormData({ ...formData, focal_position: f.value as FocalPosition })}
                      className="h-3.5 w-3.5 text-sky-600"
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 🖼️ লাইভ ফ্রেম প্রিভিউয়ার */}
          {formData.image_url && (
            <div className="overflow-hidden rounded-2xl border border-sky-200 bg-slate-50 p-3 text-center">
              <p className="mb-2 font-body text-[11.5px] font-bold text-sky-900">
                লাইভ ক্রপ প্রিভিউ ({formData.slot_type === "hero_16_9" ? "১৬:৯ প্রধান ফ্রেম" : "৯:১৬ সাব-ফ্রেম"} · ফোকাস: {formData.focal_position}):
              </p>
              <div
                className={`mx-auto overflow-hidden rounded-xl border border-sky-300 shadow-inner bg-black ${
                  formData.slot_type === "hero_16_9" ? "aspect-video max-w-sm" : "aspect-[16/10] max-w-xs"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.image_url}
                  alt="Live Crop Preview"
                  className={`h-full w-full object-cover ${
                    formData.focal_position === "top"
                      ? "object-top"
                      : formData.focal_position === "bottom"
                      ? "object-bottom"
                      : "object-center"
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

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

      {/* 👁️ ফুলস্ক্রিন প্রিভিউ মোডাল */}
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
              alt="Farewell Memory View"
              className="w-full max-h-[460px] rounded-2xl aspect-video object-cover border border-border-base shadow-sm"
            />
            <div className="flex items-center justify-between gap-2 border-t border-border-base/50 pt-2.5">
              <Badge tone="info">{previewMemory.batch_tag}</Badge>
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
