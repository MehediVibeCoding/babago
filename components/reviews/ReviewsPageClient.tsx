"use client";

import { useMemo, useState } from "react";
import type { TestimonialItem } from "@/lib/types";
import {
  createTestimonial,
  updateTestimonial,
  toggleFeaturedTestimonial,
  deleteTestimonial,
  type TestimonialInput,
} from "@/app/actions/reviews";
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
import { toBengaliDigits, formatBengaliDate } from "@/lib/bengaliNumerals";

const MAX_QUOTE_LENGTH = 500;

const EMPTY_FORM: TestimonialInput = {
  name: "",
  role_type: "শিক্ষার্থী",
  batch_year: "HSC 2026",
  quote: "",
  is_featured: false,
  sort_order: 0,
};

// 🎯 উদাহরণ টেমপ্লেট
const EXAMPLE_REVIEW_TEMPLATE: TestimonialInput = {
  name: "তানভীর আহমেদ",
  role_type: "শিক্ষার্থী",
  batch_year: "HSC 2026",
  quote: "স্যারের ক্লাসের পর Flow Chart আর Theme লেখা এত সহজ মনে হয়েছে যে বোর্ড পরীক্ষায় ইংরেজি নিয়ে কোনো ভয়ই ছিল না।",
  is_featured: true,
  sort_order: 1,
};

export default function ReviewsPageClient({
  initialTestimonials,
}: {
  initialTestimonials: TestimonialItem[];
}) {
  const { show: showToast } = useToast();

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(initialTestimonials);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
  const [formData, setFormData] = useState<TestimonialInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ডিলিট / রিজেক্ট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<TestimonialItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ফিল্টার করা রিভিউ তালিকা
  const filteredTestimonials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return testimonials.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.quote.toLowerCase().includes(q) ||
        t.batch_year.toLowerCase().includes(q);

      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "student" && t.role_type === "শিক্ষার্থী") ||
        (roleFilter === "parent" && t.role_type === "অভিভাবক") ||
        (roleFilter === "featured" && t.is_featured) ||
        (roleFilter === "pending" && !t.is_featured);

      return matchSearch && matchRole;
    });
  }, [testimonials, search, roleFilter]);

  // পরিসংখ্যান
  const stats = useMemo(() => {
    const total = testimonials.length;
    const studentsCount = testimonials.filter((t) => t.role_type === "শিক্ষার্থী").length;
    const parentsCount = testimonials.filter((t) => t.role_type === "অভিভাবক").length;
    const featuredCount = testimonials.filter((t) => t.is_featured).length;
    const pendingCount = total - featuredCount;
    return { total, studentsCount, parentsCount, featuredCount, pendingCount };
  }, [testimonials]);

  function openAddModal() {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(item: TestimonialItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      role_type: item.role_type,
      batch_year: item.batch_year,
      quote: item.quote,
      is_featured: item.is_featured,
      sort_order: item.sort_order,
    });
    setModalOpen(true);
  }

  function handleLoadExample() {
    setFormData(EXAMPLE_REVIEW_TEMPLATE);
    showToast("উদাহরণ রিভিউ টেমপ্লেট লোড হয়েছে ✓", "info");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("নাম দিন।", "error");
      return;
    }
    if (!formData.quote.trim()) {
      showToast("মতামত বা রিভিউ টেক্সট লিখুন।", "error");
      return;
    }

    setSaving(true);
    if (editingItem) {
      const res = await updateTestimonial(editingItem.id, formData);
      setSaving(false);
      if (res.ok && res.testimonial) {
        setTestimonials((prev) => prev.map((t) => (t.id === editingItem.id ? res.testimonial! : t)));
        showToast("রিভিউ সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createTestimonial(formData);
      setSaving(false);
      if (res.ok && res.testimonial) {
        setTestimonials((prev) => [res.testimonial!, ...prev]);
        showToast("নতুন রিভিউ সফলভাবে যুক্ত হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "সংরক্ষণ করা যায়নি।", "error");
      }
    }
  }

  // ⭐ ১-ক্লিক ফিচার্ড / হোমপেজে পিন টগল (মেইন সাইটের লাইভ কার্ড কন্ট্রোল)
  async function handleToggleFeatured(item: TestimonialItem, currentFeatured: boolean) {
    const nextState = !currentFeatured;
    const res = await toggleFeaturedTestimonial(item.id, nextState);
    if (res.ok) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, is_featured: nextState } : t))
      );
      showToast(
        nextState
          ? `"${item.name}"-এর রিভিউটি হোমপেজের শীর্ষে লাইভ প্রকাশ করা হয়েছে ⭐`
          : `"${item.name}"-এর রিভিউটি পেন্ডিং অবস্থায় রাখা হয়েছে`,
        "info"
      );
    } else {
      showToast("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", "error");
    }
  }

  // রিভিউ মুছে ফেলা / বাতিল (রিজেক্ট) করা
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteTestimonial(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setTestimonials((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast("রিভিউটি বাতিল ও মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="রিভিউ ও মতামত অনুমোদন"
        subtitle="ওয়েবসাইট থেকে আসা রিভিউ অনুমোদন করুন এবং হোমপেজের শীর্ষে প্রদর্শনের জন্য ১-ক্লিকে পিন করুন"
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন রিভিউ যোগ করুন</span>
          </PrimaryButton>
        }
      />

      {/* ওভারভিউ কার্ডস */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EBF5FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-700">মোট রিভিউ</p>
          <p className="mt-1 font-body text-[20px] font-black text-sky-950 sm:text-[22px]">{toBengaliDigits(stats.total)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">ডাটাবেজে জমা পড়া মতামত</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#ECFDF5] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-success">⭐ হোমপেজে লাইভ (Featured)</p>
          <p className="mt-1 font-body text-[20px] font-black text-emerald-950 sm:text-[22px]">{toBengaliDigits(stats.featuredCount)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">ওয়েবসাইটের শীর্ষে দৃশ্যমান</span>
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#FFFBEB] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-warn">অপেক্ষমান ড্রাফট</p>
          <p className="mt-1 font-body text-[20px] font-black text-amber-950 sm:text-[22px]">{toBengaliDigits(stats.pendingCount)}টি</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">অনুমোদনের অপেক্ষায়</span>
        </div>

        <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-[#EEF2FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">শিক্ষার্থী ও অভিভাবক</p>
          <p className="mt-1 font-body text-[20px] font-black text-indigo-950 sm:text-[22px]">
            {toBengaliDigits(stats.studentsCount)} : {toBengaliDigits(stats.parentsCount)}
          </p>
          <span className="font-body text-[10.5px] font-semibold text-muted">অনুপাত (শিক্ষার্থী : অভিভাবক)</span>
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
              placeholder="নাম, রিভিউ বক্তব্য বা শিক্ষাবর্ষ দিয়ে খুঁজুন..."
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল মতামত</option>
              <option value="featured">⭐ শুধু হোমপেজে লাইভ (Featured)</option>
              <option value="pending">🟡 শুধু অপেক্ষমান (Pending)</option>
              <option value="student">🎓 শুধু শিক্ষার্থী</option>
              <option value="parent">👨‍👩‍👦 শুধু অভিভাবক</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🎯 রিভিউ ওয়াল গ্রিড */}
      {filteredTestimonials.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো রিভিউ পাওয়া যায়নি"
            hint="শিক্ষার্থী বা অভিভাবকের নতুন মতামত যুক্ত করুন অথবা ফিল্টার পরিবর্তন করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTestimonials.map((item) => (
            <div
              key={item.id}
              className={`hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border bg-white p-5 shadow-sh1 transition-all duration-brand hover:shadow-sh2 ${
                item.is_featured ? "border-emerald-300 bg-emerald-50/15" : "border-border-base/90"
              }`}
            >
              <div>
                {/* কার্ডের শীর্ষ: ব্যাজ ও ১-ক্লিক ফিচার্ড পিন বাটন */}
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-border-base/50 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-md px-2 py-0.5 font-body text-[10.5px] font-bold ${
                        item.role_type === "শিক্ষার্থী"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {item.role_type} · {item.batch_year}
                    </span>
                    {item.is_featured ? (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-body text-[10px] font-black text-emerald-800">
                        ⭐ লাইভ
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 font-body text-[10px] font-bold text-amber-900">
                        অপেক্ষমান
                      </span>
                    )}
                  </div>

                  {/* ১-ক্লিক ফিচার্ড পিন সুইচ */}
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(item, item.is_featured)}
                    title={item.is_featured ? "হোমপেজ থেকে সরিয়ে ড্রাফট করুন" : "হোমপেজের শীর্ষে লাইভ পিন করুন"}
                    className={`flex h-8 items-center gap-1 rounded-lg border px-2.5 font-body text-[11px] font-bold transition-all ${
                      item.is_featured
                        ? "border-emerald-300 bg-emerald-100 text-emerald-900 shadow-2xs"
                        : "border-border-base bg-white text-muted hover:border-amber-400 hover:text-amber-600"
                    }`}
                  >
                    <span>{item.is_featured ? "★ লাইভ" : "☆ পিন করুন"}</span>
                  </button>
                </div>

                {/* রিভিউ বক্তব্য */}
                <blockquote className="font-body text-[13px] italic leading-relaxed text-ink-800/90 line-clamp-4">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>

              {/* কার্ড ফুটার: নাম ও অ্যাকশন */}
              <div className="mt-4 flex items-center justify-between border-t border-border-base/60 pt-3">
                <div>
                  <p className="font-body text-[13.5px] font-black text-sky-950">
                    {item.name}
                  </p>
                  <p className="font-body text-[10.5px] font-medium text-muted">
                    {formatBengaliDate(item.created_at.slice(0, 10))}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                    title="সম্পাদনা"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 text-danger transition-colors hover:bg-rose-100"
                    title="বাতিল ও মুছে ফেলুন"
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

      {/* নতুন রিভিউ / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "রিভিউ ও মতামত সম্পাদনা" : "নতুন রিভিউ যুক্ত করুন"}
        description="প্রদানকারীর নাম, ব্যাচ এবং তাদের প্রশংসামূলক বক্তব্য লিখুন।"
      >
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">নমুনা রিভিউ বক্তব্য</p>
              <p className="font-body text-[10.5px] text-sky-800">উদাহরণ প্রশংসাপত্র লোড করুন</p>
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
          <Field label="প্রদানকারীর নাম *" required>
            <TextInput
              required
              placeholder="যেমন: তানভীর আহমেদ"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="পরিচয় / ভূমিকা *" required>
              <Select
                value={formData.role_type}
                onChange={(e) =>
                  setFormData({ ...formData, role_type: e.target.value as "শিক্ষার্থী" | "অভিভাবক" })
                }
              >
                <option value="শিক্ষার্থী">শিক্ষার্থী</option>
                <option value="অভিভাবক">অভিভাবক</option>
              </Select>
            </Field>

            <Field label="শিক্ষাবর্ষ বা ব্যাচ *" required>
              <TextInput
                required
                placeholder="যেমন: HSC 2026"
                value={formData.batch_year}
                onChange={(e) => setFormData({ ...formData, batch_year: e.target.value })}
              />
            </Field>
          </div>

          <Field label="মতামত বা রিভিউ বক্তব্য *" required>
            <div className="mb-1 flex items-center justify-end">
              <span className="font-body text-[10.5px] font-semibold text-muted">
                {formData.quote.length} / {MAX_QUOTE_LENGTH} অক্ষর
              </span>
            </div>
            <TextArea
              rows={4}
              required
              maxLength={MAX_QUOTE_LENGTH}
              placeholder="স্যারের ক্লাস ও একাডেমি সম্পর্কে তাদের মতামত..."
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
            <div>
              <p className="font-body text-[12.5px] font-bold text-sky-950">⭐ সরাসরি হোমপেজের শীর্ষে লাইভ করুন (Featured)</p>
              <p className="font-body text-[11px] text-muted">চালু থাকলে এটি সাথে সাথে মেইন ওয়েবসাইটের শীর্ষ ৩টি কার্ডে চলে যাবে।</p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="h-5 w-5 rounded text-sky-600 focus:ring-sky-600"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingItem ? "হালনাগাদ করুন" : "✓ রিভিউ যুক্ত করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ডিলিট / রিজেক্ট কনফার্মেশন মোডাল */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="রিভিউ বাতিল বা মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800 leading-relaxed">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">{deleteTarget?.name}</b>-এর রিভিউটি বাতিল ও মুছে ফেলতে চান?
          </p>
          <p className="font-body text-[11.5px] text-muted">
            (মুছে ফেললে মেইন ওয়েবসাইটে এই ব্যবহারকারী পরবর্তীতে ঢুকলে তাকে একবার &apos;রিভিউটি বাতিল করা হয়েছে&apos; নোটিশ দেখানো হবে।)
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
