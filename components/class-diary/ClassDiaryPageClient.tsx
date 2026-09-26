"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { ClassDiaryEntry, Batch } from "@/lib/types";
import {
  createClassDiaryEntry,
  updateClassDiaryEntry,
  deleteClassDiaryEntry,
  type ClassDiaryInput,
} from "@/app/actions/class-diary";
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
  Select,
  EmptyState,
} from "@/components/admin/ui";
import { toBengaliDigits, formatBengaliDate, BENGALI_MONTHS } from "@/lib/bengaliNumerals";

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// মাসের ড্রপডাউন অপশন
function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -6; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${BENGALI_MONTHS[d.getMonth()]} ${toBengaliDigits(d.getFullYear())}`;
    options.push({ value, label });
  }
  return options;
}

const EMPTY_FORM: ClassDiaryInput = {
  entry_date: getTodayDateString(),
  batch_id: "",
  batch_name_snapshot: "",
  topic: "",
  note: "",
  slide_url: "",
};

// 🎯 উদাহরণ টেমপ্লেট — "উদাহরণ লোড করুন" বাটনে চাপলে এটি ফর্মে অটো-ফিল হবে
const EXAMPLE_DIARY_TEMPLATE: ClassDiaryInput = {
  entry_date: getTodayDateString(),
  batch_id: "",
  batch_name_snapshot: "HSC English (Batch 28)",
  topic: "Flow Chart লেখার নিয়ম ও ৫টি বোর্ড প্রশ্ন অনুশীলন",
  note: "১. ক্লাসে Flow Chart-এর ৫টি শর্টকাট রুল ও সংযোজক শব্দের ব্যবহার বোঝানো হয়েছে।\n২. লেকচার শিটের ৩ ও ৪ নং প্রশ্ন বাসায় হোমওয়ার্ক করতে হবে।\n৩. আগামী ক্লাসে ৫ নম্বরের কুইজ নেওয়া হবে।",
  slide_url: "https://drive.google.com/file/d/your-google-drive-link-here/view",
};

export default function ClassDiaryPageClient({
  initialEntries,
  batches,
}: {
  initialEntries: ClassDiaryEntry[];
  batches: Batch[];
}) {
  const searchParams = useSearchParams();
  const { show: showToast } = useToast();

  const [entries, setEntries] = useState<ClassDiaryEntry[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ClassDiaryEntry | null>(null);
  const [formData, setFormData] = useState<ClassDiaryInput>(EMPTY_FORM);
  const [customTagMode, setCustomTagMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<ClassDiaryEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      openAddModal();
    }
  }, [searchParams]);

  // অনন্য ব্যাচ/ট্যাগ তালিকা (ফিল্টারের জন্য)
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach((e) => {
      if (e.batch_name_snapshot) tags.add(e.batch_name_snapshot);
    });
    batches.forEach((b) => tags.add(b.name));
    return Array.from(tags);
  }, [entries, batches]);

  // ফিল্টার করা ডায়েরি তালিকা
  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      const matchSearch =
        !q ||
        e.topic.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q) ||
        (e.batch_name_snapshot && e.batch_name_snapshot.toLowerCase().includes(q));

      const matchTag = tagFilter === "all" || e.batch_name_snapshot === tagFilter;
      const matchMonth = monthFilter === "all" || e.entry_date.slice(0, 7) === monthFilter;

      return matchSearch && matchTag && matchMonth;
    });
  }, [entries, search, tagFilter, monthFilter]);

  // পরিসংখ্যান
  const stats = useMemo(() => {
    const total = entries.length;
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const thisMonth = entries.filter((e) => e.entry_date.slice(0, 7) === currentMonthKey).length;
    const withSlides = entries.filter((e) => !!e.slide_url).length;
    return { total, thisMonth, withSlides };
  }, [entries]);

  function openAddModal() {
    setEditingEntry(null);
    setCustomTagMode(false);
    setFormData({
      ...EMPTY_FORM,
      entry_date: getTodayDateString(),
      batch_id: batches[0]?.id || "",
      batch_name_snapshot: batches[0]?.name || "HSC English (Batch 28)",
    });
    setModalOpen(true);
  }

  function openEditModal(entry: ClassDiaryEntry) {
    setEditingEntry(entry);
    const matchExistingBatch = batches.some((b) => b.name === entry.batch_name_snapshot);
    setCustomTagMode(!matchExistingBatch);
    setFormData({
      entry_date: entry.entry_date,
      batch_id: entry.batch_id || "",
      batch_name_snapshot: entry.batch_name_snapshot || "",
      topic: entry.topic,
      note: entry.note || "",
      slide_url: entry.slide_url || "",
    });
    setModalOpen(true);
  }

  // 📝 স্মার্ট উদাহরণ টেমপ্লেট লোড করা
  function handleLoadExample() {
    setFormData({
      ...EXAMPLE_DIARY_TEMPLATE,
      entry_date: formData.entry_date || getTodayDateString(),
    });
    setCustomTagMode(false);
    showToast("উদাহরণ টেমপ্লেট ফর্মে লোড হয়েছে ✓", "info");
  }

  function handleBatchSelectChange(val: string) {
    if (val === "__custom__") {
      setCustomTagMode(true);
      setFormData((prev) => ({ ...prev, batch_id: null, batch_name_snapshot: "" }));
    } else {
      setCustomTagMode(false);
      const selected = batches.find((b) => b.id === val);
      setFormData((prev) => ({
        ...prev,
        batch_id: val,
        batch_name_snapshot: selected?.name || "",
      }));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.topic.trim()) {
      showToast("ক্লাসের মূল টপিক বা শিরোনাম দিন।", "error");
      return;
    }
    if (!formData.batch_name_snapshot.trim()) {
      showToast("ব্যাচ বা শ্রেণির নাম/ট্যাগ দিন।", "error");
      return;
    }

    setSaving(true);
    if (editingEntry) {
      const res = await updateClassDiaryEntry(editingEntry.id, formData);
      setSaving(false);
      if (res.ok && res.entry) {
        setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? res.entry! : e)));
        showToast("ক্লাস ডায়েরি সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createClassDiaryEntry(formData);
      setSaving(false);
      if (res.ok && res.entry) {
        setEntries((prev) => [res.entry!, ...prev]);
        showToast("নতুন ক্লাস ডায়েরি সফলভাবে প্রকাশ হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "পোস্ট করতে সমস্যা হয়েছে।", "error");
      }
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteClassDiaryEntry(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      showToast("ক্লাস ডায়েরি এন্ট্রি মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="আজকের ক্লাস ডায়েরি"
        subtitle="দৈনিক ক্লাসের টপিক, পড়ার সারসংক্ষেপ, বাড়ির কাজ ও স্লাইড/পিডিএফ শেয়ার করুন"
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন ক্লাস নোট প্রকাশ করুন</span>
          </PrimaryButton>
        }
      />

      {/* ওভারভিউ কার্ডস */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EBF5FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-700">মোট ক্লাস ডায়েরি</p>
          <p className="mt-1 font-body text-[20px] font-black text-sky-950 sm:text-[22px]">{toBengaliDigits(stats.total)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">ওয়েবসাইটে সংরক্ষিত লেকচার</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#ECFDF5] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-success">চলতি মাসের ক্লাস নোট</p>
          <p className="mt-1 font-body text-[20px] font-black text-emerald-900 sm:text-[22px]">{toBengaliDigits(stats.thisMonth)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">এই মাসে আপলোড করা হয়েছে</span>
        </div>

        <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-[#EEF2FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">সংযুক্ত স্লাইড ও পিডিএফ</p>
          <p className="mt-1 font-body text-[20px] font-black text-indigo-950 sm:text-[22px]">{toBengaliDigits(stats.withSlides)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">ডাউনলোডযোগ্য শিট যুক্ত</span>
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
              placeholder="টপিক, বাড়ির কাজ বা ব্যাচ দিয়ে খুঁজুন..."
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
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="h-[38px] max-w-[200px] truncate rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল ব্যাচ / শ্রেণি</option>
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল মাস</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🎯 ক্লাস ডায়েরি কার্ড গ্রিড */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো ক্লাস ডায়েরি পাওয়া যায়নি"
            hint="নতুন ক্লাসের নোট প্রকাশ করুন অথবা সার্চ/ফিল্টার পরিবর্তন করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => {
            return (
              <div
                key={entry.id}
                className="hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border border-border-base/90 bg-white p-5 shadow-sh1 transition-all duration-brand hover:shadow-sh2"
              >
                <div>
                  {/* কার্ডের শীর্ষ: তারিখ ও ব্যাচ ট্যাগ */}
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-border-base/50 pb-2.5">
                    <span className="font-body text-[11.5px] font-bold text-sky-800">
                      📅 {formatBengaliDate(entry.entry_date)}
                    </span>
                    <span className="rounded-lg bg-sky-100/80 px-2 py-0.5 font-body text-[10.5px] font-bold text-sky-900">
                      {entry.batch_name_snapshot || "সাধারণ ক্লাস"}
                    </span>
                  </div>

                  {/* ক্লাসের টপিক */}
                  <h3 className="font-body text-[15.5px] font-black tracking-tight text-sky-950">
                    {entry.topic}
                  </h3>

                  {/* সারসংক্ষেপ ও হোমওয়ার্ক */}
                  {entry.note ? (
                    <p className="mt-2.5 whitespace-pre-line font-body text-[12.5px] leading-relaxed text-ink-800/85">
                      {entry.note}
                    </p>
                  ) : (
                    <p className="mt-2.5 font-body text-[11.5px] text-muted italic">কোনো অতিরিক্ত নোট নেই।</p>
                  )}
                </div>

                {/* কার্ড ফুটার: স্লাইড লিংক ও অ্যাকশন বাটন */}
                <div className="mt-4 border-t border-border-base/60 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* স্লাইড / ড্রাইভ পিডিএফ লিংক বাটন */}
                    {entry.slide_url ? (
                      <a
                        href={entry.slide_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 font-body text-[11.5px] font-bold text-sky-700 transition-colors hover:bg-sky-600 hover:text-white"
                      >
                        <span>📄 লেকচার শিট / স্লাইড</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    ) : (
                      <span className="font-body text-[11px] font-medium text-muted">স্লাইড লিংক নেই</span>
                    )}

                    {/* এডিট ও ডিলিট বাটন */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(entry)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                        title="সম্পাদনা"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(entry)}
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

      {/* নতুন প্রকাশ / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEntry ? "ক্লাস ডায়েরি সম্পাদনা" : "আজকের ক্লাস ডায়েরি প্রকাশ করুন"}
        description="ক্লাসে যা পড়ানো হয়েছে তার সারসংক্ষেপ, বাড়ির কাজ ও গুগল ড্রাইভ পিডিএফ লিংক দিন।"
        maxWidth="max-w-xl"
      >
        {/* 📝 mehediadmin স্টাইলে স্মার্ট উদাহরণ লোড বাটন */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">দ্রুত লেখার টেমপ্লেট</p>
              <p className="font-body text-[10.5px] text-sky-800">স্ট্যান্ডার্ড লেকচার ও হোমওয়ার্ক ফরম্যাট এক ক্লিকে লোড করুন</p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* তারিখ */}
            <Field label="ক্লাসের তারিখ *" required>
              <TextInput
                type="date"
                required
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              />
            </Field>

            {/* ব্যাচ / শ্রেণি বা কাস্টম ট্যাগ */}
            <Field label="ব্যাচ / শ্রেণি নির্বাচন *" required>
              {!customTagMode ? (
                <Select
                  value={formData.batch_id || ""}
                  onChange={(e) => handleBatchSelectChange(e.target.value)}
                >
                  <option value="">— ব্যাচ বেছে নিন —</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                  <option value="__custom__">✍️ কাস্টম ট্যাগ লিখুন (যেমন: কলেজ ক্লাস)...</option>
                </Select>
              ) : (
                <div className="flex gap-1.5">
                  <TextInput
                    placeholder="যেমন: কলেজ ক্লাস — একাদশ শ্রেণি"
                    value={formData.batch_name_snapshot}
                    onChange={(e) => setFormData({ ...formData, batch_name_snapshot: e.target.value })}
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
          </div>

          {/* ক্লাসের মূল টপিক */}
          <Field label="ক্লাসের মূল টপিক বা শিরোনাম *" required>
            <TextInput
              required
              placeholder="যেমন: Flow Chart লেখার নিয়ম ও ৫টি বোর্ড প্রশ্ন অনুশীলন"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </Field>

          {/* সারসংক্ষেপ ও হোমওয়ার্ক */}
          <Field label="ক্লাসের সারসংক্ষেপ ও বাড়ির কাজ (নোট)">
            <TextArea
              rows={4}
              placeholder={"১. ক্লাসে পড়ানো গুরুত্বপূর্ণ পয়েন্টসমূহ...\n২. বাড়ির কাজের নির্দেশ...\n৩. কুইজ বা মডেল টেস্টের নোটিশ..."}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </Field>

          {/* গুগল ড্রাইভ / স্লাইড / পিডিএফ লিংক */}
          <Field label="লেকচার শিট / প্রেজেন্টেশন / গুগল ড্রাইভ পিডিএফ লিংক (ঐচ্ছিক)">
            <TextInput
              type="url"
              placeholder="https://drive.google.com/file/d/... বা Canva/PDF লিংক"
              value={formData.slide_url || ""}
              onChange={(e) => setFormData({ ...formData, slide_url: e.target.value })}
            />
            <span className="mt-1 block font-body text-[10.5px] text-muted">
              শিক্ষার্থীরা ওয়েবসাইটে এই লিংকে ক্লিক করে সরাসরি সম্পূর্ণ শিট বা পিডিএফ দেখতে পাবে।
            </span>
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "প্রকাশ হচ্ছে..." : editingEntry ? "হালনাগাদ করুন" : "✓ ক্লাস নোট প্রকাশ করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ডিলিট কনফার্মেশন মোডাল */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="ক্লাস ডায়েরি মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">&quot;{deleteTarget?.topic}&quot;</b>-এর ক্লাস নোটটি মুছে ফেলতে চান?
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
