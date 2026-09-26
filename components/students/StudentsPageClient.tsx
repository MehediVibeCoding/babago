"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Student, Batch, Payment, StudentStatus, PaymentMethod } from "@/lib/types";
import {
  createStudent,
  updateStudent,
  deleteStudent,
  updateStudentStatus,
  type StudentInput,
} from "@/app/actions/students";
import { recordPayment } from "@/app/actions/payments";
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
import { dueMonthsForStudent, formatTaka } from "@/lib/utils";
import { toBengaliDigits, formatBengaliDate, BENGALI_MONTHS } from "@/lib/bengaliNumerals";

const GROUPS = ["বিজ্ঞান বিভাগ", "মানবিক বিভাগ", "ব্যবসায় শিক্ষা বিভাগ"];

const EMPTY_FORM: StudentInput = {
  full_name: "",
  college: "",
  college_roll: "",
  group_name: "বিজ্ঞান বিভাগ",
  batch_id: "",
  batch_name_snapshot: "",
  phone: "",
  guardian_phone: "",
  status: "confirmed",
};

// বিগত ৬ মাস ও আগামী ৪ মাসের তালিকা
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

// শিক্ষার্থীর সব পেমেন্ট বিশ্লেষণ করে মোট টাকা ও কোন মাস থেকে কোন মাস তার হিসাব বের করা
function getStudentPaymentSummary(studentId: string, payments: Payment[]) {
  const studentPays = payments.filter((p) => p.student_id === studentId);
  const totalAmount = studentPays.reduce((sum, p) => sum + p.amount, 0);

  // ইউনিক ও ক্রমানুসারে সাজানো মাস
  const sortedMonths = Array.from(new Set(studentPays.map((p) => p.for_month.slice(0, 7)))).sort(
    (a, b) => a.localeCompare(b)
  );

  if (sortedMonths.length === 0) {
    return {
      totalAmount: 0,
      count: 0,
      rangeLabel: "কোনো পেমেন্ট নেই",
      monthsList: [],
    };
  }

  const firstDate = new Date(sortedMonths[0] + "-01");
  const lastDate = new Date(sortedMonths[sortedMonths.length - 1] + "-01");

  const firstLabel = `${BENGALI_MONTHS[firstDate.getMonth()]} '${toBengaliDigits(firstDate.getFullYear()).slice(-2)}`;
  const lastLabel = `${BENGALI_MONTHS[lastDate.getMonth()]} '${toBengaliDigits(lastDate.getFullYear()).slice(-2)}`;

  const rangeLabel =
    sortedMonths.length === 1
      ? `${firstLabel} (১ মাস)`
      : `${firstLabel} – ${lastLabel} (${toBengaliDigits(sortedMonths.length)} মাস)`;

  return {
    totalAmount,
    count: sortedMonths.length,
    rangeLabel,
    monthsList: studentPays,
  };
}

export default function StudentsPageClient({
  initialStudents,
  batches,
  payments: initialPayments,
}: {
  initialStudents: Student[];
  batches: Batch[];
  payments: Payment[];
}) {
  const searchParams = useSearchParams();
  const { show: showToast } = useToast();

  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [dueOnly, setDueOnly] = useState(false);

  // ভর্তি/এডিট মোডাল
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // সরাসরি রো থেকে দ্রুত বেতন গ্রহণের মোডাল
  const [quickPayStudent, setQuickPayStudent] = useState<Student | null>(null);
  const [quickPayForm, setQuickPayForm] = useState({
    amount: 1200,
    method: "cash" as PaymentMethod,
    for_month: getCurrentMonthValue(),
    note: "",
  });
  const [recordingPay, setRecordingPay] = useState(false);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  useEffect(() => {
    if (searchParams.get("filter") === "due") {
      setDueOnly(true);
    }
    if (searchParams.get("action") === "add") {
      openAddModal();
    }
  }, [searchParams]);

  // ফিল্টার করা শিক্ষার্থী তালিকা
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.college.toLowerCase().includes(q) ||
        s.college_roll.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.guardian_phone?.includes(q);

      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchBatch = batchFilter === "all" || s.batch_id === batchFilter;
      const dueMonths = dueMonthsForStudent(s, payments);
      const matchDue = !dueOnly || (s.status === "confirmed" && dueMonths > 0);

      return matchSearch && matchStatus && matchBatch && matchDue;
    });
  }, [students, search, statusFilter, batchFilter, dueOnly, payments]);

  // নির্বাচিত শিক্ষার্থীর পেমেন্ট সারাংশ
  const quickPaySummary = useMemo(() => {
    if (!quickPayStudent) return null;
    return getStudentPaymentSummary(quickPayStudent.id, payments);
  }, [payments, quickPayStudent]);

  function openAddModal() {
    setEditingStudent(null);
    setFormData({
      ...EMPTY_FORM,
      batch_id: batches[0]?.id || "",
      batch_name_snapshot: batches[0]?.name || "",
    });
    setModalOpen(true);
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      college: student.college,
      college_roll: student.college_roll,
      group_name: student.group_name,
      batch_id: student.batch_id || "",
      batch_name_snapshot: student.batch_name_snapshot || "",
      phone: student.phone,
      guardian_phone: student.guardian_phone || "",
      status: student.status,
    });
    setModalOpen(true);
  }

  // দ্রুত বেতন গ্রহণ মোডাল খোলা
  function openQuickPayModal(student: Student) {
    setQuickPayStudent(student);
    let defaultAmount = 1200;
    if (student.batch_name_snapshot?.includes("Combine")) defaultAmount = 2000;

    setQuickPayForm({
      amount: defaultAmount,
      method: "cash",
      for_month: getCurrentMonthValue(),
      note: "অফিসে সরাসরি জমা",
    });
  }

  function handleBatchChange(batchId: string) {
    const selected = batches.find((b) => b.id === batchId);
    setFormData((prev) => ({
      ...prev,
      batch_id: batchId,
      batch_name_snapshot: selected?.name || "",
    }));
  }

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      showToast("শিক্ষার্থীর নাম ও মোবাইল নম্বর পূরণ করুন।", "error");
      return;
    }

    setSaving(true);
    if (editingStudent) {
      const res = await updateStudent(editingStudent.id, formData);
      setSaving(false);
      if (res.ok && res.student) {
        setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? res.student! : s)));
        showToast("শিক্ষার্থীর তথ্য সফলভাবে আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createStudent(formData);
      setSaving(false);
      if (res.ok && res.student) {
        setStudents((prev) => [res.student!, ...prev]);
        showToast("নতুন শিক্ষার্থী সফলভাবে ভর্তি হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "ভর্তি সম্পন্ন করা যায়নি।", "error");
      }
    }
  }

  // নতুন বেতন জমা দেওয়া
  async function handleQuickPaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickPayStudent) return;
    if (!quickPayForm.amount || quickPayForm.amount <= 0) {
      showToast("সঠিক টাকার পরিমাণ দিন।", "error");
      return;
    }

    setRecordingPay(true);
    const res = await recordPayment({
      student_id: quickPayStudent.id,
      amount: quickPayForm.amount,
      method: quickPayForm.method,
      for_month: quickPayForm.for_month,
      note: quickPayForm.note,
    });
    setRecordingPay(false);

    if (res.ok && res.payment) {
      // পেমেন্ট লিস্টে নতুন রেকর্ড যোগ (যাতে রিয়েলটাইমে মোট টাকা ও মাসের রেঞ্জ আপডেট হয়)
      setPayments((prev) => [res.payment!, ...prev]);

      // যদি শিক্ষার্থী পেন্ডিং থাকে, বেতন নেওয়ার পর স্বয়ংক্রিয়ভাবে কনফার্মড হয়ে যাবে
      if (quickPayStudent.status === "pending") {
        await updateStudentStatus(quickPayStudent.id, "confirmed");
        setStudents((prev) =>
          prev.map((s) => (s.id === quickPayStudent.id ? { ...s, status: "confirmed" } : s))
        );
      }

      showToast(`${quickPayStudent.full_name}-এর বেতন সফলভাবে জমা হয়েছে!`, "success");
      setQuickPayStudent(null);
    } else {
      showToast(res.message || "বেতন জমা করা যায়নি।", "error");
    }
  }

  async function handleStatusToggle(student: Student, newStatus: StudentStatus) {
    const res = await updateStudentStatus(student.id, newStatus);
    if (res.ok) {
      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, status: newStatus } : s)));
      showToast(`স্ট্যাটাস পরিবর্তন হয়েছে: ${newStatus}`, "info");
    } else {
      showToast("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteStudent(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      showToast("শিক্ষার্থী সফলভাবে মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="শিক্ষার্থী ব্যবস্থাপনা"
        subtitle={`মোট শিক্ষার্থী: ${toBengaliDigits(students.length)} জন (তালিকায় দৃশ্যমান: ${toBengaliDigits(filteredStudents.length)} জন)`}
        action={
          <PrimaryButton onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ নতুন শিক্ষার্থী ভর্তি</span>
          </PrimaryButton>
        }
      />

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
              placeholder="নাম, কলেজ, রোল অথবা মোবাইল নম্বর দিয়ে খুঁজুন..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="confirmed">কনফার্মড</option>
              <option value="pending">পেন্ডিং আবেদন</option>
              <option value="inactive">নিষ্ক্রিয় / বাদ</option>
            </select>

            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="h-[38px] max-w-[180px] truncate rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল ব্যাচ</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setDueOnly((v) => !v)}
              className={`flex h-[38px] items-center gap-1.5 rounded-xl border px-3.5 font-body text-[12px] font-bold transition-all ${
                dueOnly
                  ? "border-amber-400 bg-amber-50 text-amber-800 shadow-xs"
                  : "border-border-base/80 bg-white text-ink-800 hover:bg-surface-muted"
              }`}
            >
              <span>⚠️ বেতন বকেয়া</span>
              {dueOnly && <span className="text-xs">✓</span>}
            </button>
          </div>
        </div>
      </div>

      {/* স্টুডেন্ট টেবিল */}
      <div className="overflow-hidden rounded-[24px] border border-border-base/80 bg-white shadow-sh2">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-border-base bg-[#F8FAFC] font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="py-3.5 pl-4 pr-3">শিক্ষার্থী</th>
                <th className="p-3.5">কলেজ ও রোল</th>
                <th className="p-3.5">ব্যাচ</th>
                <th className="p-3.5">মোবাইল নম্বর</th>
                <th className="p-3.5">পরিশোধিত বেতন ও সময়কাল</th>
                <th className="p-3.5">বকেয়া</th>
                <th className="p-3.5">স্ট্যাটাস</th>
                <th className="p-3.5 pr-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      title="কোনো শিক্ষার্থী পাওয়া যায়নি"
                      hint="সার্চ বা ফিল্টার পরিবর্তন করে দেখুন অথবা নতুন শিক্ষার্থী ভর্তি করুন।"
                    />
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const dueMonths = dueMonthsForStudent(s, payments);
                  const paySummary = getStudentPaymentSummary(s.id, payments);

                  return (
                    <tr
                      key={s.id}
                      className="transition-colors odd:bg-white even:bg-[#F8FAFC]/70 hover:bg-sky-50/40"
                    >
                      {/* নাম ও বিভাগ */}
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 font-body text-[13px] font-black text-white shadow-xs">
                            {s.full_name.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-body text-[13.5px] font-black text-sky-950">
                              {s.full_name}
                            </p>
                            <span className="font-body text-[11px] font-semibold text-muted">
                              {s.group_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* কলেজ ও রোল */}
                      <td className="p-3">
                        <p className="max-w-[170px] truncate font-semibold text-ink-800" title={s.college}>
                          {s.college}
                        </p>
                        <p className="font-body text-[11px] font-medium text-muted">
                          রোল: {s.college_roll || "—"}
                        </p>
                      </td>

                      {/* ব্যাচ */}
                      <td className="p-3">
                        <span className="inline-block max-w-[160px] truncate rounded-lg bg-sky-100/70 px-2.5 py-1 font-body text-[11.5px] font-bold text-sky-800">
                          {s.batch_name_snapshot || "ব্যাচ নির্ধারিত নেই"}
                        </span>
                      </td>

                      {/* ফোন */}
                      <td className="whitespace-nowrap p-3">
                        <p className="font-bold text-ink-800">{s.phone}</p>
                        {s.guardian_phone && (
                          <p className="font-body text-[10.5px] text-muted">
                            অভিভাবক: {s.guardian_phone}
                          </p>
                        )}
                      </td>

                      {/* 💰 মোট ফি ও পরিশোধিত মাসের রেঞ্জ */}
                      <td className="p-3">
                        <p className="font-black text-[14px] text-emerald-700">
                          {formatTaka(paySummary.totalAmount)}
                        </p>
                        <p className="font-body text-[11px] font-semibold text-sky-900/80">
                          {paySummary.rangeLabel}
                        </p>
                      </td>

                      {/* বকেয়া মাস */}
                      <td className="whitespace-nowrap p-3">
                        {s.status === "confirmed" && dueMonths > 0 ? (
                          <Badge tone={dueMonths >= 3 ? "danger" : "warn"}>
                            {toBengaliDigits(dueMonths)} মাস বাকি
                          </Badge>
                        ) : s.status === "confirmed" ? (
                          <Badge tone="success">পরিশোধিত ✓</Badge>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      {/* স্ট্যাটাস ব্যাজ */}
                      <td className="whitespace-nowrap p-3">
                        <Badge
                          tone={
                            s.status === "confirmed"
                              ? "success"
                              : s.status === "pending"
                              ? "warn"
                              : "muted"
                          }
                        >
                          {s.status === "confirmed"
                            ? "কনফার্মড"
                            : s.status === "pending"
                            ? "পেন্ডিং"
                            : "নিষ্ক্রিয়"}
                        </Badge>
                      </td>

                      {/* ⚡ অ্যাকশন বাটনস (সর্বদা দৃশ্যমান + ৳ বেতন বাটন) */}
                      <td className="whitespace-nowrap p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* সরাসরি বেতন নেওয়ার আকর্ষণীয় বাটন */}
                          <button
                            type="button"
                            onClick={() => openQuickPayModal(s)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 font-body text-[11.5px] font-black text-white shadow-xs transition-all hover:brightness-105 active:scale-95"
                            title="নতুন মাসের বেতন জমা নিন"
                          >
                            <span>+ ৳ বেতন</span>
                          </button>

                          {/* পেন্ডিং থাকলে কনফার্ম বাটন */}
                          {s.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(s, "confirmed")}
                              title="ভর্তি নিশ্চিত করুন"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 font-body text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                            >
                              ✓
                            </button>
                          )}

                          {/* এডিট বাটন */}
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                            title="তথ্য সম্পাদনা"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                          </button>

                          {/* ডিলিট বাটন */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(s)}
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

      {/* 🚀 নির্দিষ্ট শিক্ষার্থীর বেতন জমা ও হিস্ট্রি মোডাল */}
      <Modal
        open={!!quickPayStudent}
        onClose={() => setQuickPayStudent(null)}
        title={`বেতন জমা — ${quickPayStudent?.full_name || ""}`}
        description={`${quickPayStudent?.batch_name_snapshot || ""} · মোবাইল: ${quickPayStudent?.phone || ""}`}
      >
        {quickPayStudent && quickPaySummary && (
          <div className="space-y-4">
            {/* পূর্বের পেমেন্ট হিস্ট্রি কার্ড */}
            <div className="rounded-2xl border border-sky-200/80 bg-sky-50/70 p-4">
              <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                <span className="font-body text-[12px] font-black uppercase tracking-wider text-sky-950">
                  পরিশোধিত সময়কাল:
                </span>
                <span className="font-body text-[13px] font-black text-emerald-800">
                  মোট জমা: {formatTaka(quickPaySummary.totalAmount)}
                </span>
              </div>

              <div className="mt-2.5">
                <p className="mb-1.5 font-body text-[11.5px] font-bold text-sky-900">
                  পরিশোধিত মাসসমূহ ({toBengaliDigits(quickPaySummary.count)}টি):
                </p>
                {quickPaySummary.monthsList.length === 0 ? (
                  <p className="font-body text-[11.5px] text-muted">এখনো কোনো মাসের পেমেন্ট রেকর্ড নেই।</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto sleek-scrollbar">
                    {quickPaySummary.monthsList.map((p) => {
                      const mDate = new Date(p.for_month);
                      const label = !isNaN(mDate.getTime())
                        ? `${BENGALI_MONTHS[mDate.getMonth()]} ${toBengaliDigits(mDate.getFullYear())}`
                        : p.for_month;
                      return (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 font-body text-[11px] font-bold text-emerald-800 shadow-2xs"
                          title={`${formatBengaliDate(p.created_at.slice(0, 10))} তারিখে ${p.method === "cash" ? "নগদে" : "অনলাইনে"} জমা`}
                        >
                          <span>✓ {label}</span>
                          <span className="text-muted font-normal">({formatTaka(p.amount)})</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* নতুন মাসের পেমেন্ট গ্রহণ ফরম */}
            <form onSubmit={handleQuickPaySubmit} className="space-y-3.5 border-t border-border-base/60 pt-2">
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
                      name="quick_method"
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
                      name="quick_method"
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
                <PrimaryButton type="submit" disabled={recordingPay}>
                  {recordingPay ? "জমা হচ্ছে..." : "✓ বেতন গ্রহণ নিশ্চিত করুন"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ভর্তি / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStudent ? "শিক্ষার্থীর তথ্য সম্পাদনা" : "নতুন শিক্ষার্থী ভর্তি ফরম"}
        description="শিক্ষার্থীর প্রয়োজনীয় একাডেমিক ও যোগাযোগের তথ্য পূরণ করুন।"
      >
        <form onSubmit={handleSaveStudent} className="space-y-3.5">
          <Field label="শিক্ষার্থীর পূর্ণ নাম" required>
            <TextInput
              required
              placeholder="যেমন: মোঃ সাকিব হোসেন"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="কলেজের নাম" required>
              <TextInput
                required
                placeholder="যেমন: চৌদ্দগ্রাম সরকারি কলেজ"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              />
            </Field>

            <Field label="কলেজ রোল">
              <TextInput
                placeholder="যেমন: ১০২৫"
                value={formData.college_roll}
                onChange={(e) => setFormData({ ...formData, college_roll: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="বিভাগ / গ্রুপ" required>
              <Select
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="কাঙ্ক্ষিত ব্যাচ" required>
              <Select
                value={formData.batch_id || ""}
                onChange={(e) => handleBatchChange(e.target.value)}
              >
                <option value="">— ব্যাচ বেছে নিন —</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.target_cohort})
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="শিক্ষার্থীর মোবাইল নম্বর *" required>
              <TextInput
                type="tel"
                required
                placeholder="01XXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Field>

            <Field label="অভিভাবকের মোবাইল নম্বর">
              <TextInput
                type="tel"
                placeholder="01XXXXXXXXX"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
              />
            </Field>
          </div>

          <Field label="ভর্তি স্ট্যাটাস">
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
            >
              <option value="confirmed">কনফার্মড (ভর্তি সম্পন্ন)</option>
              <option value="pending">পেন্ডিং আবেদন</option>
              <option value="inactive">নিষ্ক্রিয় / বাদ পড়েছে</option>
            </Select>
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingStudent ? "হালনাগাদ করুন" : "ভর্তি নিশ্চিত করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ডিলিট কনফার্মেশন মোডাল */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="শিক্ষার্থী মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">{deleteTarget?.full_name}</b>-কে তালিকা থেকে মুছে ফেলতে চান?
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
