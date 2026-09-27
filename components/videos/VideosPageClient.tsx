"use client";

import { useMemo, useState } from "react";
import type { VideoLecture } from "@/lib/types";
import {
  createVideoLecture,
  updateVideoLecture,
  deleteVideoLecture,
  fetchLiveThumbnailAction,
  type VideoLectureInput,
} from "@/app/actions/videos";
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

const EMPTY_FORM: VideoLectureInput = {
  title: "",
  video_url: "",
  thumbnail_url: "",
  sort_order: 0,
};

// 🎯 উদাহরণ টেমপ্লেট
const EXAMPLE_VIDEO_TEMPLATE: VideoLectureInput = {
  title: "HSC English 1st Paper সম্পূর্ণ সিলেবাস ও প্রস্তুতি গাইডলাইন",
  video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  thumbnail_url: "",
  sort_order: 1,
};

function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function isFacebookUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("facebook.com") || url.includes("fb.watch");
}

export default function VideosPageClient({
  initialVideos,
}: {
  initialVideos: VideoLecture[];
}) {
  const { show: showToast } = useToast();

  const [videos, setVideos] = useState<VideoLecture[]>(initialVideos);
  const [search, setSearch] = useState("");

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLecture | null>(null);
  const [formData, setFormData] = useState<VideoLectureInput>(EMPTY_FORM);
  const [detectedThumb, setDetectedThumb] = useState<string | null>(null);
  const [fetchingThumb, setFetchingThumb] = useState(false);
  const [saving, setSaving] = useState(false);

  // লাইভ প্লেয়ার মোডাল
  const [activePlayVideo, setActivePlayVideo] = useState<VideoLecture | null>(null);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<VideoLecture | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ফিল্টার করা ভিডিও তালিকা
  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter(
      (v) => !q || v.title.toLowerCase().includes(q) || v.video_url.toLowerCase().includes(q)
    );
  }, [videos, search]);

  function openAddModal() {
    setEditingVideo(null);
    setFormData(EMPTY_FORM);
    setDetectedThumb(null);
    setModalOpen(true);
  }

  function openEditModal(video: VideoLecture) {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || "",
      sort_order: video.sort_order,
    });
    setDetectedThumb(video.thumbnail_url || null);
    setModalOpen(true);
  }

  function handleLoadExample() {
    setFormData(EXAMPLE_VIDEO_TEMPLATE);
    setDetectedThumb("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    showToast("উদাহরণ ভিডিও লিংক লোড হয়েছে ✓", "info");
  }

  // ⚡ ভিডিও লিংক ইনপুট হওয়া মাত্রই লাইভ অটো-থাম্বনেইল সনাক্তকরণ
  async function handleUrlBlur(url: string) {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setFetchingThumb(true);
    try {
      const res = await fetchLiveThumbnailAction(cleanUrl);
      if (res.thumbnailUrl) {
        setDetectedThumb(res.thumbnailUrl);
        setFormData((prev) => ({ ...prev, thumbnail_url: res.thumbnailUrl }));
      }
    } catch {
      // fallback
    } finally {
      setFetchingThumb(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("ভিডিওর শিরোনাম দিন।", "error");
      return;
    }
    if (!formData.video_url.trim()) {
      showToast("ভিডিওর লিংক দিন।", "error");
      return;
    }

    setSaving(true);
    if (editingVideo) {
      const res = await updateVideoLecture(editingVideo.id, formData);
      setSaving(false);
      if (res.ok && res.video) {
        setVideos((prev) => prev.map((v) => (v.id === editingVideo.id ? res.video! : v)));
        showToast("ভিডিও লেকচার সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createVideoLecture(formData);
      setSaving(false);
      if (res.ok && res.video) {
        setVideos((prev) => [res.video!, ...prev]);
        showToast("নতুন ভিডিও সফলভাবে যুক্ত হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "ভিডিও সংরক্ষণ করা যায়নি।", "error");
      }
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteVideoLecture(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      showToast("ভিডিও মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="ভিডিও লেকচার ব্যবস্থাপনা"
        subtitle="ইউটিউব বা ফেসবুক ভিডিও লিংক যুক্ত করুন — সিস্টেম স্বয়ংক্রিয়ভাবে আসল থাম্বনেইল সনাক্ত করবে"
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন ভিডিও যোগ করুন</span>
          </PrimaryButton>
        }
      />

      {/* ওভারভিউ কার্ড ও সার্চ */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between overflow-hidden rounded-[22px] border border-border-base/80 bg-white p-4 shadow-sh1 backdrop-blur-xl">
        <div className="flex items-center gap-2 font-body text-[13.5px] font-bold text-sky-950">
          <span>🎬 মোট ভিডিও লেকচার:</span>
          <span className="rounded-lg bg-sky-100 px-2.5 py-0.5 font-black text-sky-800">
            {toBengaliDigits(videos.length)}টি
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
            placeholder="ভিডিও শিরোনাম বা লিংক দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[38px] w-full rounded-full border border-border-base/80 bg-surface-muted/60 pl-10 pr-4 font-body text-[12.5px] text-ink-800 placeholder:text-muted/70 outline-none focus:border-sky-600 focus:bg-white"
          />
        </div>
      </div>

      {/* 🎯 ভিডিও কার্ড গ্রিড */}
      {filteredVideos.length === 0 ? (
        <div className="rounded-[24px] border border-border-base/80 bg-white p-8 shadow-sh1">
          <EmptyState
            title="কোনো ভিডিও লেকচার পাওয়া যায়নি"
            hint="ইউটিউব বা ফেসবুক ভিডিওর লিংক যুক্ত করুন।"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => {
            const isFb = isFacebookUrl(video.video_url);
            const ytId = parseYouTubeId(video.video_url);

            // আসল থাম্বনেইল নির্ণয় (কোনো ডামি বইয়ের ছবি ছাড়া)
            const thumbSrc =
              video.thumbnail_url ||
              (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

            return (
              <div
                key={video.id}
                className="hover-lift flex flex-col justify-between overflow-hidden rounded-[24px] border border-border-base/90 bg-white p-3.5 shadow-sh1 transition-all duration-brand hover:shadow-sh2"
              >
                <div>
                  {/* থাম্বনেইল ফ্রেম */}
                  <div
                    onClick={() => setActivePlayVideo(video)}
                    className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-sky-950 border border-border-base/60 flex items-center justify-center"
                  >
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbSrc}
                        alt={video.title}
                        className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-3xl">{isFb ? "📘" : "🎬"}</span>
                        <p className="mt-1 font-body text-xs font-bold text-sky-200">{isFb ? "Facebook Video" : "Video Lecture"}</p>
                      </div>
                    )}

                    {/* প্ল্যাটফর্ম ব্যাজ */}
                    <span className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 font-body text-[10px] font-bold text-white backdrop-blur-sm">
                      {isFb ? "📘 Facebook" : "📺 YouTube"}
                    </span>

                    {/* প্লে বাটন */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-110 ${
                        isFb ? "bg-blue-600" : "bg-red-600"
                      }`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* ভিডিওর শিরোনাম */}
                  <h3 className="mt-3 font-body text-[14px] font-black leading-snug text-sky-950 line-clamp-2">
                    {video.title}
                  </h3>
                </div>

                {/* কার্ড ফুটার */}
                <div className="mt-3 flex items-center justify-between border-t border-border-base/60 pt-2.5">
                  <span className="font-body text-[11px] font-medium text-muted">
                    {formatBengaliDate(video.created_at.slice(0, 10))}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(video)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                      title="সম্পাদনা"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(video)}
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

      {/* নতুন ভিডিও যুক্ত / এডিট মোডাল (স্মার্ট অটো-থাম্বনেইল সহ) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVideo ? "ভিডিও লেকচার সম্পাদনা" : "নতুন ভিডিও লেকচার যুক্ত করুন"}
        description="ইউটিউব বা ফেসবুক ভিডিওর লিংক পেস্ট করুন — আসল থাম্বনেইল স্বয়ংক্রিয়ভাবে লোড হবে।"
      >
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">স্মার্ট থাম্বনেইল ডিটেক্টর</p>
              <p className="font-body text-[10.5px] text-sky-800">লিংক দিলে স্বয়ংক্রিয়ভাবে কাভার ফটো সনাক্ত হয়</p>
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
          {/* ভিডিও লিংক */}
          <Field label="ভিডিও লিংক (YouTube / Facebook URL) *" required>
            <TextInput
              type="url"
              required
              placeholder="https://www.youtube.com/... বা https://www.facebook.com/.../videos/..."
              value={formData.video_url}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, video_url: val });
              }}
              onBlur={(e) => handleUrlBlur(e.target.value)}
            />
          </Field>

          {/* 🖼️ লাইভ সনাক্তকৃত আসল থাম্বনেইল প্রিভিউয়ার */}
          {fetchingThumb && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-center animate-pulse">
              <p className="font-body text-xs font-bold text-sky-800">ভিডিওর আসল থাম্বনেইল স্ক্যান হচ্ছে...</p>
            </div>
          )}

          {detectedThumb && !fetchingThumb && (
            <div className="overflow-hidden rounded-xl border border-border-base bg-slate-900 p-2 text-center">
              <div className="flex items-center justify-between px-1 pb-1.5 text-left">
                <span className="font-body text-[11px] font-bold text-emerald-400">✓ আসল থাম্বনেইল সনাক্ত হয়েছে</span>
                <span className="font-body text-[10px] text-slate-400">স্বয়ংক্রিয়ভাবে সেভ হবে</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detectedThumb}
                alt="Detected Video Thumbnail"
                className="mx-auto max-h-40 rounded-lg aspect-video object-cover shadow-2xs"
                onError={() => setDetectedThumb(null)}
              />
            </div>
          )}

          {/* ভিডিওর শিরোনাম */}
          <Field label="ভিডিওর শিরোনাম *" required>
            <TextInput
              required
              placeholder="যেমন: HSC English: 1st Paper সম্পূর্ণ সিলেবাস ও প্রস্তুতি"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingVideo ? "হালনাগাদ করুন" : "✓ ভিডিও যুক্ত করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ▶️ লাইভ ভিডিও প্লেয়ার মোডাল */}
      <Modal
        open={!!activePlayVideo}
        onClose={() => setActivePlayVideo(null)}
        title={activePlayVideo?.title || "ভিডিও প্লেয়ার"}
        maxWidth="max-w-3xl"
      >
        {activePlayVideo && (
          <div className="space-y-3">
            {(() => {
              const ytId = parseYouTubeId(activePlayVideo.video_url);
              if (ytId) {
                return (
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-border-base shadow-sm">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                      title={activePlayVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full border-0"
                    />
                  </div>
                );
              }
              return (
                <div className="rounded-2xl bg-sky-950 p-8 text-center text-white">
                  <span className="text-4xl">📘</span>
                  <h4 className="mt-2 font-body text-base font-bold">Facebook Video Link</h4>
                  <p className="mt-1 font-body text-xs text-sky-200">ফেসবুক ভিডিওটি সরাসরি দেখতে নিচের বাটনে ক্লিক করুন</p>
                  <a
                    href={activePlayVideo.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 font-body text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
                  >
                    <span>Facebook-এ ভিডিওটি দেখুন</span>
                    <span>↗</span>
                  </a>
                </div>
              );
            })()}

            <div className="flex justify-end border-t border-border-base/60 pt-3">
              <SecondaryButton type="button" onClick={() => setActivePlayVideo(null)}>
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
        title="ভিডিও লেকচার মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">&quot;{deleteTarget?.title}&quot;</b> ভিডিওটি মুছে ফেলতে চান?
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
