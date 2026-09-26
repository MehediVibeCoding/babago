"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Payment, Student, Batch, PaymentMethod } from "@/lib/types";
import {
  recordPayment,
  recordNewStudentAndPayment,
  updatePayment,
  deletePayment,
  type QuickStudentAndPaymentInput,
} from "@/app/actions/payments";
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
import { formatTaka, dueMonthsForStudent } from "@/lib/utils";
import { toBengaliDigits, formatBengaliDate, BENGALI_MONTHS } from "@/lib/bengaliNumerals";

// বিগত ৬ মাস ও আগামী ৪ মাসের ড্রপডাউন
function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -6; i <= 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const label = `${BENGALI_MONTHS[d.getMonth()]} ${toBengaliDigits(d.getFullYear())}`;
    options.push({ value, label });
  }
  return options;
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function PaymentsPageClient({
  initialPayments,
  students,
  batches,
}: {
  initialPayments: Payment[];
  students: Student[];
  batches: Batch[];
}) {
  const searchParams = useSearchParams();
  const { show: showToast } = useToast();

  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [allStudents, setAllStudents] = useState<Student[]>(students);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [dueFilter, setDueFilter] = useState(false);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // 🚀 ১. সরাসরি শিক্ষার্থী রো থেকে `+ বেতন` নেওয়ার মোডাল স্টেট
  const [quickPayStudent, setQuickPayStudent] = useState<Student | null>(null);
  const [quickPayForm, setQuickPayForm] = useState({
    amount: 1200,
    method: "cash" as PaymentMethod,
    for_month: getCurrentMonthValue(),
    note: "অফিসে সরাসরি জমা",
  });
  const [recordingQuickPay, setRecordingQuickPay] = useState(false);

  // 📋 ২. শিক্ষার্থীর সকল রসিদ হিস্ট্রি দেখার মোডাল স্টেট
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  // ✨ ৩. নতুন ভর্তি + পেমেন্ট মোডাল স্টেট (টপ বাটন)
  const [newStudentModalOpen, setNewStudentModalOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState<QuickStudentAndPaymentInput>({
    full_name: "",
    phone: "",
    college: "চৌদ্দগ্রাম সরকারি কলেজ",
    college_roll: "",
    group_name: "বিজ্ঞান বিভাগ",
    batch_id: batches[0]?.id || "",
    batch_name_snapshot: batches[0]?.name || "",
    amount: 1200,
    method: "cash",
    for_month: getCurrentMonthValue(),
    note: "ভর্তিকালীন প্রথম মাসের বেতন",
  });
  const [savingNewStudent, setSavingNewStudent] = useState(false);

  // রসিদ এডিট ও ডিলিট স্টেট
  const [editingReceipt, setEditingReceipt] = useState<Payment | null>(null);
  const [editReceiptForm, setEditReceiptForm] = useState({
    amount: 0,
    method: "cash" as PaymentMethod,
    for_month: getCurrentMonthValue(),
    note: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteReceiptTarget, setDeleteReceiptTarget] = useState<Payment | null>(null);
  const [deletingReceipt, setDeletingReceipt] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setNewStudentModalOpen(true);
    }
  }, [searchParams]);

  // শিক্ষার্থী অনুযায়ী পেমেন্ট গ্রুপ করা
  const studentPaymentsMap = useMemo(() => {
    const map = new Map<string, Payment[]>();
    payments.forEach((p) => {
      const list = map.get(p.student_id) || [];
      list.push(p);
      map.set(p.student_id, list);
    });
    // প্রতিটি শিক্ষার্থীর পেমেন্ট মাসের ক্রমানুসারে সাজানো
    map.forEach((list) => {
      list.sort((a, b) => a.for_month.localeCompare(b.for_month));
    });
    return map;
  }, [payments]);

  // ফিল্টার করা একক শিক্ষার্থীর তালিকা (Student Ledger)
  const studentLedgerList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allStudents.filter((s) => {
      const matchSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.college.toLowerCase().includes(q) ||
        s.college_roll.toLowerCase().includes(q);

      const matchBatch = batchFilter === "all" || s.batch_id === batchFilter;
      const dueMonths = dueMonthsForStudent(s, payments);
      const matchDue = !dueFilter || dueMonths > 0;

      return matchSearch && matchBatch && matchDue;
    });
  }, [allStudents, search, batchFilter, dueFilter, payments]);

  // সামগ্রিক কালেকশন পরিসংখ্যান
  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const cashTotal = payments.filter((p) => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
    const onlineTotal = payments.filter((p) => p.method === "online").reduce((sum, p) => sum + p.amount, 0);
    return { total, cashTotal, onlineTotal, count: payments.length };
  }, [payments]);

  // 🚀 ১-ক্লিকে নির্দিষ্ট শিক্ষার্থীর পরবর্তী মাসের বেতন মোডাল ওপেন
  function openQuickPayModal(student: Student) {
    setQuickPayStudent(student);

    const studentPays = studentPaymentsMap.get(student.id) || [];
    let nextMonth = getCurrentMonthValue();

    if (studentPays.length > 0) {
      // শেষ যে মাসের বেতন পরিশোধ করা হয়েছে তার ঠিক পরের মাস সিলেক্ট করা
      const lastMonthDate = new Date(studentPays[studentPays.length - 1].for_month);
      const nextDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 1);
      nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-01`;
    }

    let defaultAmount = 1200;
    if (student.batch_name_snapshot?.includes("Combine")) defaultAmount = 2000;

    setQuickPayForm({
      amount: defaultAmount,
      method: "cash",
      for_month: nextMonth,
      note: "অফিসে সরাসরি জমা",
    });
  }

  // দ্রুত বেতন সাবমিট করা
  async function handleQuickPaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickPayStudent) return;
    if (!quickPayForm.amount || quickPayForm.amount <= 0) {
      showToast("সঠিক টাকার পরিমাণ দিন।", "error");
      return;
    }

    setRecordingQuickPay(true);
    const res = await recordPayment({
      student_id: quickPayStudent.id,
      amount: quickPayForm.amount,
      method: quickPayForm.method,
      for_month: quickPayForm.for_month,
      note: quickPayForm.note,
    });
    setRecordingQuickPay(false);

    if (res.ok && res.payment) {
      setPayments((prev) => [res.payment!, ...prev]);
      showToast(`${quickPayStudent.full_name}-এর নতুন মাসের বেতন জমা হয়েছে!`, "success");
      setQuickPayStudent(null);
    } else {
      showToast(res.message || "বেতন জমা করা যায়নি।", "error");
    }
  }

  // নতুন শিক্ষার্থী ভর্তি + পেমেন্ট
  async function handleNewStudentAndPaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newStudentForm.full_name.trim() || !newStudentForm.phone.trim()) {
      showToast("শিক্ষার্থীর নাম ও মোবাইল নম্বর দিন।", "error");
      return;
    }

    setSavingNewStudent(true);
    const res = await recordNewStudentAndPayment(newStudentForm);
    setSavingNewStudent(false);

    if (res.ok && res.payment) {
      setPayments((prev) => [res.payment!, ...prev]);
      showToast("নতুন শিক্ষার্থী ভর্তি ও বেতন গ্রহণ সফল হয়েছে!", "success");
      setNewStudentModalOpen(false);
      setNewStudentForm((prev) => ({ ...prev, full_name: "", phone: "", note: "" }));
    } else {
      showToast(res.message || "ভর্তি ও পেমেন্ট সম্পন্ন করা যায়নি।", "error");
    }
  }

  // রসিদ এডিট ওপেন
  function openEditReceipt(p: Payment) {
    setEditingReceipt(p);
    setEditReceiptForm({
      amount: p.amount,
      method: p.method,
      for_month: p.for_month,
      note: p.note || "",
    });
  }

  async function handleEditReceiptSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingReceipt) return;
    setSavingEdit(true);
    const res = await updatePayment(editingReceipt.id, editReceiptForm);
    setSavingEdit(false);
    if (res.ok && res.payment) {
      setPayments((prev) => prev.map((x) => (x.id === editingReceipt.id ? res.payment! : x)));
      showToast("রসিদ হালনাগাদ হয়েছে।", "success");
      setEditingReceipt(null);
    } else {
      showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
    }
  }

  async function handleDeleteReceiptConfirm() {
    if (!deleteReceiptTarget) return;
    setDeletingReceipt(true);
    const res = await deletePayment(deleteReceiptTarget.id);
    setDeletingReceipt(false);
    if (res.ok) {
      setPayments((prev) => prev.filter((x) => x.id !== deleteReceiptTarget.id));
      showToast("রসিদ মুছে ফেলা হয়েছে।", "success");
      setDeleteReceiptTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="বেতন ও পেমেন্ট লেজার"
        subtitle={`শিক্ষার্থীদের মাসিক বেতন ট্র্যাকিং ও অফলাইন/অনলাইন কালেকশন`}
        action={
          <PrimaryButton onClick={() => setNewStudentModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন ভর্তি ও পেমেন্ট গ্রহণ</span>
          </PrimaryButton>
        }
      />

      {/* কালেকশন ওভারভিউ কার্ডস */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EBF5FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-700">সর্বমোট কালেকশন</p>
          <p className="mt-1 font-body text-[20px] font-black text-sky-950 sm:text-[22px]">{formatTaka(stats.total)}</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">মোট {toBengaliDigits(stats.count)}টি রসিদ</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#ECFDF5] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-success">নগদ / ক্যাশ জমা</p>
          <p className="mt-1 font-body text-[20px] font-black text-emerald-900 sm:text-[22px]">{formatTaka(stats.cashTotal)}</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">অফিসে সরাসরি গৃহীত</span>
        </div>

        <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-[#EEF2FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">অনলাইন পেমেন্ট</p>
          <p className="mt-1 font-body text-[20px] font-black text-indigo-950 sm:text-[22px]">{formatTaka(stats.onlineTotal)}</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">bKash / অনলাইন গেটওয়ে</span>
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#FFFBEB] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-warn">নিবন্ধিত শিক্ষার্থী</p>
          <p className="mt-1 font-body text-[20px] font-black text-amber-950 sm:text-[22px]">{toBengaliDigits(allStudents.length)} জন</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">চলমান সকল ব্যাচে</span>
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
              placeholder="শিক্ষার্থীর নাম, রোল, কলেজ অথবা মোবাইল নম্বর দিয়ে খুঁজুন..."
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
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="h-[38px] max-w-[190px] truncate rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল ব্যাচের শিক্ষার্থী</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setDueFilter((v) => !v)}
              className={`flex h-[38px] items-center gap-1.5 rounded-xl border px-3.5 font-body text-[12px] font-bold transition-all ${
                dueFilter
                  ? "border-amber-400 bg-amber-50 text-amber-800 shadow-xs"
                  : "border-border-base/80 bg-white text-ink-800 hover:bg-surface-muted"
              }`}
            >
              <span>⚠️ শুধু বকেয়া আছে</span>
              {dueFilter && <span className="text-xs">✓</span>}
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 শিক্ষার্থীকেন্দ্রিক একক লেজার টেবিল (Student Ledger Table) */}
      <div className="overflow-hidden rounded-[24px] border border-border-base/80 bg-white shadow-sh2">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-border-base bg-[#F8FAFC] font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="py-3.5 pl-4 pr-3">শিক্ষার্থী ও ব্যাচ</th>
                <th className="p-3.5">পরিশোধিত মাসসমূহ (হিস্ট্রি)</th>
                <th className="p-3.5">মোট প্রদত্ত ফি</th>
                <th className="p-3.5">বকেয়া অবস্থা</th>
                <th className="p-3.5">সর্বশেষ জমার মাধ্যম ও তারিখ</th>
                <th className="p-3.5 pr-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {studentLedgerList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      title="কোনো শিক্ষার্থী পাওয়া যায়নি"
                      hint="সার্চ পরিবর্তন করুন অথবা নতুন শিক্ষার্থী ভর্তি করিয়ে বেতন গ্রহণ করুন।"
                    />
                  </td>
                </tr>
              ) : (
                studentLedgerList.map((s) => {
                  const studentPays = studentPaymentsMap.get(s.id) || [];
                  const totalPaid = studentPays.reduce((sum, p) => sum + p.amount, 0);
                  const dueMonths = dueMonthsForStudent(s, payments);
                  const lastPayment = studentPays[studentPays.length - 1];

                  return (
                    <tr
                      key={s.id}
                      className="transition-colors odd:bg-white even:bg-[#F8FAFC]/70 hover:bg-sky-50/40"
                    >
                      {/* ১. শিক্ষার্থী ও ব্যাচ */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 font-body text-[13px] font-black text-white shadow-xs">
                            {s.full_name.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-body text-[13.5px] font-black text-sky-950">
                              {s.full_name}
                            </p>
                            <p className="font-body text-[11px] font-semibold text-sky-800">
                              {s.batch_name_snapshot || "ব্যাচ নির্ধারিত নেই"} · {s.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ২. পরিশোধিত মাসসমূহ (ব্যাজ আকারে) */}
                      <td className="p-3.5 max-w-[280px]">
                        {studentPays.length === 0 ? (
                          <span className="font-body text-[11.5px] text-muted">এখনো কোনো ফি জমা হয়নি</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-[64px] overflow-y-auto sleek-scrollbar">
                            {studentPays.map((p) => {
                              const mDate = new Date(p.for_month);
                              const label = !isNaN(mDate.getTime())
                                ? `${BENGALI_MONTHS[mDate.getMonth()]} '${toBengaliDigits(mDate.getFullYear()).slice(-2)}`
                                : p.for_month;
                              return (
                                <span
                                  key={p.id}
                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-body text-[10.5px] font-bold text-emerald-800"
                                  title={`${formatBengaliDate(p.created_at.slice(0, 10))} তারিখে ${formatTaka(p.amount)} (${p.method === "cash" ? "নগদ" : "অনলাইন"})`}
                                >
                                  <span>✓ {label}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* ৩. মোট প্রদত্ত ফি (রো-তেই বাড়বে) */}
                      <td className="whitespace-nowrap p-3.5 font-black text-[15px] text-emerald-800">
                        {formatTaka(totalPaid)}
                      </td>

                      {/* ৪. বকেয়া অবস্থা */}
                      <td className="whitespace-nowrap p-3.5">
                        {dueMonths > 0 ? (
                          <Badge tone={dueMonths >= 3 ? "danger" : "warn"}>
                            {toBengaliDigits(dueMonths)} মাস বাকি
                          </Badge>
                        ) : (
                          <Badge tone="success">পরিশোধিত ✓</Badge>
                        )}
                      </td>

                      {/* ৫. সর্বশেষ লেনদেন */}
                      <td className="whitespace-nowrap p-3.5 font-body text-[11.5px] text-muted">
                        {lastPayment ? (
                          <>
                            <span className="font-bold text-ink-800">{lastPayment.method === "cash" ? "💵 নগদ" : "🌐 অনলাইন"}</span>
                            <span className="block text-[10.5px]">{formatBengaliDate(lastPayment.created_at.slice(0, 10))}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* ৬. অ্যাকশন কলাম (+ বেতন ও রসিদ হিস্ট্রি) */}
                      <td className="whitespace-nowrap p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 🚀 প্লাস বাটন: পরবর্তী মাসের বেতন জমা */}
                          <button
                            type="button"
                            onClick={() => openQuickPayModal(s)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 font-body text-[11.5px] font-black text-white shadow-xs transition-all hover:brightness-105 active:scale-95"
                            title="পরবর্তী মাসের বেতন জমা নিন"
                          >
                            <span className="text-[13px] leading-none">+</span>
                            <span>বেতন জমা</span>
                          </button>

                          {/* 📋 রসিদ হিস্ট্রি বাটন */}
                          <button
                            type="button"
                            onClick={() => setHistoryStudent(s)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                            title="সকল রসিদ ও হিস্ট্রি দেখুন"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 ১. নির্দিষ্ট শিক্ষার্থীর পরবর্তী মাসের বেতন জমা মোডাল */}
      <Modal
        open={!!quickPayStudent}
        onClose={() => setQuickPayStudent(null)}
        title={`বেতন জমা — ${quickPayStudent?.full_name || ""}`}
        description={`${quickPayStudent?.batch_name_snapshot || ""} · মোবাইল: ${quickPayStudent?.phone || ""}`}
      >
        {quickPayStudent && (
          <form onSubmit={handleQuickPaySubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="যে মাসের বেতন নিচ্ছেন *" required>
                <Select
                  value={quickPayForm.for_month}
                  onChange={(e) => setQuickPayForm({ ...quickPayForm, for_month: e.target.value })}
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="টাকার পরিমাণ (৳) *" required>
                <TextInput
                  type="number"
                  required
                  min={100}
                  step={50}
                  value={quickPayForm.amount}
                  onChange={(e) => setQuickPayForm({ ...quickPayForm, amount: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="পেমেন্টের মাধ্যম *" required>
              <div className="flex gap-4 pt-1">
                <label className="flex cursor-pointer items-center gap-2 font-body text-[13px] font-bold text-ink-800">
                  <input
                    type="radio"
                    name="modal_method"
                    value="cash"
                    checked={quickPayForm.method === "cash"}
                    onChange={() => setQuickPayForm({ ...quickPayForm, method: "cash" })}
                    className="h-4 w-4 text-sky-600 focus:ring-sky-600"
                  />
                  <span>💵 নগদ / ক্যাশ (অফিসে জমা)</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 font-body text-[13px] font-bold text-ink-800">
                  <input
                    type="radio"
                    name="modal_method"
                    value="online"
                    checked={quickPayForm.method === "online"}
                    onChange={() => setQuickPayForm({ ...quickPayForm, method: "online" })}
                    className="h-4 w-4 text-sky-600 focus:ring-sky-600"
                  />
                  <span>🌐 অনলাইন / bKash</span>
                </label>
              </div>
            </Field>

            <Field label="মন্তব্য / নোট (ঐচ্ছিক)">
              <TextInput
                placeholder="যেমন: অফিসে সরাসরি জমা / রসিদ নং"
                value={quickPayForm.note}
                onChange={(e) => setQuickPayForm({ ...quickPayForm, note: e.target.value })}
              />
            </Field>

            <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
              <SecondaryButton type="button" onClick={() => setQuickPayStudent(null)}>
                বাতিল
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={recordingQuickPay}>
                {recordingQuickPay ? "জমা হচ্ছে..." : "✓ বেতন গ্রহণ নিশ্চিত করুন"}
              </PrimaryButton>
            </div>
          </form>
        )}
      </Modal>

      {/* 📋 ২. শিক্ষার্থীর সকল রসিদ ও হিস্ট্রি মোডাল (এডিট/ডিলিট সুবিধা সহ) */}
      <Modal
        open={!!historyStudent}
        onClose={() => setHistoryStudent(null)}
        title={`পেমেন্ট হিস্ট্রি — ${historyStudent?.full_name || ""}`}
        description={`${historyStudent?.batch_name_snapshot || ""} · মোবাইল: ${historyStudent?.phone || ""}`}
        maxWidth="max-w-xl"
      >
        {historyStudent && (
          <div className="space-y-3">
            {(() => {
              const list = studentPaymentsMap.get(historyStudent.id) || [];
              if (list.length === 0) {
                return <p className="py-6 text-center font-body text-[13px] text-muted">এখনো কোনো জমার রেকর্ড নেই।</p>;
              }
              return (
                <div className="space-y-2 max-h-[360px] overflow-y-auto sleek-scrollbar pr-1">
                  {list.map((p) => {
                    const mDate = new Date(p.for_month);
                    const monthName = !isNaN(mDate.getTime())
                      ? `${BENGALI_MONTHS[mDate.getMonth()]} ${toBengaliDigits(mDate.getFullYear())}`
                      : p.for_month;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border-base/70 bg-surface-muted/50 p-3"
                      >
                        <div>
                          <p className="font-body text-[13px] font-bold text-sky-950">{monthName}</p>
                          <p className="font-body text-[11px] text-muted">
                            {formatBengaliDate(p.created_at.slice(0, 10))} · {p.method === "cash" ? "💵 নগদ" : "🌐 অনলাইন"} {p.note ? `· ${p.note}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-body text-[14px] font-black text-emerald-800">{formatTaka(p.amount)}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => openEditReceipt(p)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-base bg-white text-ink-800 hover:border-sky-400 hover:text-sky-700"
                              title="সম্পাদনা"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteReceiptTarget(p)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-danger hover:bg-rose-100"
                              title="মুছুন"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="flex justify-end border-t border-border-base/60 pt-3">
              <SecondaryButton type="button" onClick={() => setHistoryStudent(null)}>
                বন্ধ করুন
              </SecondaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ✨ ৩. নতুন ভর্তি ও পেমেন্ট মোডাল */}
      <Modal
        open={newStudentModalOpen}
        onClose={() => setNewStudentModalOpen(false)}
        title="নতুন ভর্তি ও বেতন গ্রহণ"
        description="নতুন শিক্ষার্থীর তথ্য এন্ট্রি করে সাথে সাথে প্রথম মাসের বেতন জমা করুন।"
      >
        <form onSubmit={handleNewStudentAndPaymentSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="শিক্ষার্থীর পূর্ণ নাম *" required>
              <TextInput
                required
                placeholder="যেমন: মোঃ সাকিব হোসেন"
                value={newStudentForm.full_name}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, full_name: e.target.value })}
              />
            </Field>

            <Field label="মোবাইল নম্বর *" required>
              <TextInput
                type="tel"
                required
                placeholder="01XXXXXXXXX"
                value={newStudentForm.phone}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="ব্যাচ নির্বাচন করুন *" required>
              <Select
                value={newStudentForm.batch_id || ""}
                onChange={(e) => {
                  const bId = e.target.value;
                  const b = batches.find((x) => x.id === bId);
                  setNewStudentForm({
                    ...newStudentForm,
                    batch_id: bId,
                    batch_name_snapshot: b?.name || "",
                    amount: b?.name?.includes("Combine") ? 2000 : 1200,
                  });
                }}
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="কলেজের নাম">
              <TextInput
                placeholder="যেমন: চৌদ্দগ্রাম সরকারি কলেজ"
                value={newStudentForm.college}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, college: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="প্রথম বেতনের মাস *" required>
              <Select
                value={newStudentForm.for_month}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, for_month: e.target.value })}
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="টাকার পরিমাণ (৳) *" required>
              <TextInput
                type="number"
                required
                min={100}
                step={50}
                value={newStudentForm.amount}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, amount: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="পেমেন্টের মাধ্যম *" required>
            <div className="flex gap-4 pt-1">
              <label className="flex cursor-pointer items-center gap-2 font-body text-[13px] font-bold text-ink-800">
                <input
                  type="radio"
                  name="new_student_method"
                  value="cash"
                  checked={newStudentForm.method === "cash"}
                  onChange={() => setNewStudentForm({ ...newStudentForm, method: "cash" })}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-600"
                />
                <span>💵 নগদ / ক্যাশ (অফিসে জমা)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 font-body text-[13px] font-bold text-ink-800">
                <input
                  type="radio"
                  name="new_student_method"
                  value="online"
                  checked={newStudentForm.method === "online"}
                  onChange={() => setNewStudentForm({ ...newStudentForm, method: "online" })}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-600"
                />
                <span>🌐 অনলাইন / bKash</span>
              </label>
            </div>
          </Field>

          <Field label="মন্তব্য / নোট">
            <TextInput
              placeholder="যেমন: প্রথম মাসের বেতন গ্রহণ"
              value={newStudentForm.note || ""}
              onChange={(e) => setNewStudentForm({ ...newStudentForm, note: e.target.value })}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setNewStudentModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={savingNewStudent}>
              {savingNewStudent ? "সংরক্ষণ হচ্ছে..." : "✓ ভর্তি ও বেতন গ্রহণ সম্পন্ন করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* রসিদ এডিট মোডাল */}
      <Modal
        open={!!editingReceipt}
        onClose={() => setEditingReceipt(null)}
        title="রসিদ সংশোধন"
        description="টাকার পরিমাণ, মাস বা মাধ্যম পরিবর্তন করুন।"
      >
        <form onSubmit={handleEditReceiptSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="বেতনের মাস" required>
              <Select
                value={editReceiptForm.for_month}
                onChange={(e) => setEditReceiptForm({ ...editReceiptForm, for_month: e.target.value })}
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="টাকার পরিমাণ (৳)" required>
              <TextInput
                type="number"
                required
                min={100}
                value={editReceiptForm.amount}
                onChange={(e) => setEditReceiptForm({ ...editReceiptForm, amount: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="পেমেন্ট মাধ্যম">
            <Select
              value={editReceiptForm.method}
              onChange={(e) => setEditReceiptForm({ ...editReceiptForm, method: e.target.value as PaymentMethod })}
            >
              <option value="cash">নগদ / ক্যাশ (অফিসে জমা)</option>
              <option value="online">অনলাইন / bKash</option>
            </Select>
          </Field>

          <Field label="মন্তব্য / নোট">
            <TextInput
              placeholder="নোট..."
              value={editReceiptForm.note}
              onChange={(e) => setEditReceiptForm({ ...editReceiptForm, note: e.target.value })}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setEditingReceipt(null)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={savingEdit}>
              {savingEdit ? "হালনাগাদ হচ্ছে..." : "সংরক্ষণ করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* রসিদ ডিলিট মোডাল */}
      <Modal
        open={!!deleteReceiptTarget}
        onClose={() => setDeleteReceiptTarget(null)}
        title="রসিদ মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">{formatTaka(deleteReceiptTarget?.amount || 0)}</b>-এর এই পেমেন্ট রসিদটি মুছে ফেলতে চান?
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setDeleteReceiptTarget(null)} disabled={deletingReceipt}>
              বাতিল
            </SecondaryButton>
            <button
              type="button"
              onClick={handleDeleteReceiptConfirm}
              disabled={deletingReceipt}
              className="rounded-full bg-danger px-5 py-2.5 font-body text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {deletingReceipt ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
