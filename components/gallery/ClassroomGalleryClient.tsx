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

const EMPTY_FORM: ClassroomPhotoInput = {
  caption: "",
  image_url: "",
  sort_order: 0,
};

// 🎯 উদাহরণ টেমপ্লেট
const EXAMPLE_PHOTO_TEMPLATE: ClassroomPhotoInput = {
  caption: "হোয়াইটবোর্ডে লজিক গেইটের বাস্তব ডায়াগ্রাম ও ক্লাস মুহূর্ত",
  image_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80",
  sort_order: 1,
};

export default function ClassroomGalleryClient({
  initialPhotos,
}: {
  initialPhotos: ClassroomPhoto[];
}) {
  const { show: showToast } = useToast();

  const [photos, setPhotos] = useState<ClassroomPhoto[]>(initialPhotos);
  const [search, setSearch] = useState("");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<ClassroomPhoto | null>(null);
  const [formData, setFormData] = useState<ClassroomPhotoInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ফুলস্ক্রিন প্রিভিউ লাইটবক্স
  const [previewPhoto, setPreviewPhoto] = useState<ClassroomPhoto | null>(null);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<ClassroomPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ফিল্টার করা ছবি তালিকা
  const filteredPhotos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return photos.filter((p) => !q || p.caption.toLowerCase().includes(q));
  }, [photos, search]);

  function openAddModal() {
    setEditingPhoto(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(photo: ClassroomPhoto) {
    setEditingPhoto(photo);
    setFormData({
      caption: photo.caption,
      image_url: photo.image_url,
      sort_order: photo.sort_order,
    });
    setModalOpen(true);
  }

  function handleLoadExample() {
    setFormData(EXAMPLE_PHOTO_TEMPLATE);
    showToast("উদাহরণ ছবির লিংক ও রেফারেন্স লোড হয়েছে ✓", "info");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      showToast("ছবির লিংক (Cloudinary/Image URL) দিন।", "error");
      return;
    }
    if (!formData.caption.trim()) {
      showToast("ছবির একটি চেনার সুবিধার শিরোনাম/রেফারেন্স দিন।", "error");
      return;
    }

    setSaving(true);
    if (editingPhoto) {
      const res = await updateClassroomPhoto(editingPhoto.id, formData);
      setSaving(false);
      if (res.ok && res.photo) {
        setPhotos((prev) => prev.map((p) => (p.id === editingPhoto.id ? res.photo! : p)));
        showToast("ছবির তথ্য সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createClassroomPhoto(formData);
      setSaving(false);
      if (res.ok && res.photo) {
        setPhotos((prev) => [res.photo!, ...prev]);
        showToast("নতুন ক্লাসরুম ছবি যুক্ত হয়েছে!", "success");
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
        subtitle="মেইন ওয়েবসাইটের ক্লাসরুম মোমেন্টস সেকশনে প্রদর্শিত ছবি পরিচালনা করুন"
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন ছবি যোগ করুন</span>
          </PrimaryButton>
        }
      />

      {/* 💡 ১৬:৯ ও ২-স্প্লিট লেআউট সাইজিং গাইডলাইন ব্যানার */}
      <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-sky-200 bg-sky-50/80 p-4 shadow-sh1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white text-base">
          🖼️
        </span>
        <div className="font-body text-xs sm:text-[13px] text-sky-950 leading-relaxed">
          <p className="font-bold text-sky-900">মেইন ওয়েবসাইটের গ্যালারি সাইজিং নিয়ম:</p>
          <p className="mt-0.5 text-sky-800/90">
            মেইন ওয়েবসাইটে প্রতি ৩টি ছবি একটি গ্রুপ হিসেবে দেখায়—গ্রুপের ১ম ছবিটি ওপরে <b>১৬:৯ (1200×675 px)</b> সাইজে এবং পরের ২টি ছবি নিচে সমান ভাগে স্প্লিট আকারে থাকে। ওয়েবসাইটে কোনো টেক্সট ক্যাপশন দেখাবে না, ক্যাপশনটি শুধু আপনার চেনার সুবিধার জন্য।
          </p>
        </div>
      </div>

      {/* সার্চ ও পরিসংখ্যান বার */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between overflow-hidden rounded-[22px] border border-border-base/80 bg-white p-4 shadow-sh1 backdrop-blur-xl">
        <div className="flex items-center gap-2 font-body text-[13.5px] font-bold text-sky-950">
          <span>📸 মোট ক্লাসরুম ছবি:</span>
          <span className="rounded-lg bg-sky-100 px-2.5 py-0.5 font-black text-sky-800">
            {toBengaliDigits(photos.length)}টি
          </span>
        </div>

        <div className="relative min-w-[240px]">
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
            placeholder="রেফারেন্স শিরোনাম দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[38px] w-full rounded-full border border-border-base/80 bg-surface-muted/60 pl-10 pr-4 font-body text-[12.5px] text-ink-800 placeholder:text-muted/70 outline-none focus:border-sky-600 focus:bg-white"
          />
        </div>
      </div>

      {/* 🎯 ফটো গ্রিড */}
      {filteredPhotos.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো ক্লাসরুম ছবি পাওয়া যায়নি"
            hint="Cloudinary লিংক ব্যবহার করে ক্লাসরুমের নতুন ছবি যুক্ত করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              className="hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border border-border-base/90 bg-white p-3.5 shadow-sh1 transition-all duration-brand hover:shadow-sh2"
            >
              <div>
                {/* ইমেজ ফ্রেম */}
                <div
                  onClick={() => setPreviewPhoto(photo)}
                  className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-surface-muted border border-border-base/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.image_url}
                    alt={photo.caption}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80";
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

                {/* অভ্যন্তরীণ রেফারেন্স শিরোনাম */}
                <p className="mt-3 font-body text-[13px] font-bold leading-snug text-sky-950 line-clamp-2">
                  {photo.caption}
                </p>
              </div>

              {/* কার্ড ফুটার */}
              <div className="mt-3.5 flex items-center justify-between border-t border-border-base/60 pt-2.5">
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
          ))}
        </div>
      )}

      {/* নতুন ছবি যুক্ত / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPhoto ? "ছবির রেফারেন্স ও লিংক সম্পাদনা" : "নতুন ক্লাসরুম ছবি যুক্ত করুন"}
        description="১৬:৯ বা ল্যান্ডস্কেপ সাইজের Cloudinary ইমেজ লিংক ও আপনার চেনার সুবিধার রেফারেন্স নাম দিন।"
      >
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">নমুনা ক্লাসরুম ছবি</p>
              <p className="font-body text-[10.5px] text-sky-800">ডেমো লিংক ও ১৬:৯ ছবি লোড করুন</p>
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
              <p className="mb-1 text-[11px] font-bold text-muted">লাইভ ১৬:৯ ফ্রেম প্রিভিউ:</p>
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

          <Field label="ছবির অভ্যন্তরীণ শিরোনাম / রেফারেন্স নাম *" required>
            <TextInput
              required
              placeholder="যেমন: ক্লাসরুম লেকচার মুহূর্ত ০১"
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
              {saving ? "সংরক্ষণ হচ্ছে..." : editingPhoto ? "হালনাগাদ করুন" : "✓ ছবি যুক্ত করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* 👁️ ফুলস্ক্রিন প্রিভিউ মোডাল (লাইটবক্স) */}
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
              alt={previewPhoto.caption}
              className="w-full max-h-[460px] rounded-2xl aspect-video object-cover border border-border-base shadow-sm"
            />
            <p className="font-body text-[13.5px] font-bold text-sky-950">
              রেফারেন্স: {previewPhoto.caption}
            </p>
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
