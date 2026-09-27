"use client";

import { useMemo, useState, useRef } from "react";
import type { FarewellMemory } from "@/lib/types";
import {
  createFarewellMemory,
  updateFarewellMemory,
  deleteFarewellMemory,
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

interface FormState {
  batch_tag: string;
  image_url: string;
  slot_type: SlotType;
  focal_x: number; // 0 to 100 (%)
  focal_y: number; // 0 to 100 (%)
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  batch_tag: "HSC 2025 বিদায় সংবর্ধনা",
  image_url: "",
  slot_type: "hero_16_9",
  focal_x: 50,
  focal_y: 50,
  sort_order: 0,
};

// ডাটাবেজের caption ফিল্ডে সংরক্ষিত কাস্টম X/Y কোঅর্ডিনেট পার্স করা
function parseFocalCoords(str?: string): { x: number; y: number } {
  if (!str) return { x: 50, y: 50 };
  const match = str.match(/(\d+)%\s+(\d+)%/);
  if (match) {
    return { x: Number(match[1]), y: Number(match[2]) };
  }
  return { x: 50, y: 50 };
}

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

  // ইন্টারঅ্যাক্টিভ পিনপয়েন্ট রেফারেন্স
  const pinAreaRef = useRef<HTMLDivElement>(null);

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
    const coords = parseFocalCoords(memory.caption);
    setFormData({
      batch_tag: memory.batch_tag,
      image_url: memory.image_url,
      slot_type: memory.sort_order === 0 ? "hero_16_9" : "sub_9_16",
      focal_x: coords.x,
      focal_y: coords.y,
      sort_order: memory.sort_order,
    });
    setModalOpen(true);
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

  // 🎯 ছবির ওপর যেকোনো স্থানে ক্লিক করে টার্গেট ফোকাস সেট করা
  const handlePinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinAreaRef.current) return;
    const rect = pinAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setFormData((prev) => ({ ...prev, focal_x: x, focal_y: y }));
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      showToast("ছবির সঠিক লিংক (Cloudinary / Image URL) দিন।", "error");
      return;
    }
    if (!formData.batch_tag.trim()) {
      showToast("বিদায় ব্যাচের ট্যাগ নির্বাচন করুন।", "error");
      return;
    }

    setSaving(true);
    // কাস্টম X ও Y কোঅর্ডিনেট ডাটাবেজে সংরক্ষণ করা
    const customFocalCoord = `${formData.focal_x}% ${formData.focal_y}%`;

    const payload = {
      batch_tag: formData.batch_tag.trim(),
      image_url: formData.image_url.trim(),
      slot_type: formData.slot_type,
      sort_order: formData.slot_type === "hero_16_9" ? 0 : 1,
      caption: customFocalCoord,
    };

    if (editingMemory) {
      const res = await updateFarewellMemory(editingMemory.id, payload);
      setSaving(false);
      if (res.ok && res.memory) {
        setMemories((prev) => prev.map((m) => (m.id === editingMemory.id ? res.memory! : m)));
        showToast("স্মৃতি ছবি ও কাস্টম ফোকাস পজিশন আপডেট হয়েছে ✓", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createFarewellMemory(payload);
      setSaving(false);
      if (res.ok && res.memory) {
        setMemories((prev) => [res.memory!, ...prev]);
        showToast("নতুন স্মৃতি ছবি সফলভাবে যুক্ত হয়েছে!", "success");
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
        subtitle="১৬:৯ প্রধান ছবি ও ৯:১৬ সাব-ছবি এবং কাস্টম ফোকাল পয়েন্ট ক্রপার"
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

      {/* 💡 সাইজিং ও ফ্রি-ফর্ম ফোকাস নির্দেশিকা */}
      <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-sky-200 bg-sky-50/80 p-4 shadow-sh1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white text-base">
          🎯
        </span>
        <div className="font-body text-xs sm:text-[13px] text-sky-950 leading-relaxed">
          <p className="font-bold text-sky-900">ফ্রি-ফর্ম ফোকাস পজিশনিং সুবিধা:</p>
          <p className="mt-0.5 text-sky-800/90">
            ছবি যুক্ত করার সময় মূল ছবির ওপর <b>যেকোনো স্থানে ক্লিক করে টার্গেট পিন (🎯)</b> বসিয়ে দিন। সিস্টেম স্বয়ংক্রিয়ভাবে সেই নির্দিষ্ট অংশটি কেন্দ্রে রেখে ওয়েবসাইটে পারফেক্টলি ক্রপ করে দেখাবে (কোনো বন্ধুদের মুখ কাটা যাবে না)।
          </p>
        </div>
      </div>

      {/* ফিল্টার ও কাউন্টার বার */}
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

      {/* 🎯 স্মৃতি ফটো গ্রিড (কাস্টম ফোকাস পজিশন সহ লাইভ প্রিভিউ) */}
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
            const focalStyle = memory.caption || "50% 50%";

            return (
              <div
                key={memory.id}
                className="hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border border-border-base/90 bg-white p-3 shadow-sh1 transition-all duration-brand hover:shadow-sh2"
              >
                <div>
                  {/* ইমেজ ফ্রেম */}
                  <div
                    onClick={() => setPreviewMemory(memory)}
                    className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 border border-border-base/60 ${
                      isHero ? "aspect-video" : "aspect-[16/10]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={memory.image_url}
                      alt="Memory Shot"
                      style={{ objectPosition: focalStyle }}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80";
                      }}
                    />

                    {/* স্লট ব্যাজ */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`rounded-md px-2.5 py-1 font-body text-[10.5px] font-black text-white shadow-md backdrop-blur-md ${
                        isHero ? "bg-sky-600/90" : "bg-slate-800/80"
                      }`}>
                        {isHero ? "১৬:৯ প্রধান ছবি" : "৯:১৬ সাব-ছবি"}
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
                      title="ফোকাস পজিশন ও স্লট পরিবর্তন করুন"
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

      {/* নতুন মেমোরি / এডিট মোডাল (ইন্টারেক্টিভ ২D ক্লিক-টু-পিন ক্রপার সহ) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMemory ? "স্মৃতি ছবির ফোকাস পজিশন ও স্লট নির্ধারণ" : "নতুন বিদায় স্মৃতি ছবি যুক্ত করুন"}
        description="বিদায় ব্যাচ ট্যাগ দিন, লিংক পেস্ট করুন এবং ছবির যেকোনো পয়েন্টে ক্লিক করে ফোকাস পিন (🎯) বসিয়ে দিন।"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
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

          {/* স্লট নির্বাচন */}
          <div>
            <label className="mb-1.5 block font-body text-[12px] font-bold text-ink-800">
              গ্যালারি স্লটের ধরন *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 font-body text-xs font-bold transition-all ${
                formData.slot_type === "hero_16_9"
                  ? "border-sky-500 bg-sky-50 text-sky-950 shadow-2xs"
                  : "border-border-base bg-white text-slate-700 hover:bg-surface-muted"
              }`}>
                <input
                  type="radio"
                  name="slot_choice_mem"
                  value="hero_16_9"
                  checked={formData.slot_type === "hero_16_9"}
                  onChange={() => setFormData({ ...formData, slot_type: "hero_16_9", sort_order: 0 })}
                  className="h-4 w-4 text-sky-600"
                />
                <span>🖼️ ১৬:৯ প্রধান ছবি (ওপরে)</span>
              </label>

              <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 font-body text-xs font-bold transition-all ${
                formData.slot_type === "sub_9_16"
                  ? "border-sky-500 bg-sky-50 text-sky-950 shadow-2xs"
                  : "border-border-base bg-white text-slate-700 hover:bg-surface-muted"
              }`}>
                <input
                  type="radio"
                  name="slot_choice_mem"
                  value="sub_9_16"
                  checked={formData.slot_type === "sub_9_16"}
                  onChange={() => setFormData({ ...formData, slot_type: "sub_9_16", sort_order: 1 })}
                  className="h-4 w-4 text-sky-600"
                />
                <span>📱 ৯:১৬ সাব-ছবি (নিচে)</span>
              </label>
            </div>
          </div>

          {/* 🎯 ১. ইন্টারেক্টিভ ২D ক্লিক-টু-পিন ফোকাল পয়েন্ট এরিয়া */}
          {formData.image_url && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-body text-xs font-black text-sky-950">
                  🎯 ছবির যেকোনো জায়গায় ক্লিক করে ফোকাস পিন (🎯) বসান:
                </span>
                <span className="font-mono text-[11px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200">
                  X: {formData.focal_x}%, Y: {formData.focal_y}%
                </span>
              </div>

              {/* ক্লিক-টু-পিন ক্যানভাস */}
              <div
                ref={pinAreaRef}
                onClick={handlePinClick}
                className="relative mx-auto max-h-56 w-full cursor-crosshair overflow-hidden rounded-xl border-2 border-dashed border-sky-400 bg-slate-900 select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.image_url}
                  alt="Pin Canvas"
                  className="mx-auto max-h-56 w-full object-contain pointer-events-none"
                />

                {/* ইন্টারেক্টিভ টার্গেট পিন */}
                <div
                  style={{ left: `${formData.focal_x}%`, top: `${formData.focal_y}%` }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow-xl ring-4 ring-white/90 animate-pulse text-xs font-black">
                    🎯
                  </span>
                </div>
              </div>

              {/* সূক্ষ্ম X ও Y স্লাইডার */}
              <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-sky-200/60 text-xs font-bold text-slate-700">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>অনুভূমিক (X):</span>
                    <span>{formData.focal_x}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.focal_x}
                    onChange={(e) => setFormData({ ...formData, focal_x: Number(e.target.value) })}
                    className="w-full accent-sky-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>উল্লম্ব (Y):</span>
                    <span>{formData.focal_y}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.focal_y}
                    onChange={(e) => setFormData({ ...formData, focal_y: Number(e.target.value) })}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 🖼️ ২. লাইভ ক্রপ প্রিভিউয়ার */}
          {formData.image_url && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-xs">
              <p className="mb-2 font-body text-[11.5px] font-bold text-slate-800">
                ওয়েবসাইটে ঠিক যেমন ক্রপ হয়ে দেখাবে ({formData.slot_type === "hero_16_9" ? "১৬:৯ ফ্রেম" : "৯:১৬ ফ্রেম"}):
              </p>
              <div
                className={`mx-auto overflow-hidden rounded-xl border border-sky-300 bg-black ${
                  formData.slot_type === "hero_16_9" ? "aspect-video max-w-sm" : "aspect-[16/10] max-w-xs"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.image_url}
                  alt="Live Crop Result"
                  style={{ objectPosition: `${formData.focal_x}% ${formData.focal_y}%` }}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingMemory ? "ফোকাস আপডেট করুন" : "✓ স্মৃতি যোগ করুন"}
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
              style={{ objectPosition: previewMemory.caption || "50% 50%" }}
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
