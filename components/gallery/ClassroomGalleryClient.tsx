"use client";

import { useMemo, useState } from "react";
import type { ClassroomPhoto } from "@/lib/types";
import {
  createClassroomPhoto,
  updateClassroomPhoto,
  deleteClassroomPhoto,
  type ClassroomPhotoInput,
} from "@/app/actions/classroom";
import { useToast } from "@/components/admin/Toast";
import Modal from "@/components/admin/Modal";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Field,
  TextInput,
  EmptyState,
} from "@/components/admin/ui";
import { toBengaliDigits, formatBengaliDate } from "@/lib/bengaliNumerals";

type SlotType = "hero_16_9" | "sub_9_16";
type FocalPosition = "top" | "center" | "bottom";

interface FormState {
  image_url: string;
  slot_type: SlotType;
  focal_position: FocalPosition;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  image_url: "",
  slot_type: "hero_16_9",
  focal_position: "center",
  sort_order: 0,
};

// 🎯 উদাহরণ টেমপ্লেট
const EXAMPLE_PHOTO_TEMPLATE: FormState = {
  image_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80",
  slot_type: "hero_16_9",
  focal_position: "top",
  sort_order: 0,
};

export default function ClassroomGalleryClient({
  initialPhotos,
}: {
  initialPhotos: ClassroomPhoto[];
}) {
  const { show: showToast } = useToast();

  const [photos, setPhotos] = useState<ClassroomPhoto[]>(initialPhotos);
  const [slotFilter, setSlotFilter] = useState<string>("all");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<ClassroomPhoto | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ফুলস্ক্রিন প্রিভিউ লাইটবক্স
  const [previewPhoto, setPreviewPhoto] = useState<ClassroomPhoto | null>(null);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<ClassroomPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ফিল্টার করা ছবি তালিকা
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (slotFilter === "hero") return p.sort_order === 0;
      if (slotFilter === "sub") return p.sort_order !== 0;
      return true;
    });
  }, [photos, slotFilter]);

  function openAddModal(defaultSlot: SlotType = "hero_16_9") {
    setEditingPhoto(null);
    setFormData({
      ...EMPTY_FORM,
      slot_type: defaultSlot,
      sort_order: defaultSlot === "hero_16_9" ? 0 : 1,
    });
    setModalOpen(true);
  }

  function openEditModal(photo: ClassroomPhoto) {
    setEditingPhoto(photo);
    setFormData({
      image_url: photo.image_url,
      slot_type: photo.sort_order === 0 ? "hero_16_9" : "sub_9_16",
      focal_position: "center",
      sort_order: photo.sort_order,
    });
    setModalOpen(true);
  }

  function handleLoadExample() {
    setFormData(EXAMPLE_PHOTO_TEMPLATE);
    showToast("উদাহরণ ছবির লিংক ও ১৬:৯ ফ্রেম লোড হয়েছে ✓", "info");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      showToast("ছবির সঠিক লিংক (Cloudinary / Image URL) দিন।", "error");
      return;
    }

    setSaving(true);
    const payload: ClassroomPhotoInput = {
      image_url: formData.image_url.trim(),
      slot_type: formData.slot_type,
      focal_position: formData.focal_position,
      sort_order: formData.slot_type === "hero_16_9" ? 0 : 1,
    };

    if (editingPhoto) {
      const res = await updateClassroomPhoto(editingPhoto.id, payload);
      setSaving(false);
      if (res.ok && res.photo) {
        setPhotos((prev) => prev.map((p) => (p.id === editingPhoto.id ? res.photo! : p)));
        showToast("ছবি সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createClassroomPhoto(payload);
      setSaving(false);
      if (res.ok && res.photo) {
        setPhotos((prev) => [res.photo!, ...prev]);
        showToast("নতুন ছবি গ্যালারিতে যুক্ত হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "ছবি যুক্ত করা যায়নি।", "error");
      }
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteClassroomPhoto(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast("ছবি মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="ক্লাসরুম ও একাডেমি লাইফ গ্যালারি"
        subtitle="মেইন ওয়েবসাইটের ১৬:৯ প্রধান হিরো ছবি ও নিচে ৯:১৬ সাব-স্প্লিট ছবি পরিচালনা করুন"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openAddModal("hero_16_9")}
              className="flex items-center gap-1.5 rounded-full bg-sky-950 px-4 py-2.5 font-body text-xs font-bold text-white shadow-xs hover:bg-sky-900 active:scale-95"
            >
              <span>🖼️</span>
              <span>+ ১৬:৯ প্রধান ছবি</span>
            </button>

            <PrimaryButton onClick={() => openAddModal("sub_9_16")}>
              <span>📱 + ৯:১৬ সাব-ছবি</span>
            </PrimaryButton>
          </div>
        }
      />

      {/* 💡 স্লট নির্বাচন ও ক্রপিং গাইডলাইন ব্যানার */}
      <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-sky-200 bg-sky-50/80 p-4 shadow-sh1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white text-base">
          📐
        </span>
        <div className="font-body text-xs sm:text-[13px] text-sky-950 leading-relaxed">
          <p className="font-bold text-sky-900">গ্যালারি স্লট ও ফোকাস পজিশন গাইডলাইন:</p>
          <p className="mt-0.5 text-sky-800/90">
            মেইন ওয়েবসাইটে প্রতি ৩টি ছবি একটি সেট: ওপরে থাকে <b>১৬:৯ প্রধান ছবি</b> এবং নিচে পাশাপাশি থাকে <b>২টি ৯:১৬ সাব-ছবি</b>। ছবি যুক্ত করার সময় নিচে বা ওপরে কোনো গুরুত্বপূর্ণ অংশ (যেমন: মাথা বা মুখ) থাকলে <b>ফোকাস পজিশন</b> সিলেক্ট করে দিলে ছবি কখনোই ভুলভাবে কাটবে না। (কোনো ক্যাপশন দেওয়ার প্রয়োজন নেই)।
          </p>
        </div>
      </div>

      {/* স্লট ফিল্টার ও পরিসংখ্যান বার */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between overflow-hidden rounded-[22px] border border-border-base/80 bg-white p-4 shadow-sh1 backdrop-blur-xl">
        <div className="flex items-center gap-2 font-body text-[13.5px] font-bold text-sky-950">
          <span>মোট ছবি:</span>
          <span className="rounded-lg bg-sky-100 px-2.5 py-0.5 font-black text-sky-800">
            {toBengaliDigits(photos.length)}টি
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
            className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-bold text-ink-800 outline-none focus:border-sky-600"
          >
            <option value="all">সকল স্লটের ছবি</option>
            <option value="hero">🖼️ শুধু ১৬:৯ প্রধান ছবি</option>
            <option value="sub">📱 শুধু ৯:১৬ সাব-স্প্লিট ছবি</option>
          </select>
        </div>
      </div>

      {/* 🎯 ফটো গ্রিড (কোনো ক্যাপশন ছাড়া পিউর প্রিমিয়াম ফটো ভিউ) */}
      {filteredPhotos.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো ক্লাসরুম ছবি পাওয়া যায়নি"
            hint="১৬:৯ প্রধান ছবি বা ৯:১৬ সাব-ছবি হিসেবে নতুন ছবি যুক্ত করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPhotos.map((photo) => {
            const isHero = photo.sort_order === 0;

            return (
              <div
                key={photo.id}
                className="hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border border-border-base/90 bg-white p-3 shadow-sh1 transition-all duration-brand hover:shadow-sh2"
              >
                <div>
                  {/* ইমেজ ফ্রেম */}
                  <div
                    onClick={() => setPreviewPhoto(photo)}
                    className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-100 border border-border-base/60 ${
                      isHero ? "aspect-video" : "aspect-[16/10]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.image_url}
                      alt="Classroom Shot"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80";
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
                </div>

                {/* কার্ড ফুটার (তারিখ ও অ্যাকশন বাটন) */}
                <div className="mt-3 flex items-center justify-between border-t border-border-base/60 pt-2.5">
                  <span className="font-body text-[11px] font-medium text-muted">
                    {formatBengaliDate(photo.created_at.slice(0, 10))}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(photo)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                      title="সম্পাদনা"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(photo)}
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
            );
          })}
        </div>
      )}

      {/* নতুন ছবি যুক্ত / এডিট মোডাল (ক্যাপশন-মুক্ত ও লাইভ ক্রপার সহ) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPhoto ? "ছবির স্লট ও ফোকাস সম্পাদনা" : "নতুন ক্লাসরুম ছবি যুক্ত করুন"}
        description="ছবির লিংক দিন এবং সেটি কোন স্লটে কীভাবে ক্রপ হয়ে প্রদর্শিত হবে তা নির্ধারণ করুন।"
      >
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">নমুনা ক্লাসরুম ছবি</p>
              <p className="font-body text-[10.5px] text-sky-800">ডেমো ইমেজ লিংক লোড করুন</p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-body text-[12px] font-bold text-ink-800">
                গ্যালারি স্লটের ধরন *
              </label>
              <div className="flex flex-col gap-2 pt-0.5">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-base bg-white p-2.5 font-body text-xs font-bold text-sky-950 hover:bg-sky-50">
                  <input
                    type="radio"
                    name="slot_choice"
                    value="hero_16_9"
                    checked={formData.slot_type === "hero_16_9"}
                    onChange={() => setFormData({ ...formData, slot_type: "hero_16_9", sort_order: 0 })}
                    className="h-4 w-4 text-sky-600"
                  />
                  <span>🖼️ ১৬:৯ প্রধান হিরো ছবি (ওপরে)</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-base bg-white p-2.5 font-body text-xs font-bold text-sky-950 hover:bg-sky-50">
                  <input
                    type="radio"
                    name="slot_choice"
                    value="sub_9_16"
                    checked={formData.slot_type === "sub_9_16"}
                    onChange={() => setFormData({ ...formData, slot_type: "sub_9_16", sort_order: 1 })}
                    className="h-4 w-4 text-sky-600"
                  />
                  <span>📱 ৯:১৬ সাব-ছবি (নিচে স্প্লিট)</span>
                </label>
              </div>
            </div>

            {/* ক্রপিং ফোকাস পজিশন (মাথা/চরিত্র কাটা রোধ) */}
            <div>
              <label className="mb-1.5 block font-body text-[12px] font-bold text-ink-800">
                ক্রপ ফোকাস পজিশন (মাথা/মুখ কাটা রোধে)
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: "top", label: "🎯 উপরে / মাথা ফোকাস (Top)" },
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
                      name="focal_choice"
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

          {/* 🖼️ লাইভ ইন্টারঅ্যাক্টিভ ক্রপিং প্রিভিউয়ার */}
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
              {saving ? "সংরক্ষণ হচ্ছে..." : editingPhoto ? "হালনাগাদ করুন" : "✓ ছবি যুক্ত করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 👁️ ফুলস্ক্রিন প্রিভিউ মোডাল */}
      <Modal
        open={!!previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        title="ক্লাসরুম ছবি প্রিভিউ"
        maxWidth="max-w-2xl"
      >
        {previewPhoto && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto.image_url}
              alt="Classroom Full View"
              className="w-full max-h-[460px] rounded-2xl aspect-video object-cover border border-border-base shadow-sm"
            />
            <div className="flex justify-end border-t border-border-base/60 pt-3">
              <SecondaryButton type="button" onClick={() => setPreviewPhoto(null)}>
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
        title="ছবি মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে এই ক্লাসরুম ছবিটি মুছে ফেলতে চান?
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
