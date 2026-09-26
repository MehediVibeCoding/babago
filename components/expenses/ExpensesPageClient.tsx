"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Expense, ExpenseCategory, Payment } from "@/lib/types";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInput,
} from "@/app/actions/expenses";
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

const CATEGORIES: ExpenseCategory[] = [
  "ভাড়া",
  "বিদ্যুৎ বিল",
  "প্রিন্টিং ও খাতাপত্র",
  "মার্কেটিং",
  "আপ্যায়ন ও নাস্তা" as ExpenseCategory,
  "রক্ষণাবেক্ষণ",
  "ব্যক্তিগত" as ExpenseCategory,
  "অন্যান্য",
];

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

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

const EMPTY_FORM: ExpenseInput = {
  title: "",
  category: "অন্যান্য",
  amount: 0,
  expense_date: getTodayDateString(),
  note: "",
};

// 🎯 উদাহরণ টেমপ্লেট
const EXAMPLE_EXPENSE_TEMPLATE: ExpenseInput = {
  title: "অক্টোবর মাসের একাডেমি রুম ভাড়া",
  category: "ভাড়া",
  amount: 15000,
  expense_date: getTodayDateString(),
  note: "অফিস ভাউচার ও রসিদ নং ১০৪",
};

export default function ExpensesPageClient({
  initialExpenses,
  payments,
}: {
  initialExpenses: Expense[];
  payments: Payment[];
}) {
  const searchParams = useSearchParams();
  const { show: showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // মোডাল স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // 🧮 স্মার্ট ক্যালকুলেটর স্টেট
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState("");

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      openAddModal();
    }
  }, [searchParams]);

  // ফিল্টার করা খরচের তালিকা
  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.note && e.note.toLowerCase().includes(q)) ||
        String(e.amount).includes(q);

      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchMonth = monthFilter === "all" || e.expense_date.slice(0, 7) === monthFilter;

      return matchSearch && matchCategory && matchMonth;
    });
  }, [expenses, search, categoryFilter, monthFilter]);

  // 💰 আর্থিক বিশ্লেষণ ও নিট ব্যালেন্স হিসাব
  const stats = useMemo(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const todayStr = getTodayDateString();

    // চলতি মাসের মোট খরচ
    const thisMonthExpenses = expenses
      .filter((e) => e.expense_date.slice(0, 7) === currentMonthKey)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // চলতি মাসের মোট আয় (পেমেন্ট কালেকশন)
    const thisMonthIncome = payments
      .filter((p) => p.for_month.slice(0, 7) === currentMonthKey)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // নিট ব্যালেন্স / হাতে কত থাকল
    const netProfit = thisMonthIncome - thisMonthExpenses;

    // আজকের খরচ
    const todayExpense = expenses
      .filter((e) => e.expense_date === todayStr)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // সর্বমোট মোট খরচ
    const totalAllTimeExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      thisMonthExpenses,
      thisMonthIncome,
      netProfit,
      todayExpense,
      totalAllTimeExpense,
      count: filteredExpenses.length,
    };
  }, [expenses, payments, filteredExpenses]);

  function openAddModal() {
    setEditingExpense(null);
    setFormData({
      ...EMPTY_FORM,
      expense_date: getTodayDateString(),
    });
    setModalOpen(true);
  }

  function openEditModal(expense: Expense) {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
      note: expense.note || "",
    });
    setModalOpen(true);
  }

  function handleLoadExample() {
    setFormData({
      ...EXAMPLE_EXPENSE_TEMPLATE,
      expense_date: formData.expense_date || getTodayDateString(),
    });
    showToast("উদাহরণ টেমপ্লেট ফর্মে লোড হয়েছে ✓", "info");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("খরচের শিরোনাম বা বিবরণ দিন।", "error");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      showToast("সঠিক টাকার পরিমাণ দিন।", "error");
      return;
    }

    setSaving(true);
    if (editingExpense) {
      const res = await updateExpense(editingExpense.id, formData);
      setSaving(false);
      if (res.ok && res.expense) {
        setExpenses((prev) => prev.map((x) => (x.id === editingExpense.id ? res.expense! : x)));
        showToast("খরচের বিবরণ আপডেট হয়েছে।", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createExpense(formData);
      setSaving(false);
      if (res.ok && res.expense) {
        setExpenses((prev) => [res.expense!, ...prev]);
        showToast("খরচ সফলভাবে যুক্ত হয়েছে!", "success");
        setModalOpen(false);
      } else {
        showToast(res.message || "সংরক্ষণ করা যায়নি।", "error");
      }
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteExpense(deleteTarget.id);
    setDeleting(false);
    if (res.ok) {
      setExpenses((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      showToast("খরচ রেকর্ড মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  // 🧮 ক্যালকুলেটর বাটন হ্যান্ডলার
  function handleCalcBtn(val: string) {
    if (val === "C") {
      setCalcInput("");
    } else if (val === "⌫") {
      setCalcInput((prev) => prev.slice(0, -1));
    } else if (val === "=") {
      try {
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, "");
        if (!sanitized) return;
        // eslint-disable-next-line no-new-func
        const result = Function(`'use strict'; return (${sanitized})`)();
        if (!isNaN(result) && isFinite(result)) {
          setCalcInput(String(Math.round(result * 100) / 100));
        }
      } catch {
        showToast("ভুল গাণিতিক সমীকরণ", "error");
      }
    } else {
      setCalcInput((prev) => prev + val);
    }
  }

  // ক্যালকুলেটর থেকে ফর্মে টাকা পেস্ট
  function pasteCalcToForm() {
    const num = Number(calcInput);
    if (isNaN(num) || num <= 0) {
      showToast("আগে ক্যালকুলেটরে সঠিক হিসাব করুন।", "info");
      return;
    }
    setFormData((prev) => ({ ...prev, amount: num }));
    showToast(`৳${num} টাকার ঘরে বসানো হয়েছে ✓`, "success");
    if (!modalOpen) {
      setModalOpen(true);
    }
  }

  return (
    <div>
      <PageHeader
        title="খরচ ট্র্যাকার ও হিসাব"
        subtitle="একাডেমির ভাড়া, বিদ্যুৎ বিল, প্রিন্টিং ও স্যারের দৈনন্দিন খরচের হিসাব"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCalcOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2.5 font-body text-[13px] font-bold text-sky-800 shadow-xs transition-colors hover:bg-sky-100"
            >
              <span>🧮</span>
              <span>{calcOpen ? "ক্যালকুলেটর লুকান" : "ক্যালকুলেটর"}</span>
            </button>

            <PrimaryButton onClick={openAddModal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ নতুন খরচ এন্ট্রি</span>
            </PrimaryButton>
          </div>
        }
      />

      {/* 🧮 ইন-বিল্ট স্মার্ট ক্যালকুলেটর */}
      {calcOpen && (
        <div className="mb-5 overflow-hidden rounded-[24px] border border-sky-200/90 bg-gradient-to-br from-sky-50 via-white to-sky-100/50 p-4 shadow-sh2 backdrop-blur-xl animate-soft-fade-in max-w-sm mx-auto">
          <div className="flex items-center justify-between border-b border-sky-200/70 pb-2 mb-3">
            <span className="font-body text-[12.5px] font-black text-sky-950 flex items-center gap-1.5">
              <span>🧮 স্মার্ট কুইক ক্যালকুলেটর</span>
            </span>
            <button
              type="button"
              onClick={() => setCalcOpen(false)}
              className="text-xs font-bold text-muted hover:text-ink-800"
            >
              ✕
            </button>
          </div>

          <div className="mb-3 rounded-xl border border-sky-300/80 bg-white p-3 text-right shadow-inner">
            <input
              type="text"
              readOnly
              value={calcInput || "0"}
              className="w-full text-right font-mono text-[22px] font-black tracking-tight text-sky-950 outline-none bg-transparent"
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {["C", "⌫", "/", "*", "7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "=", "0", ".", "00"].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => handleCalcBtn(btn)}
                className={`h-10 rounded-xl font-body text-[14px] font-bold shadow-2xs transition-all active:scale-95 ${
                  btn === "="
                    ? "bg-sky-600 text-white row-span-2 col-start-4 h-full"
                    : btn === "C"
                    ? "bg-rose-50 text-danger border border-rose-200"
                    : ["/", "*", "-", "+"].includes(btn)
                    ? "bg-sky-100 text-sky-800"
                    : "bg-white text-ink-800 border border-border-base/80 hover:bg-surface-muted"
                }`}
              >
                {btn}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={pasteCalcToForm}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 font-body text-[12.5px] font-black text-white shadow-xs transition-transform hover:brightness-105 active:scale-95"
          >
            📥 ক্যালকুলেটরের টাকা ফর্মে বসান
          </button>
        </div>
      )}

      {/* 💰 আর্থিক সারসংক্ষেপ ও নিট লাভ/ব্যালেন্স কার্ডস */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-[#FFF1F2] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-danger">চলতি মাসের খরচ</p>
          <p className="mt-1 font-body text-[20px] font-black text-rose-950 sm:text-[22px]">{formatTaka(stats.thisMonthExpenses)}</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">আজকের খরচ: {formatTaka(stats.todayExpense)}</span>
        </div>

        <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EBF5FF] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-700">চলতি মাসের আয়</p>
          <p className="mt-1 font-body text-[20px] font-black text-sky-950 sm:text-[22px]">{formatTaka(stats.thisMonthIncome)}</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">শিক্ষার্থীদের থেকে প্রাপ্ত ফি</span>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sh1 bg-gradient-to-br via-white to-white ${
          stats.netProfit >= 0 ? "border-emerald-200/70 from-[#ECFDF5]" : "border-rose-300 from-[#FFF1F2]"
        }`}>
          <p className={`font-body text-[11px] font-extrabold uppercase tracking-wider ${
            stats.netProfit >= 0 ? "text-success" : "text-danger"
          }`}>
            {stats.netProfit >= 0 ? "নিট ব্যালেন্স / লাভ" : "নিট ঘাটতি"}
          </p>
          <p className={`mt-1 font-body text-[20px] font-black sm:text-[22px] ${
            stats.netProfit >= 0 ? "text-emerald-950" : "text-rose-950"
          }`}>
            {formatTaka(stats.netProfit)}
          </p>
          <span className="font-body text-[10.5px] font-semibold text-muted">খরচ বাদ দিয়ে হাতে থাকা অর্থ</span>
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#FFFBEB] via-white to-white p-4 shadow-sh1">
          <p className="font-body text-[11px] font-extrabold uppercase tracking-wider text-warn">সর্বমোট খরচ</p>
          <p className="mt-1 font-body text-[20px] font-black text-amber-950 sm:text-[22px]">{formatTaka(stats.totalAllTimeExpense)}</p>
          <span className="font-body text-[10.5px] font-semibold text-muted">সকল রেকর্ড মিলিয়ে</span>
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
              placeholder="খরচের বিবরণ, ক্যাটাগরি বা নোট দিয়ে খুঁজুন..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-[38px] rounded-xl border border-border-base/80 bg-white px-3 font-body text-[12.5px] font-semibold text-ink-800 outline-none focus:border-sky-600"
            >
              <option value="all">সকল ক্যাটাগরির খরচ</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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

      {/* খরচের টেবিল */}
      <div className="overflow-hidden rounded-[24px] border border-border-base/80 bg-white shadow-sh2">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-border-base bg-[#F8FAFC] font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="py-3.5 pl-4 pr-3">খরচের শিরোনাম ও বিবরণ</th>
                <th className="p-3.5">ক্যাটাগরি</th>
                <th className="p-3.5">টাকার পরিমাণ</th>
                <th className="p-3.5">খরচের তারিখ</th>
                <th className="p-3.5">মন্তব্য / ভাউচার নোট</th>
                <th className="p-3.5 pr-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      title="কোনো খরচ রেকর্ড পাওয়া যায়নি"
                      hint="নতুন খরচের এন্ট্রি দিন অথবা সার্চ/ফিল্টার পরিবর্তন করুন।"
                    />
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="transition-colors odd:bg-white even:bg-[#F8FAFC]/70 hover:bg-sky-50/40"
                  >
                    {/* শিরোনাম */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 font-body text-[13px] font-black text-danger shadow-xs">
                          💸
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-body text-[13.5px] font-black text-sky-950">
                            {exp.title}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ক্যাটাগরি */}
                    <td className="p-3">
                      <Badge
                        tone={
                          exp.category === "ভাড়া" || exp.category === "বিদ্যুৎ বিল"
                            ? "danger"
                            : exp.category === "প্রিন্টিং ও খাতাপত্র"
                            ? "info"
                            : exp.category === "মার্কেটিং"
                            ? "warn"
                            : "muted"
                        }
                      >
                        {exp.category}
                      </Badge>
                    </td>

                    {/* টাকার পরিমাণ */}
                    <td className="whitespace-nowrap p-3 font-black text-[15px] text-rose-800">
                      {formatTaka(exp.amount)}
                    </td>

                    {/* খরচের তারিখ */}
                    <td className="whitespace-nowrap p-3 font-body text-[12px] text-muted">
                      {formatBengaliDate(exp.expense_date)}
                    </td>

                    {/* নোট */}
                    <td className="p-3">
                      <p className="max-w-[200px] truncate text-[12px] text-ink-800/80">
                        {exp.note || <span className="text-muted/50">—</span>}
                      </p>
                    </td>

                    {/* অ্যাকশন */}
                    <td className="whitespace-nowrap p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(exp)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base/80 bg-white text-ink-800 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                          title="সম্পাদনা"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exp)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* নতুন খরচ এন্ট্রি / এডিট মোডাল */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? "খরচের বিবরণ সম্পাদনা" : "নতুন খরচের এন্ট্রি দিন"}
        description="ভাড়া, বিল, প্রিন্টিং বা স্যারের দৈনন্দিন যেকোনো খরচের হিসাব রেকর্ড করুন।"
      >
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-body text-[12px] font-bold text-sky-950">নমুনা টেমপ্লেট</p>
              <p className="font-body text-[10.5px] text-sky-800">স্ট্যান্ডার্ড ভাউচার ফরম্যাট লোড করুন</p>
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
          <Field label="খরচের শিরোনাম বা বিবরণ *" required>
            <TextInput
              required
              placeholder="যেমন: ৫০০ কপি ইংরেজি শিট প্রিন্টিং / মার্কার ও কালি"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="খরচের ক্যাটাগরি *" required>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="টাকার পরিমাণ (৳) *" required>
              <TextInput
                type="number"
                required
                min={1}
                placeholder="1500"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="খরচের তারিখ *" required>
            <TextInput
              type="date"
              required
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </Field>

          <Field label="মন্তব্য / ভাউচার নোট (ঐচ্ছিক)">
            <TextInput
              placeholder="যেমন: ক্যাশ ভাউচার নং ১০৪ / বিকাশ পেমেন্ট"
              value={formData.note || ""}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingExpense ? "হালনাগাদ করুন" : "✓ খরচ সংরক্ষণ করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ডিলিট কনফার্মেশন মোডাল */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="খরচ রেকর্ড মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="font-body text-[13.5px] text-ink-800">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">&quot;{deleteTarget?.title}&quot;</b> ({formatTaka(deleteTarget?.amount || 0)})-এর এই খরচের রেকর্ডটি মুছে ফেলতে চান?
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
