"use client";

import { useMemo, useState } from "react";
import type { SuccessTopper } from "@/lib/types";
import {
  createSuccessTopper,
  updateSuccessTopper,
  deleteSuccessTopper,
  type SuccessTopperInput,
} from "@/app/actions/toppers";
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
import { toBengaliDigits } from "@/lib/bengaliNumerals";

const BATCH_OPTIONS = ["HSC 2025", "HSC 2024", "HSC 2026", "HSC 2027", "HSC 2028"];

const EMPTY_FORM: SuccessTopperInput = {
  name: "",
  batch: "HSC 2025",
  result: "GPA 5.00",
  subject: "English A+, ICT A+",
  college: "চৌদ্দগ্রাম সরকারি কলেজ",
  photo_url: "",
  sort_order: 0,
};

// 🎯 উদাহরণ টেমপ্লেট
const EXAMPLE_TOPPER_TEMPLATE: SuccessTopperInput = {
  name: "সাদিয়া তাসনিম",
  batch: "HSC 2025",
  result: "GPA 5.00",
  subject: "English A+, ICT A+",
  college: "চৌদ্দগ্রাম সরকারি কলেজ",
  photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  sort_order: 1,
};

export default function ToppersPageClient({
  initialToppers,
}: {
  initialToppers: SuccessTopper[];
}) {
  const { show: showToast } = useToast();

  const [toppers, setToppers] = useState<SuccessTopper[]>(initialToppers);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("all");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopper, setEditingTopper] = useState<SuccessTopper | null>(null);
  const [formData, setFormData] = useState<SuccessTopperInput>(EMPTY_FORM);
  const [customBatchMode, setCustomBatchMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<SuccessTopper | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ইউনিক ব্যাচ তালিকা
  const uniqueBatches = useMemo(() => {
    const batches = new Set<string>(BATCH_OPTIONS);
    toppers.forEach((t) => {
      if (t.batch) batches.add(t.batch);
    });
    return Array.from(batches);
  }, [toppers]);

  // ফিল্টার করা কৃতি শিক্ষার্থী তালিকা
  const filteredToppers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return toppers.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.college.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.result.toLowerCase().includes(q) ||
        t.batch.toLowerCase().includes(q);

      const matchBatch = batchFilter === "all" || t.batch === batchFilter;

      return matchSearch && matchBatch;
    });
  }, [toppers, search, batchFilter]);

  // পরিসংখ্যান
  const stats = useMemo(() => {
    const total = toppers.length;
    const gpa5Count = toppers.filter((t) => t.result.includes("5.00") || t.result.includes("৫.০০")).length;
    const batchCount = uniqueBatches.length;
    return { total, gpa5Count, batchCount };
  }, [toppers, uniqueBatches]);

  function openAddModal() {
    setEditingTopper(null);
    setCustomBatchMode(false);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(topper: SuccessTopper) {
    setEditingTopper(topper);
    const inDefault = BATCH_OPTIONS.includes(topper.batch);
    setCustomBatchMode(!inDefault);
    setFormData({
      name: topper.name,
      batch: topper.batch,
      result: topper.result,
      subject: topper.subject,
      college: topper.college,
      photo_url: topper.photo_url || "",
      sort_order: topper.sort_order,
    });
    setModalOpen(true);
  }

  function handleLoadExample() {
    setFormData(EXAMPLE_TOPPER_TEMPLATE);
    setCustomBatchMode(false);
    showToast("উদাহরণ কৃতি শিক্ষার্থীর তথ্য লোড হয়েছে ✓", "info");
  }

  function handleBatchSelectChange(val: string) {
    if (val === "__custom__") {
      setCustomBatchMode(true);
      setFormData((prev) => ({ ...prev, batch: "" }));
    } else {
      setCustomBatchMode(false);
      setFormData((prev) => ({ ...prev, batch: val }));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("শিক্ষার্থীর নাম দিন।", "error");
      return;
    }
    if (!formData.batch.trim()) {
      showToast("ব্যাচ বা বছর দিন।", "error");
      return;
    }
    if (!formData.result.trim()) {
      showToast("প্রাপ্ত রেজাল্ট দিন (যেমন: GPA 5.00)।", "error");
      return;
    }

    setSaving(true);
    if (editingTopper) {
      const res = await updateSuccessTopper(editingTopper.id, formData);
      setSaving(false);
      if (res.ok && res.topper) {
        setToppers((prev) => prev.map((t) => (t.id === editingTopper.id ? res.topper! : t)));
        showToast("কৃতি শিক্ষার্থীর তথ্য সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createSuccessTopper(formData);
      setSaving(false);
      if (res.ok && res.topper) {
        setToppers((prev) => [res.topper!, ...prev]);
        showToast("নতুন কৃতি শিক্ষার্থী সফলভাবে যুক্ত হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "সংরক্ষণ করা যায়নি।", "error");
      }
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteSuccessTopper(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setToppers((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast("কৃতি শিক্ষার্থী মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="কৃতি শিক্ষার্থীদের দেয়াল (রেজাল্ট বোর্ড)"
        subtitle="মেইন ওয়েবসাইটের 'সাফল্যের গল্প' সেকশনে প্রদর্শিত কৃতি শিক্ষার্থীদের ফলাফল ও ছবি পরিচালনা করুন"
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন কৃতি শিক্ষার্থী যোগ করুন</span>
          </PrimaryButton>
        }
      />

      {/* ওভারভিউ কার্ডস */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EBF5FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-700">মোট কৃতি শিক্ষার্থী</p>
          <p className="mt-1 font-body text-[20px] font-black text-sky-950 sm:text-[22px]">{toBengaliDigits(stats.total)} জন</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">সাফল্যের দেয়ালে প্রদর্শিত</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#ECFDF5] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-success">জিপিএ ৫.০০ প্রাপ্ত</p>
          <p className="mt-1 font-body text-[20px] font-black text-emerald-900 sm:text-[22px]">{toBengaliDigits(stats.gpa5Count)} জন</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">A+ ও সর্বোচ্চ ফলাফল</span>
        </div>

        <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-[#EEF2FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">ব্যাচ ও শিক্ষাবর্ষ</p>
          <p className="mt-1 font-body text-[20px] font-black text-indigo-950 sm:text-[22px]">{toBengaliDigits(stats.batchCount)}টি ব্যাচ</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">বিভিন্ন শিক্ষাবর্ষের ফলাফল</span>
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
              placeholder="নাম, কলেজ, রেজাল্ট অথবা বিষয় দিয়ে খুঁজুন..."
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

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="h-[38px] max-w-[190px] truncate rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল শিক্ষাবর্ষ / ব্যাচ</option>
              {uniqueBatches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🎯 কৃতি শিক্ষার্থী কার্ড গ্রিড */}
      {filteredToppers.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো কৃতি শিক্ষার্থী পাওয়া যায়নি"
            hint="কৃতি শিক্ষার্থীদের নাম ও ফলাফল যুক্ত করুন অথবা সার্চ পরিবর্তন করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredToppers.map((topper) => (
            <div
              key={topper.id}
              className="hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border border-border-base/90 bg-white p-5 text-center shadow-sh1 transition-all duration-brand hover:shadow-sh2"
            >
              <div className="flex flex-col items-center">
                {/* বৃত্তাকার ছবি ফ্রেম */}
                <div className="relative mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-sky-300 bg-sky-50 shadow-sm">
                  {topper.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={topper.photo_url}
                      alt={topper.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="font-display text-[22px] font-black text-sky-700">
                      {topper.name.slice(0, 1)}
                    </span>
                  )}
                </div>

                {/* নাম ও ব্যাচ */}
                <h3 className="font-body text-[15px] font-black tracking-tight text-sky-950">
                  {topper.name}
                </h3>
                <p className="font-body text-[11px] font-bold text-sky-700">
                  {topper.batch}
                </p>

                {/* রেজাল্ট ও বিষয়ভিত্তিক ব্যাজ */}
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 font-body text-[11px] font-black text-emerald-800 border border-emerald-200">
                    🏆 {topper.result}
                  </span>
                  <span className="rounded-lg bg-sky-50 px-2.5 py-0.5 font-body text-[11px] font-bold text-sky-800 border border-sky-200">
                    {topper.subject}
                  </span>
                </div>

                {/* কলেজ */}
                <p className="mt-3 w-full border-t border-border-base/60 pt-2.5 font-body text-[11px] font-semibold text-ink-800/80 truncate" title={topper.college}>
                  🏛️ {topper.college}
                </p>
              </div>

              {/* কার্ড ফুটার অ্যাকশন */}
              <div className="mt-3.5 flex items-center justify-center gap-2 border-t border-border-base/60 pt-2.5">
                <button
                  type="button"
                  onClick={() => openEditModal(topper)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                  title="সম্পাদনা"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(topper)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 text-danger transition-colors hover:bg-rose-100"
                  title="মুছে ফেলুন"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* নতুন কৃতি শিক্ষার্থী / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTopper ? "কৃতি শিক্ষার্থীর তথ্য সম্পাদনা" : "নতুন কৃতি শিক্ষার্থী যোগ করুন"}
        description="শিক্ষার্থীর নাম, ব্যাচ, জিপিএ, বিষয়ভিত্তিক ফলাফল, কলেজ ও ছবির লিংক দিন।"
      >
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">নমুনা রেজাল্ট ডাটা</p>
              <p className="font-body text-[10.5px] text-sky-800">উদাহরণ কৃতি শিক্ষার্থী লোড করুন</p>
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
          <Field label="শিক্ষার্থীর পূর্ণ নাম *" required>
            <TextInput
              required
              placeholder="যেমন: সাদিয়া তাসনিম"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="ব্যাচ / শিক্ষাবর্ষ *" required>
              {!customBatchMode ? (
                <Select
                  value={formData.batch}
                  onChange={(e) => handleBatchSelectChange(e.target.value)}
                >
                  {uniqueBatches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="__custom__">✍️ নতুন ব্যাচ লিখুন...</option>
                </Select>
              ) : (
                <div className="flex gap-1.5">
                  <TextInput
                    required
                    placeholder="যেমন: HSC 2025"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomBatchMode(false)}
                    className="shrink-0 rounded-xl border border-border-base px-2.5 text-xs font-bold text-muted hover:bg-surface-muted"
                    title="ড্রপডাউনে ফিরে যান"
                  >
                    ↩
                  </button>
                </div>
              )}
            </Field>

            <Field label="প্রাপ্ত রেজাল্ট *" required>
              <TextInput
                required
                placeholder="যেমন: GPA 5.00"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="বিষয়ভিত্তিক ফলাফল *" required>
              <TextInput
                required
                placeholder="যেমন: English A+, ICT A+"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Field>

            <Field label="কলেজের নাম *" required>
              <TextInput
                required
                placeholder="যেমন: চৌদ্দগ্রাম সরকারি কলেজ"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              />
            </Field>
          </div>

          <Field label="শিক্ষার্থীর ছবি লিংক (Cloudinary / Image URL)">
            <TextInput
              type="url"
              placeholder="https://images.unsplash.com/... বা ক্লাউডিনারি লিংক"
              value={formData.photo_url || ""}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
            />
          </Field>

          {/* 🖼️ লাইভ অ্যাভাটার প্রিভিউ */}
          {formData.photo_url && (
            <div className="flex items-center gap-3 rounded-xl border border-border-base bg-surface-muted/50 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.photo_url}
                alt="Avatar Preview"
                className="h-12 w-12 rounded-full object-cover border border-sky-300 shadow-2xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="font-body text-[11px] font-semibold text-muted">লাইভ ছবি প্রিভিউ</span>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingTopper ? "হালনাগাদ করুন" : "✓ কৃতি শিক্ষার্থী যুক্ত করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ডিলিট কনফার্মেশন মোডাল */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="কৃতি শিক্ষার্থী মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">{deleteTarget?.name}</b>-কে কৃতি শিক্ষার্থীদের দেয়াল থেকে মুছে ফেলতে চান?
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
