"use client";

import { useState } from "react";
import type { TeacherPhoto } from "@/lib/types";
import {
  createTeacherPhoto,
  updateTeacherPhoto,
  reorderTeacherPhotos,
  deleteTeacherPhoto,
} from "@/app/actions/teacher-photos";
import { useToast } from "@/components/admin/Toast";
import Modal from "@/components/admin/Modal";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Field,
  TextInput,
} from "@/components/admin/ui";
import { toBengaliDigits } from "@/lib/bengaliNumerals";

export default function TeacherPhotosClient({
  initialPhotos,
}: {
  initialPhotos: TeacherPhoto[];
}) {
  const { show: showToast } = useToast();

  const [photos, setPhotos] = useState<TeacherPhoto[]>(initialPhotos);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherPhoto | null>(null);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TeacherPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);

  function openAdd() {
    setEditing(null);
    setUrl("");
    setModalOpen(true);
  }

  function openEdit(photo: TeacherPhoto) {
    setEditing(photo);
    setUrl(photo.image_url);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      showToast("ছবির লিংক দিন।", "error");
      return;
    }
    setSaving(true);
    if (editing) {
      const res = await updateTeacherPhoto(editing.id, url);
      setSaving(false);
      if (res.ok && res.photo) {
        setPhotos((prev) => prev.map((p) => (p.id === editing.id ? res.photo! : p)));
        showToast("ছবির লিংক আপডেট হয়েছে ✓", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createTeacherPhoto(url);
      setSaving(false);
      if (res.ok && res.photo) {
        setPhotos((prev) => [...prev, res.photo!]);
        showToast("নতুন ছবি যুক্ত হয়েছে। ১ মিনিটের মধ্যে ওয়েবসাইটে দেখা যাবে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "ছবি যুক্ত করা যায়নি।", "error");
      }
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= photos.length || moving) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = photos;
    setPhotos(next);
    setMoving(true);
    const res = await reorderTeacherPhotos(next.map((p) => p.id));
    setMoving(false);
    if (!res.ok) {
      setPhotos(previous);
      showToast(res.message || "ক্রম পরিবর্তন করা যায়নি।", "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteTeacherPhoto(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast("ছবি মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="শিক্ষকের ছবি স্লাইডার"
        subtitle="শিক্ষক পরিচিতি সেকশনের ছবি — মোবাইলে সোয়াইপ, ডেস্কটপে তীর বাটন"
        action={<PrimaryButton onClick={openAdd}>+ নতুন ছবি যুক্ত করুন</PrimaryButton>}
      />

      {/* 📐 সাইজ নির্দেশিকা */}
      <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-sky-200 bg-sky-50/80 p-4 shadow-sh1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-base text-white">
          📐
        </span>
        <div className="font-body text-xs leading-relaxed text-sky-950 sm:text-[13px]">
          <p className="font-bold text-sky-900">সঠিক ছবির সাইজ (পারফেক্ট ফিটের জন্য):</p>
          <p className="mt-0.5 text-sky-800/90">
            অনুপাত <b>৪:৫ (পোর্ট্রেট)</b>, আদর্শ সাইজ <b>১০৮০ × ১৩৫০ px</b> (সর্বনিম্ন ৮০০ × ১০০০ px)।
            ছবি ওয়েবসাইটে এই ফ্রেমে বসে, তাই মুখ ছবির <b>ওপরের অর্ধেকে</b> রাখুন, নইলে নিচের দিক
            সামান্য কেটে যেতে পারে। Cloudinary লিংক সবচেয়ে ভালো (অটো ছোট ও দ্রুত হয়), তবে যেকোনো{" "}
            <b>https</b> ছবির লিংক কাজ করবে।
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 font-body text-[13.5px] font-bold text-sky-950">
        <span>স্লাইডে মোট ছবি:</span>
        <span className="rounded-lg bg-sky-100 px-2.5 py-0.5 font-black text-sky-800">
          {toBengaliDigits(photos.length + 1)}টি
        </span>
        <span className="font-medium text-muted">(১টি স্থায়ী + {toBengaliDigits(photos.length)}টি অ্যাডমিন থেকে)</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* 🔒 প্রথম স্থায়ী ছবি (কোডে বসানো, এখান থেকে মোছা যায় না) */}
        <div className="flex flex-col overflow-hidden rounded-[22px] border border-sky-300 bg-sky-50/60 p-2.5 shadow-sh1">
          <div className="relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-sky-400 bg-white text-center">
            <span className="text-2xl">🔒</span>
            <span className="px-2 font-body text-[12px] font-black text-sky-950">প্রথম ছবি (স্থায়ী)</span>
            <span className="px-3 font-body text-[10.5px] leading-snug text-muted">
              এটি ওয়েবসাইটের কোডে বসানো, এখান থেকে মোছা বা বদলানো যায় না
            </span>
            <span className="absolute left-2 top-2 rounded-md bg-sky-600/90 px-2 py-0.5 font-body text-[10.5px] font-black text-white">
              ১
            </span>
          </div>
        </div>

        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="flex flex-col overflow-hidden rounded-[22px] border border-border-base/90 bg-white p-2.5 shadow-sh1"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.image_url}
                alt={`শিক্ষকের ছবি ${i + 2}`}
                className="h-full w-full object-cover object-[50%_25%]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.2";
                }}
              />
              <span className="absolute left-2 top-2 rounded-md bg-slate-800/80 px-2 py-0.5 font-body text-[10.5px] font-black text-white">
                {toBengaliDigits(i + 2)}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || moving}
                  title="আগে সরান"
                  aria-label="আগে সরান"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1 || moving}
                  title="পরে সরান"
                  aria-label="পরে সরান"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 disabled:opacity-30"
                >
                  →
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(photo)}
                  title="লিংক বদলান"
                  aria-label="লিংক বদলান"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(photo)}
                  title="মুছে ফেলুন"
                  aria-label="মুছে ফেলুন"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 text-danger transition-colors hover:bg-rose-100"
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

      {photos.length === 0 && (
        <p className="mt-4 font-body text-[12.5px] text-muted">
          এখনো কোনো অতিরিক্ত ছবি নেই। এখন ওয়েবসাইটে শুধু প্রথম ছবি দেখাচ্ছে, স্লাইডার বাটন আসবে
          দ্বিতীয় ছবি যুক্ত করলে।
        </p>
      )}

      {/* যুক্ত / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "ছবির লিংক বদলান" : "নতুন ছবি যুক্ত করুন"}
        description="ছবির লিংক পেস্ট করুন, প্রিভিউ দেখে সংরক্ষণ করুন।"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="ছবির লিংক (https://...) *" required>
            <TextInput
              type="url"
              required
              placeholder="https://res.cloudinary.com/... বা ছবির লিংক পেস্ট করুন"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>

          {url.trim() && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-xs">
              <p className="mb-2 font-body text-[11.5px] font-bold text-slate-800">
                ওয়েবসাইটে ঠিক যেমন দেখাবে (৪:৫ ফ্রেম):
              </p>
              <div className="mx-auto aspect-[4/5] max-w-[200px] overflow-hidden rounded-xl border border-sky-300 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url.trim()}
                  alt="প্রিভিউ"
                  className="h-full w-full object-cover object-[50%_25%]"
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editing ? "আপডেট করুন" : "✓ ছবি যুক্ত করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ডিলিট কনফার্মেশন */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="ছবি মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <p className="font-body text-[13.5px] text-ink-800">
            এই ছবিটি স্লাইডার থেকে মুছে যাবে। (প্রথম স্থায়ী ছবি এতে প্রভাবিত হবে না।)
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
