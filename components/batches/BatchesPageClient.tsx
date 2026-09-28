"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Batch, Student } from "@/lib/types";
import {
  createBatch,
  updateBatch,
  toggleBatchActive,
  deleteBatch,
  type BatchInput,
} from "@/app/actions/batches";
import { useToast } from "@/components/admin/Toast";
import Modal from "@/components/admin/Modal";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Field,
  TextInput,
  TextArea,
  Select,
  EmptyState,
} from "@/components/admin/ui";
import { toBengaliDigits } from "@/lib/bengaliNumerals";

const COHORTS = ["HSC 2028 ব্যাচ", "HSC 2027 ব্যাচ", "HSC 2026 ব্যাচ", "অন্যান্য"];
const BADGES = ["ভর্তি চলছে", "সীমিত আসন", "সর্বাধিক জনপ্রিয়", "একাডেমিক কেয়ার", "স্পেশাল ব্যাচ"];

const EMPTY_FORM: BatchInput = {
  name: "",
  target_cohort: "HSC 2028 ব্যাচ",
  badge: "ভর্তি চলছে",
  schedule: "",
  location: "চৌদ্দগ্রাম একাডেমি শাখা",
  features: [],
  seats_left: 10,
  is_active: true,
  sort_order: 10,
};

export default function BatchesPageClient({
  initialBatches,
  students,
}: {
  initialBatches: Batch[];
  students: Student[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { show: showToast } = useToast();

  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState<string>("all");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState<BatchInput>(EMPTY_FORM);
  const [featuresRaw, setFeaturesRaw] = useState("");
  const [saving, setSaving] = useState(false);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      openAddModal();
    }
  }, [searchParams]);

  // প্রতি ব্যাচে মোট সক্রিয় শিক্ষার্থী সংখ্যা গণনা
  const studentCountByBatch = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      if (s.batch_id && s.status !== "inactive") {
        map.set(s.batch_id, (map.get(s.batch_id) || 0) + 1);
      }
    });
    return map;
  }, [students]);

  // ফিল্টার করা ব্যাচ তালিকা
  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return batches.filter((b) => {
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.schedule.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q);

      const matchCohort = cohortFilter === "all" || b.target_cohort === cohortFilter;

      return matchSearch && matchCohort;
    });
  }, [batches, search, cohortFilter]);

  // পরিসংখ্যান
  const stats = useMemo(() => {
    const total = batches.length;
    const active = batches.filter((b) => b.is_active).length;
    const inactive = total - active;
    const totalEnrolled = students.filter((s) => s.status !== "inactive").length;
    return { total, active, inactive, totalEnrolled };
  }, [batches, students]);

  function openAddModal() {
    setEditingBatch(null);
    setFormData(EMPTY_FORM);
    setFeaturesRaw(
      "১০০% সিলেবাস কমপ্লিট কেয়ার\nসাপ্তাহিক বোর্ড স্ট্যান্ডার্ড মডেল টেস্ট\nডিজিটাল ক্লাস নোট ও শিট প্রদান"
    );
    setModalOpen(true);
  }

  function openEditModal(batch: Batch) {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      target_cohort: batch.target_cohort,
      badge: batch.badge,
      schedule: batch.schedule,
      location: batch.location,
      features: batch.features || [],
      seats_left: batch.seats_left,
      is_active: batch.is_active,
      sort_order: batch.sort_order,
    });
    setFeaturesRaw((batch.features || []).join("\n"));
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.schedule.trim()) {
      showToast("ব্যাচের নাম ও ক্লাসের শিডিউল আবশ্যক।", "error");
      return;
    }

    const features = featuresRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    const payload = { ...formData, features };

    if (editingBatch) {
      const res = await updateBatch(editingBatch.id, payload);
      setSaving(false);
      if (res.ok && res.batch) {
        setBatches((prev) => prev.map((b) => (b.id === editingBatch.id ? res.batch! : b)));
        showToast("ব্যাচের তথ্য সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createBatch(payload);
      setSaving(false);
      if (res.ok && res.batch) {
        setBatches((prev) => [...prev, res.batch!]);
        showToast("নতুন ব্যাচ সফলভাবে চালু হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "ব্যাচ তৈরি ব্যর্থ হয়েছে।", "error");
      }
    }
  }

  async function handleToggleActive(batch: Batch, currentActive: boolean) {
    const nextState = !currentActive;
    const res = await toggleBatchActive(batch.id, nextState);
    if (res.ok) {
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, is_active: nextState } : b)));
      showToast(
        nextState
          ? `"${batch.name}" মেইন ওয়েবসাইটে চালু করা হয়েছে ✓`
          : `"${batch.name}" সাময়িক নিষ্ক্রিয় করা হয়েছে`,
        "info"
      );
    } else {
      showToast("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteBatch(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setBatches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      showToast("ব্যাচ সফলভাবে মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="ব্যাচ ব্যবস্থাপনা"
        subtitle="অফলাইন ও প্রাইভেট ব্যাচ তৈরি, শিডিউল, আসন সংখ্যা ও মেইন ওয়েবসাইট নিয়ন্ত্রণ"
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন ব্যাচ খুলুন</span>
          </PrimaryButton>
        }
      />

      {/* ওভারভিউ কার্ডস */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EBF5FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-700">মোট ব্যাচ</p>
          <p className="mt-1 font-body text-[20px] font-black text-sky-950 sm:text-[22px]">{toBengaliDigits(stats.total)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">সকল একাডেমিক প্রোগ্রাম</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#ECFDF5] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-success">সক্রিয় ব্যাচ</p>
          <p className="mt-1 font-body text-[20px] font-black text-emerald-900 sm:text-[22px]">{toBengaliDigits(stats.active)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">মেইন ওয়েবসাইটে দৃশ্যমান</span>
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#FFFBEB] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-warn">নিষ্ক্রিয় ব্যাচ</p>
          <p className="mt-1 font-body text-[20px] font-black text-amber-950 sm:text-[22px]">{toBengaliDigits(stats.inactive)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">ভর্তি বন্ধ বা সমাপ্ত</span>
        </div>

        <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-[#EEF2FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">মোট শিক্ষার্থী</p>
          <p className="mt-1 font-body text-[20px] font-black text-indigo-950 sm:text-[22px]">{toBengaliDigits(stats.totalEnrolled)} জন</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">চলমান ব্যাচসমূহে এনরোল্ড</span>
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
              placeholder="ব্যাচের নাম, শিডিউল বা শাখা দিয়ে খুঁজুন..."
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
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল টার্গেট শ্রেণি / ব্যাচ</option>
              {COHORTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🎯 ব্যাচ কার্ড গ্রিড */}
      {filteredBatches.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো ব্যাচ পাওয়া যায়নি"
            hint="সার্চ বা ফিল্টার পরিবর্তন করুন অথবা নতুন ব্যাচ খুলুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((b) => {
            const studentCount = studentCountByBatch.get(b.id) || 0;

            return (
              <div
                key={b.id}
                className={`relative flex flex-col justify-between overflow-hidden rounded-[24px] border bg-white p-5 shadow-sh1 transition-all duration-brand hover:-translate-y-0.5 hover:shadow-sh2 ${
                  b.is_active ? "border-border-base/90" : "border-amber-200/80 bg-amber-50/20 opacity-80"
                }`}
              >
                {/* কার্ডের শীর্ষ: ব্যাজ ও একটিভ সুইচ */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-sky-100/80 px-2.5 py-1 font-body text-[11px] font-black text-sky-800">
                        {b.badge || "ভর্তি চলছে"}
                      </span>
                      <span className="font-body text-[11px] font-semibold text-muted">
                        {b.target_cohort}
                      </span>
                    </div>

                    {/* মেইন ওয়েবসাইট লাইভ টগল সুইচ */}
                    <label className="flex cursor-pointer items-center gap-1.5" title={b.is_active ? "ওয়েবসাইটে সক্রিয়" : "ওয়েবসাইটে বন্ধ"}>
                      <span className="font-body text-[10.5px] font-bold text-muted">
                        {b.is_active ? "সক্রিয়" : "বন্ধ"}
                      </span>
                      <input
                        type="checkbox"
                        checked={b.is_active}
                        onChange={() => handleToggleActive(b, b.is_active)}
                        className="h-4 w-4 rounded text-sky-600 focus:ring-sky-600"
                      />
                    </label>
                  </div>

                  {/* ব্যাচের নাম */}
                  <h3 className="font-body text-[16px] font-black tracking-tight text-sky-950">
                    {b.name}
                  </h3>

                  {/* সময় ও শিডিউল */}
                  <div className="mt-2.5 flex items-center gap-1.5 font-body text-[12px] font-bold text-sky-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{b.schedule}</span>
                  </div>

                  {/* শাখা / লোকেশন */}
                  <p className="mt-1 flex items-center gap-1.5 font-body text-[11px] font-medium text-muted">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{b.location || "চৌদ্দগ্রাম একাডেমি শাখা"}</span>
                  </p>

                  {/* আসন ও শিক্ষার্থী রিয়েলটাইম কাউন্টার বার */}
                  <div className="mt-3.5 flex items-center justify-between rounded-xl bg-surface-muted/70 px-3 py-2">
                    <div>
                      <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-muted">বর্তমান শিক্ষার্থী</span>
                      <span className="font-body text-[14px] font-black text-sky-950">
                        👥 {toBengaliDigits(studentCount)} জন
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-muted">আসন বাকি</span>
                      <span className="font-body text-[13px] font-extrabold text-amber-800">
                        {b.seats_left !== null ? `${toBengaliDigits(b.seats_left)}টি` : "উন্মুক্ত"}
                      </span>
                    </div>
                  </div>

                  {/* ব্যাচের সুবিধাসমূহ (Features) */}
                  {b.features && b.features.length > 0 && (
                    <ul className="mt-3.5 space-y-1.5 border-t border-border-base/50 pt-2.5">
                      {b.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 font-body text-[11.5px] text-ink-800/80">
                          <span className="font-bold text-sky-600">✓</span>
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* কার্ড ফুটার অ্যাকশনস */}
                <div className="mt-4 flex items-center justify-between border-t border-border-base/60 pt-3">
                  {/* সরাসরি এই ব্যাচের শিক্ষার্থী তালিকায় যাওয়ার বাটন */}
                  <button
                    type="button"
                    onClick={() => router.push(`/students?batch=${b.id}`)}
                    className="font-body text-[11.5px] font-black text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    শিক্ষার্থী তালিকা ({toBengaliDigits(studentCount)}) →
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(b)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                      title="ব্যাচ সম্পাদনা"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(b)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 text-danger transition-colors hover:bg-rose-100"
                      title="ব্যাচ মুছুন"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* নতুন ব্যাচ তৈরি / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBatch ? "ব্যাচের তথ্য সম্পাদনা" : "নতুন ব্যাচ চালু করুন"}
        description="ব্যাচের নাম, ক্লাসের শিডিউল, আসন সংখ্যা ও বিশেষ সুবিধাসমূহ পূরণ করুন।"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <Field label="ব্যাচের নাম *" required>
            <TextInput
              required
              placeholder="যেমন: HSC 28 English & ICT Combine"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="টার্গেট শ্রেণি / ব্যাচ" required>
              <Select
                value={formData.target_cohort}
                onChange={(e) => setFormData({ ...formData, target_cohort: e.target.value })}
              >
                {COHORTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="হাইলাইট ব্যাজ ট্যাগ">
              <Select
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              >
                {BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="ক্লাসের শিডিউল ও সময়সূচি *" required>
            <TextInput
              required
              placeholder="যেমন: শনি, সোম, বুধ — বিকাল ৪:০০ টা"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="শাখা / লোকেশন">
              <TextInput
                placeholder="চৌদ্দগ্রাম একাডেমি শাখা"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Field>

            <Field label="বাকি আসন সংখ্যা">
              <TextInput
                type="number"
                min={0}
                placeholder="10"
                value={formData.seats_left ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seats_left: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </Field>
          </div>

          <Field label="ব্যাচের বিশেষ সুবিধাসমূহ (Features)">
            <TextArea
              rows={4}
              placeholder={"প্রতি লাইনে একটি করে সুবিধা লিখুন:\n১০০% সিলেবাস কমপ্লিট কেয়ার\nসাপ্তাহিক মডেল টেস্ট\nডিজিটাল ক্লাস নোট ও শিট"}
              value={featuresRaw}
              onChange={(e) => setFeaturesRaw(e.target.value)}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
            <div>
              <p className="font-body text-[12.5px] font-bold text-sky-950">মেইন ওয়েবসাইটে সক্রিয় রাখুন</p>
              <p className="font-body text-[11px] text-muted">চালু থাকলে শিক্ষার্থীরা ওয়েবসাইটে এই ব্যাচে ভর্তি হতে পারবে।</p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-5 w-5 rounded text-sky-600 focus:ring-sky-600"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingBatch ? "হালনাগাদ করুন" : "ব্যাচ তৈরি সম্পন্ন করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ডিলিট কনফার্মেশন মোডাল */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="ব্যাচ মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">{deleteTarget?.name}</b> ব্যাচটি মুছে ফেলতে চান?
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
