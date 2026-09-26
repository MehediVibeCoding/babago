"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Payment, Student, Batch, PaymentMethod } from "@/lib/types";
import {
  recordPayment,
  recordNewStudentAndPayment,
  updatePayment,
  deletePayment,
  type PaymentInput,
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
import { formatTaka } from "@/lib/utils";
import { toBengaliDigits, formatBengaliDate, BENGALI_MONTHS } from "@/lib/bengaliNumerals";

// বিগত ৬ মাস ও আগামী ২ মাসের তালিকা তৈরি করার হেল্পার
function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -6; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const label = `${BENGALI_MONTHS[d.getMonth()]} ${toBengaliDigits(d.getFullYear())}`;
    options.push({ value, label });
  }
  return options;
}

// ডিফল্ট চলতি মাস
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
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const monthOptions = useMemo(() => getMonthOptions(), []);
  const currentMonthVal = useMemo(() => getCurrentMonthValue(), []);

  // মোডাল স্টেট
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<"existing" | "new_student">("existing");
  const [saving, setSaving] = useState(false);

  // বিদ্যমান শিক্ষার্থী পেমেন্ট ফর্ম
  const [existingForm, setExistingForm] = useState<PaymentInput>({
    student_id: "",
    amount: 1200,
    method: "cash",
    for_month: currentMonthVal,
    note: "",
  });

  // নতুন শিক্ষার্থী + পেমেন্ট ফর্ম
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
    for_month: currentMonthVal,
    note: "ভর্তিকালীন প্রথম মাসের বেতন",
  });

  // এডিট মোডাল স্টেট
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: 0,
    method: "cash" as PaymentMethod,
    for_month: currentMonthVal,
    note: "",
  });

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setAddModalOpen(true);
    }
  }, [searchParams]);

  // শিক্ষার্থী ম্যাপ
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    allStudents.forEach((s) => map.set(s.id, s));
    return map;
  }, [allStudents]);

  // ফিল্টার করা পেমেন্ট তালিকা
  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const student = studentMap.get(p.student_id);
      const studentName = student?.full_name?.toLowerCase() || "";
      const studentPhone = student?.phone || "";
      const note = p.note?.toLowerCase() || "";

      const matchSearch = !q || studentName.includes(q) || studentPhone.includes(q) || note.includes(q);
      const matchMonth = monthFilter === "all" || p.for_month.slice(0, 7) === monthFilter.slice(0, 7);
      const matchMethod = methodFilter === "all" || p.method === methodFilter;

      return matchSearch && matchMonth && matchMethod;
    });
  }, [payments, search, monthFilter, methodFilter, studentMap]);

  // কালেকশন পরিসংখ্যান
  const stats = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const cashTotal = filteredPayments.filter((p) => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
    const onlineTotal = filteredPayments.filter((p) => p.method === "online").reduce((sum, p) => sum + p.amount, 0);
    return { total, cashTotal, onlineTotal, count: filteredPayments.length };
  }, [filteredPayments]);

  // বিদ্যমান শিক্ষার্থী ড্রপডাউনে পরিবর্তন হলে
  function handleExistingStudentSelect(studentId: string) {
    const s = studentMap.get(studentId);
    let amount = 1200;
    if (s?.batch_name_snapshot?.includes("Combine")) amount = 2000;
    setExistingForm((prev) => ({
      ...prev,
      student_id: studentId,
      amount,
    }));
  }

  // নতুন শিক্ষার্থী ব্যাচ পরিবর্তন হলে
  function handleNewStudentBatchChange(batchId: string) {
    const b = batches.find((x) => x.id === batchId);
    const amount = b?.name?.includes("Combine") ? 2000 : 1200;
    setNewStudentForm((prev) => ({
      ...prev,
      batch_id: batchId,
      batch_name_snapshot: b?.name || "",
      amount,
    }));
  }

  // পেমেন্ট সেভ হ্যান্ডলার
  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (addMode === "existing") {
      if (!existingForm.student_id) {
        showToast("শিক্ষার্থী নির্বাচন করুন।", "error");
        setSaving(false);
        return;
      }
      const res = await recordPayment(existingForm);
      setSaving(false);
      if (res.ok && res.payment) {
        setPayments((prev) => [res.payment!, ...prev]);
        showToast("বেতন সফলভাবে জমা হয়েছে।", "success");
        setAddModalOpen(false);
        setExistingForm((prev) => ({ ...prev, student_id: "", note: "" }));
      } else {
        showToast(res.message || "পেমেন্ট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      if (!newStudentForm.full_name.trim() || !newStudentForm.phone.trim()) {
        showToast("শিক্ষার্থীর নাম ও মোবাইল নম্বর দিন।", "error");
        setSaving(false);
        return;
      }
      const res = await recordNewStudentAndPayment(newStudentForm);
      setSaving(false);
      if (res.ok && res.payment) {
        setPayments((prev) => [res.payment!, ...prev]);
        showToast("শিক্ষার্থী ভর্তি ও বেতন গ্রহণ সফল হয়েছে!", "success");
        setAddModalOpen(false);
        setNewStudentForm((prev) => ({ ...prev, full_name: "", phone: "", note: "" }));
      } else {
        showToast(res.message || "ভর্তি ও পেমেন্ট সম্পন্ন করা যায়নি।", "error");
      }
    }
  }

  function openEditModal(p: Payment) {
    setEditingPayment(p);
    setEditFormData({
      amount: p.amount,
      method: p.method,
      for_month: p.for_month,
      note: p.note || "",
    });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPayment) return;
    setSaving(true);
    const res = await updatePayment(editingPayment.id, editFormData);
    setSaving(false);
    if (res.ok && res.payment) {
      setPayments((prev) => prev.map((x) => (x.id === editingPayment.id ? res.payment! : x)));
      showToast("পেমেন্ট তথ্য হালনাগাদ হয়েছে।", "success");
      setEditingPayment(null);
    } else {
      showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deletePayment(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setPayments((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      showToast("পেমেন্ট রেকর্ড মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="বেতন ও পেমেন্ট ব্যবস্থাপনা"
        subtitle="অফলাইন নগদ বেতন গ্রহণ, অনলাইন পেমেন্ট রেকর্ড ও কালেকশন হিস্ট্রি"
        action={
          <PrimaryButton onClick={() => setAddModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ বেতন / পেমেন্ট গ্রহণ করুন</span>
          </PrimaryButton>
        }
      />

      {/* কালেকশন ওভারভিউ কার্ডস */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EBF5FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-700">মোট কালেকশন</p>
          <p className="mt-1 font-body text-[20px] font-black text-sky-950 sm:text-[22px]">{formatTaka(stats.total)}</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">মোট {toBengaliDigits(stats.count)}টি পেমেন্ট</span>
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
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-warn">গড় বেতন/পেমেন্ট</p>
          <p className="mt-1 font-body text-[20px] font-black text-amber-950 sm:text-[22px]">
            {formatTaka(stats.count > 0 ? Math.round(stats.total / stats.count) : 0)}
          </p>
          <span className="font-body text-[10.5px] font-semibold text-muted">প্রতি ট্রানজেকশনে</span>
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
              placeholder="শিক্ষার্থীর নাম, মোবাইল নম্বর অথবা নোট দিয়ে খুঁজুন..."
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
            {/* মাস ফিল্টার */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল মাসের রেকর্ড</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* মাধ্যম ফিল্টার */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল মাধ্যম (নগদ + অনলাইন)</option>
              <option value="cash">নগদ / ক্যাশ</option>
              <option value="online">অনলাইন</option>
            </select>
          </div>
        </div>
      </div>

      {/* পেমেন্ট টেবিল */}
      <div className="overflow-hidden rounded-[24px] border border-border-base/80 bg-white shadow-sh2">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-border-base bg-[#F8FAFC] font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="py-3.5 pl-4 pr-3">শিক্ষার্থী ও ব্যাচ</th>
                <th className="p-3.5">বেতনের মাস</th>
                <th className="p-3.5">টাকার পরিমাণ</th>
                <th className="p-3.5">পেমেন্ট মাধ্যম</th>
                <th className="p-3.5">জমার তারিখ</th>
                <th className="p-3.5">মন্তব্য / নোট</th>
                <th className="p-3.5 pr-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <EmptyState
                      title="কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি"
                      hint="নতুন বেতন জমা করুন অথবা সার্চ/ফিল্টার পরিবর্তন করুন।"
                    />
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const student = studentMap.get(p.student_id);
                  const monthD = new Date(p.for_month);
                  const monthName = !isNaN(monthD.getTime())
                    ? `${BENGALI_MONTHS[monthD.getMonth()]} ${toBengaliDigits(monthD.getFullYear())}`
                    : p.for_month;

                  return (
                    <tr
                      key={p.id}
                      className="transition-colors odd:bg-white even:bg-[#F8FAFC]/70 hover:bg-sky-50/40"
                    >
                      {/* শিক্ষার্থী ও ব্যাচ */}
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-body text-[13px] font-black text-success shadow-xs">
                            ৳
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-body text-[13.5px] font-black text-sky-950">
                              {student?.full_name || "অজ্ঞাত শিক্ষার্থী"}
                            </p>
                            <span className="font-body text-[11px] font-semibold text-muted">
                              {student?.batch_name_snapshot || student?.phone || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* বেতনের মাস */}
                      <td className="p-3">
                        <span className="inline-block rounded-lg bg-sky-100/70 px-2.5 py-1 font-body text-[12px] font-bold text-sky-800">
                          {monthName}
                        </span>
                      </td>

                      {/* পরিমাণ */}
                      <td className="whitespace-nowrap p-3 font-black text-[15px] text-sky-950">
                        {formatTaka(p.amount)}
                      </td>

                      {/* মাধ্যম */}
                      <td className="whitespace-nowrap p-3">
                        <Badge tone={p.method === "cash" ? "success" : "info"}>
                          {p.method === "cash" ? "💵 নগদ / ক্যাশ" : "🌐 অনলাইন"}
                        </Badge>
                      </td>

                      {/* জমার তারিখ */}
                      <td className="whitespace-nowrap p-3 font-body text-[12px] text-muted">
                        {formatBengaliDate(p.created_at.slice(0, 10))}
                      </td>

                      {/* নোট */}
                      <td className="p-3">
                        <p className="max-w-[200px] truncate text-[12px] text-ink-800/80">
                          {p.note || <span className="text-muted/50">—</span>}
                        </p>
                      </td>

                      {/* অ্যাকশন */}
                      <td className="whitespace-nowrap p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                            title="সম্পাদনা"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 text-danger transition-colors hover:bg-rose-100"
                            title="মুছে ফেলুন"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

      {/* নতুন বেতন / পেমেন্ট গ্রহণ মোডাল */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="বেতন / পেমেন্ট গ্রহণ করুন"
        description="অফলাইনে নগদ টাকা বা অনলাইনে পাওয়া ফি এন্ট্রি করুন।"
      >
        {/* অপশন সুইচ ট্যাব */}
        <div className="mb-4 flex gap-1.5 rounded-xl bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => setAddMode("existing")}
            className={`flex-1 rounded-lg py-2 font-body text-[12.5px] font-bold transition-all ${
              addMode === "existing" ? "bg-white text-sky-950 shadow-xs" : "text-muted hover:text-ink-800"
            }`}
          >
            👤 বিদ্যমান শিক্ষার্থী
          </button>
          <button
            type="button"
            onClick={() => setAddMode("new_student")}
            className={`flex-1 rounded-lg py-2 font-body text-[12.5px] font-bold transition-all ${
              addMode === "new_student" ? "bg-white text-sky-950 shadow-xs" : "text-muted hover:text-ink-800"
            }`}
          >
            ✨ নতুন ভর্তি + পেমেন্ট
          </button>
        </div>

        <form onSubmit={handleSavePayment} className="space-y-3.5">
          {addMode === "existing" ? (
            <>
              <Field label="শিক্ষার্থী নির্বাচন করুন *" required>
                <Select
                  required
                  value={existingForm.student_id}
                  onChange={(e) => handleExistingStudentSelect(e.target.value)}
                >
                  <option value="">— শিক্ষার্থী বেছে নিন —</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.college_roll ? `রোল: ${s.college_roll} · ` : ""}{s.batch_name_snapshot || s.phone})
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          ) : (
            <>
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
                    onChange={(e) => handleNewStudentBatchChange(e.target.value)}
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
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="বেতনের মাস *" required>
              <Select
                value={addMode === "existing" ? existingForm.for_month : newStudentForm.for_month}
                onChange={(e) => {
                  const val = e.target.value;
                  if (addMode === "existing") setExistingForm({ ...existingForm, for_month: val });
                  else setNewStudentForm({ ...newStudentForm, for_month: val });
                }}
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
                placeholder="1200"
                value={addMode === "existing" ? existingForm.amount : newStudentForm.amount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (addMode === "existing") setExistingForm({ ...existingForm, amount: val });
                  else setNewStudentForm({ ...newStudentForm, amount: val });
                }}
              />
            </Field>
          </div>

          <Field label="পেমেন্টের মাধ্যম *" required>
            <div className="flex gap-4 pt-1">
              <label className="flex cursor-pointer items-center gap-2 font-body text-[13px] font-bold text-ink-800">
                <input
                  type="radio"
                  name="method"
                  value="cash"
                  checked={addMode === "existing" ? existingForm.method === "cash" : newStudentForm.method === "cash"}
                  onChange={() => {
                    if (addMode === "existing") setExistingForm({ ...existingForm, method: "cash" });
                    else setNewStudentForm({ ...newStudentForm, method: "cash" });
                  }}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-600"
                />
                <span>💵 নগদ / ক্যাশ (অফিসে জমা)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 font-body text-[13px] font-bold text-ink-800">
                <input
                  type="radio"
                  name="method"
                  value="online"
                  checked={addMode === "existing" ? existingForm.method === "online" : newStudentForm.method === "online"}
                  onChange={() => {
                    if (addMode === "existing") setExistingForm({ ...existingForm, method: "online" });
                    else setNewStudentForm({ ...newStudentForm, method: "online" });
                  }}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-600"
                />
                <span>🌐 অনলাইন / bKash</span>
              </label>
            </div>
          </Field>

          <Field label="মন্তব্য / নোট (ঐচ্ছিক)">
            <TextInput
              placeholder="যেমন: অফিসে সরাসরি জমা / রসিদ নং ১২৩"
              value={addMode === "existing" ? existingForm.note || "" : newStudentForm.note || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (addMode === "existing") setExistingForm({ ...existingForm, note: val });
                else setNewStudentForm({ ...newStudentForm, note: val });
              }}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setAddModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "জমা হচ্ছে..." : "✓ পেমেন্ট গ্রহণ নিশ্চিত করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* পেমেন্ট এডিট মোডাল */}
      <Modal
        open={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        title="পেমেন্ট রেকর্ড সংশোধন"
        description="টাকার পরিমাণ, বেতনের মাস বা মাধ্যম পরিবর্তন করুন।"
      >
        <form onSubmit={handleEditSave} className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="বেতনের মাস" required>
              <Select
                value={editFormData.for_month}
                onChange={(e) => setEditFormData({ ...editFormData, for_month: e.target.value })}
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
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="পেমেন্ট মাধ্যম">
            <Select
              value={editFormData.method}
              onChange={(e) => setEditFormData({ ...editFormData, method: e.target.value as PaymentMethod })}
            >
              <option value="cash">নগদ / ক্যাশ (অফিসে জমা)</option>
              <option value="online">অনলাইন / bKash</option>
            </Select>
          </Field>

          <Field label="মন্তব্য / নোট">
            <TextInput
              placeholder="নোট..."
              value={editFormData.note}
              onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setEditingPayment(null)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "হালনাগাদ হচ্ছে..." : "সংরক্ষণ করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ডিলিট কনফার্মেশন মোডাল */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="পেমেন্ট রেকর্ড মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">{formatTaka(deleteTarget?.amount || 0)}</b>-এর এই পেমেন্ট রেকর্ডটি মুছে ফেলতে চান?
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
