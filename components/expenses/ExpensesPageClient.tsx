"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type {
  MonthlyFinancialSummary,
  RecurringRule,
  UnifiedTransaction,
  TransactionType,
  PaymentMethodType,
  ActionResult,
} from "@/app/actions/finance";
import {
  getMonthlyFinancialStatement,
  createRecurringRule,
  updateRecurringRule,
  toggleRecurringRuleActive,
  deleteRecurringRule,
  createIncomeRecord,
  deleteIncomeRecord,
  createExpenseRecord,
  deleteExpenseRecord,
} from "@/app/actions/finance";
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

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

const INCOME_CATEGORIES = ["সরকারি বেতন", "স্পেশাল ব্যাচ", "মডেল টেস্ট ফি", "পরামর্শ ও সম্মানী", "অন্যান্য আয়"];
const EXPENSE_CATEGORIES = ["ভাড়া", "বিদ্যুৎ বিল", "ইন্টারনেট বিল", "প্রিন্টিং ও শিট", "স্টাফ বেতন", "আপ্যায়ন ও নাস্তা", "রক্ষণাবেক্ষণ", "অন্যান্য খরচ"];

export default function FinancePageClient({
  initialSummary,
}: {
  initialSummary: MonthlyFinancialSummary;
}) {
  const { show: showToast } = useToast();

  const [summary, setSummary] = useState<MonthlyFinancialSummary>(initialSummary);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialSummary.selectedMonth || getCurrentMonthValue());
  const [loadingMonth, setLoadingMonth] = useState(false);

  // ফিল্টার ও সার্চ স্টেট
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [showRulesSection, setShowRulesSection] = useState(false);

  // 🧮 ক্যালকুলেটর স্টেট
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState("");

  // ১. অটো-রুল মোডাল স্টেট
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    title: "",
    type: "expense" as TransactionType,
    category: "ভাড়া",
    amount: 0,
    day_of_month: 1,
    payment_method: "bank" as PaymentMethodType,
    note: "",
  });
  const [savingRule, setSavingRule] = useState(false);

  // ২. নতুন আয় এন্ট্রি মোডাল
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    title: "",
    category: "সরকারি বেতন",
    amount: 0,
    income_date: new Date().toISOString().slice(0, 10),
    payment_method: "bank" as PaymentMethodType,
    note: "",
  });
  const [savingIncome, setSavingIncome] = useState(false);

  // ৩. নতুন ব্যয় এন্ট্রি মোডাল
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "ভাড়া",
    amount: 0,
    expense_date: new Date().toISOString().slice(0, 10),
    payment_method: "cash" as PaymentMethodType,
    note: "",
  });
  const [savingExpense, setSavingExpense] = useState(false);

  // ডিলিট স্টেট
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
    source: "salary_or_income" | "student_fee" | "expense" | "rule";
    amount: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // নির্বাচিত মাস পরিবর্তন হলে ডাটা ফেচ করা
  const loadMonthData = useCallback(async (mKey: string) => {
    setLoadingMonth(true);
    try {
      const data = await getMonthlyFinancialStatement(mKey);
      setSummary(data);
    } catch (err) {
      console.error(err);
      showToast("মাসিক ডাটা লোড করতে সমস্যা হয়েছে।", "error");
    } finally {
      setLoadingMonth(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedMonth !== initialSummary.selectedMonth) {
      loadMonthData(selectedMonth);
    }
  }, [selectedMonth, initialSummary.selectedMonth, loadMonthData]);

  // ফিল্টার করা লেনদেন তালিকা
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summary.transactions.filter((t) => {
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        String(t.amount).includes(q);

      const matchType = typeFilter === "all" || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [summary.transactions, search, typeFilter]);

  // ═══════════════ অটো-রুলস হ্যান্ডলারস ═══════════════
  function openAddRuleModal(type: TransactionType = "expense") {
    setEditingRule(null);
    setRuleForm({
      title: type === "income" ? "সরকারি কলেজ মূল বেতন" : "একাডেমি রুম ভাড়া",
      type,
      category: type === "income" ? "সরকারি বেতন" : "ভাড়া",
      amount: type === "income" ? 55000 : 15000,
      day_of_month: type === "income" ? 1 : 3,
      payment_method: type === "income" ? "bank" : "cash",
      note: type === "income" ? "প্রতি মাসের সরকারি মূল স্যালারি" : "মাসিক নির্ধারিত রুম ভাড়া",
    });
    setRuleModalOpen(true);
  }

  function openEditRuleModal(rule: RecurringRule) {
    setEditingRule(rule);
    setRuleForm({
      title: rule.title,
      type: rule.type,
      category: rule.category,
      amount: rule.amount,
      day_of_month: rule.day_of_month,
      payment_method: rule.payment_method,
      note: rule.note || "",
    });
    setRuleModalOpen(true);
  }

  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleForm.title.trim() || ruleForm.amount <= 0) {
      showToast("শিরোনাম ও টাকার সঠিক পরিমাণ দিন।", "error");
      return;
    }

    setSavingRule(true);
    if (editingRule) {
      const res = await updateRecurringRule(editingRule.id, ruleForm);
      setSavingRule(false);
      if (res.ok && res.data) {
        setSummary((prev) => ({
          ...prev,
          recurringRules: prev.recurringRules.map((r) => (r.id === editingRule.id ? res.data! : r)),
        }));
        showToast("অটোমেটিক রুল আপডেট হয়েছে ✓", "success");
        setRuleModalOpen(false);
        loadMonthData(selectedMonth);
      } else {
        showToast(res.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } else {
      const res = await createRecurringRule(ruleForm);
      setSavingRule(false);
      if (res.ok && res.data) {
        setSummary((prev) => ({
          ...prev,
          recurringRules: [...prev.recurringRules, res.data!],
        }));
        showToast("নতুন স্বয়ংক্রিয় রুল চালু হয়েছে!", "success");
        setRuleModalOpen(false);
        loadMonthData(selectedMonth);
      } else {
        showToast(res.message || "সংরক্ষণ করা যায়নি।", "error");
      }
    }
  }

  async function handleToggleRule(rule: RecurringRule) {
    const nextState = !rule.is_active;
    const res = await toggleRecurringRuleActive(rule.id, nextState);
    if (res.ok) {
      setSummary((prev) => ({
        ...prev,
        recurringRules: prev.recurringRules.map((r) => (r.id === rule.id ? { ...r, is_active: nextState } : r)),
      }));
      showToast(nextState ? `"${rule.title}" অটো-রুল সক্রিয় হয়েছে` : `"${rule.title}" অটো-রুল বন্ধ করা হয়েছে`, "info");
    }
  }

  // ═══════════════ নতুন আয় এন্ট্রি হ্যান্ডলার ═══════════════
  async function handleSaveIncome(e: React.FormEvent) {
    e.preventDefault();
    if (!incomeForm.title.trim() || incomeForm.amount <= 0) {
      showToast("আয়ের বিবরণ ও টাকার পরিমাণ দিন।", "error");
      return;
    }

    setSavingIncome(true);
    const res = await createIncomeRecord(incomeForm);
    setSavingIncome(false);
    if (res.ok) {
      showToast("নতুন আয় সফলভাবে যুক্ত হয়েছে ✓", "success");
      setIncomeModalOpen(false);
      setIncomeForm((prev) => ({ ...prev, title: "", amount: 0, note: "" }));
      loadMonthData(selectedMonth);
    } else {
      showToast(res.message || "সংরক্ষণ করা যায়নি।", "error");
    }
  }

  // ═══════════════ নতুন ব্যয় এন্ট্রি হ্যান্ডলার ═══════════════
  async function handleSaveExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseForm.title.trim() || expenseForm.amount <= 0) {
      showToast("খরচের বিবরণ ও টাকার পরিমাণ দিন।", "error");
      return;
    }

    setSavingExpense(true);
    const res = await createExpenseRecord(expenseForm);
    setSavingExpense(false);
    if (res.ok) {
      showToast("খরচ রেকর্ড সংরক্ষণ হয়েছে ✓", "success");
      setExpenseModalOpen(false);
      setExpenseForm((prev) => ({ ...prev, title: "", amount: 0, note: "" }));
      loadMonthData(selectedMonth);
    } else {
      showToast(res.message || "সংরক্ষণ করা যায়নি।", "error");
    }
  }

  // ═══════════════ ডিলিট হ্যান্ডলার (টাইপ-সেফ ফিক্স) ═══════════════
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);

    let res: ActionResult = { ok: false };
    if (deleteTarget.source === "salary_or_income") {
      res = await deleteIncomeRecord(deleteTarget.id);
    } else if (deleteTarget.source === "expense") {
      res = await deleteExpenseRecord(deleteTarget.id);
    } else if (deleteTarget.source === "rule") {
      res = await deleteRecurringRule(deleteTarget.id);
    }

    setDeleting(false);
    if (res.ok) {
      showToast("সফলভাবে মুছে ফেলা হয়েছে।", "success");
      setDeleteTarget(null);
      loadMonthData(selectedMonth);
    } else {
      showToast(res.message || "মুছে ফেলা যায়নি।", "error");
    }
  }

  // 🧮 ক্যালকুলেটর বাটন
  function handleCalcBtn(val: string) {
    if (val === "C") setCalcInput("");
    else if (val === "⌫") setCalcInput((prev) => prev.slice(0, -1));
    else if (val === "=") {
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

  function pasteCalcToExpense() {
    const num = Number(calcInput);
    if (isNaN(num) || num <= 0) return;
    setExpenseForm((prev) => ({ ...prev, amount: num }));
    setExpenseModalOpen(true);
    showToast(`৳${num} ব্যয়ের ফর্মে বসানো হয়েছে ✓`, "success");
  }

  return (
    <div>
      <PageHeader
        title="আয়-ব্যয় ও স্মার্ট ফাইন্যান্সিয়াল হাব"
        subtitle="সরকারি বেতন, একাডেমি টিউশন ফি, ফিক্সড বিল ও মাসিক নিট প্রফিট ট্র্যাকার"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* ক্যালকুলেটর বাটন */}
            <button
              type="button"
              onClick={() => setCalcOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 font-body text-xs font-bold text-sky-800 shadow-xs hover:bg-sky-100"
            >
              <span>🧮</span>
              <span>{calcOpen ? "ক্যালকুলেটর লুকান" : "ক্যালকুলেটর"}</span>
            </button>

            {/* প্রিন্ট স্টেটমেন্ট বাটন */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 font-body text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <span>🖨️ প্রিন্ট ভাউচার</span>
            </button>

            {/* + নতুন আয় বাটন */}
            <button
              type="button"
              onClick={() => setIncomeModalOpen(true)}
              className="flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 font-body text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
            >
              <span>+ আয় এন্ট্রি</span>
            </button>

            {/* + নতুন ব্যয় বাটন */}
            <PrimaryButton onClick={() => setExpenseModalOpen(true)}>
              <span>+ ব্যয় এন্ট্রি</span>
            </PrimaryButton>
          </div>
        }
      />

      {/* 🧮 ইন-বিল্ট স্মার্ট ক্যালকুলেটর */}
      {calcOpen && (
        <div className="mb-5 overflow-hidden rounded-[24px] border border-sky-200/90 bg-gradient-to-br from-sky-50 via-white to-sky-100/50 p-4 shadow-sh2 backdrop-blur-xl animate-soft-fade-in max-w-sm mx-auto">
          <div className="flex items-center justify-between border-b border-sky-200/70 pb-2 mb-3">
            <span className="font-body text-[12.5px] font-black text-sky-950">🧮 কুইক ফাইন্যান্স ক্যালকুলেটর</span>
            <button type="button" onClick={() => setCalcOpen(false)} className="text-xs font-bold text-muted hover:text-ink-800">
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
            onClick={pasteCalcToExpense}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 font-body text-[12.5px] font-black text-white shadow-xs hover:brightness-105 active:scale-95"
          >
            📥 ক্যালকুলেটরের টাকা ব্যয়ের ফর্মে বসান
          </button>
        </div>
      )}

      {/* 💎 ১. হিরো মান্থলি ফাইন্যান্স স্কোরকার্ড */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* ক. মোট আয় */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-[#ECFDF5] via-white to-white p-4 shadow-sh1">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">মোট মাসিক আয়</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-900">ইনফ্লো 🟢</span>
          </div>
          <p className="mt-2 font-body text-[24px] font-black text-emerald-950 sm:text-[26px]">
            {formatTaka(summary.totalIncome)}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] font-semibold text-muted">
            <span>বেতন: {formatTaka(summary.salaryIncome)}</span>
            <span>টিউশন: {formatTaka(summary.studentFeesIncome)}</span>
          </div>
        </div>

        {/* খ. মোট ব্যয় */}
        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-[#FFF1F2] via-white to-white p-4 shadow-sh1">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] font-extrabold uppercase tracking-wider text-rose-800">মোট মাসিক ব্যয়</span>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-900">আউটফ্লো 🔴</span>
          </div>
          <p className="mt-2 font-body text-[24px] font-black text-rose-950 sm:text-[26px]">
            {formatTaka(summary.totalExpense)}
          </p>
          <span className="mt-1 block font-body text-[11px] font-semibold text-muted">
            ফিক্সড বিল ও দৈনন্দিন পরিচালনা খরচ
          </span>
        </div>

        {/* গ. নিট প্রফিট / মাসিক সঞ্চয় (বড় গোল্ডেন কার্ড) */}
        <div className={`rounded-2xl border p-4 shadow-sh2 bg-gradient-to-br via-white to-white ${
          summary.netProfit >= 0 ? "border-emerald-300 from-[#D1FAE5]/60" : "border-rose-300 from-[#FFE4E6]/60"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-body text-[11px] font-black uppercase tracking-wider ${
              summary.netProfit >= 0 ? "text-emerald-900" : "text-rose-900"
            }`}>
              {summary.netProfit >= 0 ? "💎 নিট প্রফিট / সঞ্চয়" : "⚠️ নিট ঘাটতি"}
            </span>
            <span className="text-xs">💰</span>
          </div>
          <p className={`mt-2 font-body text-[24px] font-black sm:text-[28px] ${
            summary.netProfit >= 0 ? "text-emerald-950" : "text-rose-950"
          }`}>
            {formatTaka(summary.netProfit)}
          </p>
          <span className="mt-1 block font-body text-[11px] font-bold text-sky-950">
            খরচ বাদ দিয়ে মোট হাতে থাকা ব্যালেন্স
          </span>
        </div>

        {/* ঘ. নগদ বনাম ব্যাংক ব্যালেন্স */}
        <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-[#E0F2FE] via-white to-white p-4 shadow-sh1">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] font-extrabold uppercase tracking-wider text-sky-800">ক্যাশ ও ব্যাংক স্প্লিট</span>
            <span className="text-xs">🏦</span>
          </div>
          <div className="mt-2 space-y-1 font-body text-[12.5px]">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">হাতে নগদ:</span>
              <span className="font-black text-sky-950">{formatTaka(summary.cashIncome - summary.cashExpense)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">ব্যাংক/বিকাশ:</span>
              <span className="font-black text-sky-950">{formatTaka(summary.bankIncome - summary.bankExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ ২. অটোমেটিক পুনরাবৃত্তিমূলক রুলস ম্যানেজার (স্যালারি ও ফিক্সড বিল) */}
      <div className="mb-5 overflow-hidden rounded-[24px] border border-sky-200 bg-white shadow-sh1">
        <div
          onClick={() => setShowRulesSection((v) => !v)}
          className="flex cursor-pointer items-center justify-between bg-sky-50/70 p-4 transition-colors hover:bg-sky-100/60"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white text-xs font-bold">
              ⚡
            </span>
            <div>
              <h3 className="font-body text-[13.5px] font-black text-sky-950">
                স্বয়ংক্রিয় মাসিক বেতন ও ফিক্সড বিল ম্যানেজার (Auto Rules Engine)
              </h3>
              <p className="font-body text-[11px] text-sky-800">
                নির্ধারিত তারিখে স্বয়ংক্রিয়ভাবে স্যালারি ও ফিক্সড খরচ যুক্ত হওয়ার {toBengaliDigits(summary.recurringRules.length)}টি রুল সক্রিয়
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-body text-[11.5px] font-bold text-sky-700">
              {showRulesSection ? "ম্যানেজার লুকান ▲" : "রুলস দেখুন ও সেট করুন ▼"}
            </span>
          </div>
        </div>

        {showRulesSection && (
          <div className="p-4 border-t border-sky-100 bg-white">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-body text-[12px] font-semibold text-muted">
                স্যার এখানে তারিখ ও টাকা সেট করে রাখলে প্রতি মাসের ওই তারিখে স্বয়ংক্রিয়ভাবে এন্ট্রি হয়ে যাবে।
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openAddRuleModal("income")}
                  className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  + অটো বেতন রুল
                </button>
                <button
                  type="button"
                  onClick={() => openAddRuleModal("expense")}
                  className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 hover:bg-rose-100"
                >
                  + অটো বিল/খরচ রুল
                </button>
              </div>
            </div>

            {summary.recurringRules.length === 0 ? (
              <p className="py-4 text-center font-body text-xs text-muted">কোনো অটো-রুল সেট করা নেই। উপরের বাটনে চাপ দিয়ে রুল সেট করুন।</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.recurringRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 shadow-2xs transition-all ${
                      rule.is_active
                        ? rule.type === "income"
                          ? "border-emerald-200 bg-emerald-50/30"
                          : "border-rose-200 bg-rose-50/30"
                        : "border-slate-200 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${rule.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="font-body text-[13px] font-bold text-sky-950">{rule.title}</span>
                      </div>
                      <p className="mt-1 font-body text-[11px] text-muted">
                        প্রতি মাসের <b className="text-sky-950">{toBengaliDigits(rule.day_of_month)} তারিখ</b> · {rule.category}
                      </p>
                      <p className={`mt-0.5 font-body text-[13.5px] font-black ${rule.type === "income" ? "text-emerald-800" : "text-rose-800"}`}>
                        {rule.type === "income" ? "+ " : "- "}
                        {formatTaka(rule.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule)}
                        className={`rounded-lg px-2 py-1 text-[10.5px] font-bold ${
                          rule.is_active ? "bg-white text-slate-700 border border-slate-200" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {rule.is_active ? "পজ" : "অন"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditRuleModal(rule)}
                        className="rounded-lg border border-slate-200 bg-white p-1 text-slate-700 hover:text-sky-600"
                        title="এডিট"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: rule.id, title: rule.title, source: "rule", amount: rule.amount })}
                        className="rounded-lg border border-rose-200 bg-rose-50 p-1 text-danger hover:bg-rose-100"
                        title="মুছুন"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📅 ৩. মাস নির্বাচন, সার্চ ও ফিল্টার বার */}
      <div className="mb-5 overflow-hidden rounded-[22px] border border-border-base/80 bg-white p-4 shadow-sh1 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-xs font-bold text-sky-950">📅 স্টেটমেন্ট মাস:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-[38px] rounded-xl border border-sky-300 bg-sky-50 px-3 font-body text-[13px] font-black text-sky-900 outline-none focus:border-sky-600"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {loadingMonth && <span className="text-xs text-sky-600 font-bold animate-pulse">লোড হচ্ছে...</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <input
                type="text"
                placeholder="লেনদেন বিবরণ বা খাত দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-[38px] w-full rounded-full border border-border-base/80 bg-surface-muted/60 pl-8 pr-4 font-body text-[12.5px] text-ink-800 outline-none focus:border-sky-600 focus:bg-white"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">🔍</span>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "income" | "expense")}
              className="h-[38px] rounded-xl border border-border-base bg-white px-3 font-body text-xs font-bold text-ink-800"
            >
              <option value="all">সকল লেনদেন (আয় ও ব্যয়)</option>
              <option value="income">🟢 শুধু আয় সমূহ</option>
              <option value="expense">🔴 শুধু ব্যয় সমূহ</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📋 ৪. একীভূত মান্থলি লেজার স্টেটমেন্ট টেবিল */}
      <div className="overflow-hidden rounded-[24px] border border-border-base/80 bg-white shadow-sh2">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-border-base bg-[#F8FAFC] font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="py-3.5 pl-4 pr-3">তারিখ</th>
                <th className="p-3.5">উৎস ও লেনদেন বিবরণ</th>
                <th className="p-3.5">খাত / ক্যাটাগরি</th>
                <th className="p-3.5">মাধ্যম</th>
                <th className="p-3.5">টাকার পরিমাণ</th>
                <th className="p-3.5">মন্তব্য / নোট</th>
                <th className="p-3.5 pr-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <EmptyState
                      title="এই মাসে কোনো লেনদেন রেকর্ড নেই"
                      hint="উপরে নতুন আয় বা ব্যয় এন্ট্রি করুন অথবা স্বয়ংক্রিয় রুলস চালু রাখুন।"
                    />
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors hover:bg-sky-50/40 ${
                        isIncome ? "bg-emerald-50/10" : "bg-white"
                      }`}
                    >
                      {/* তারিখ */}
                      <td className="whitespace-nowrap py-3.5 pl-4 pr-3 font-body text-xs text-muted">
                        {formatBengaliDate(tx.transaction_date)}
                      </td>

                      {/* বিবরণ */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{isIncome ? "🟢" : "🔴"}</span>
                          <div>
                            <p className="font-body text-[13.5px] font-black text-sky-950">
                              {tx.title}
                            </p>
                            {tx.is_recurring && (
                              <span className="inline-block rounded-md bg-sky-100 px-1.5 py-0.2 text-[9.5px] font-bold text-sky-800">
                                ⚡ অটো-মাসিক
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ক্যাটাগরি */}
                      <td className="p-3.5">
                        <Badge tone={isIncome ? "success" : "danger"}>
                          {tx.category}
                        </Badge>
                      </td>

                      {/* মাধ্যম */}
                      <td className="p-3.5">
                        <span className="font-body text-xs font-semibold text-slate-600">
                          {tx.payment_method === "bank" ? "🏦 ব্যাংক" : tx.payment_method === "bkash" ? "📱 বিকাশ" : "💵 নগদ"}
                        </span>
                      </td>

                      {/* টাকার পরিমাণ */}
                      <td className={`whitespace-nowrap p-3.5 font-black text-[15px] ${
                        isIncome ? "text-emerald-800" : "text-rose-800"
                      }`}>
                        {isIncome ? "+ " : "- "}
                        {formatTaka(tx.amount)}
                      </td>

                      {/* মন্তব্য */}
                      <td className="p-3.5 font-body text-xs text-slate-500 max-w-[180px] truncate">
                        {tx.note || "—"}
                      </td>

                      {/* অ্যাকশন */}
                      <td className="whitespace-nowrap p-3.5 pr-4 text-right">
                        {tx.source !== "student_fee" ? (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: tx.id, title: tx.title, source: tx.source, amount: tx.amount })}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-danger hover:bg-rose-100"
                            title="মুছে ফেলুন"
                          >
                            মুছুন
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-muted">টিউশন রসিদ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════ মোডাল ১: অটো-রুল তৈরি/এডিট ═══════════════ */}
      <Modal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title={editingRule ? "স্বয়ংক্রিয় রুল সম্পাদনা" : "নতুন মাসিক অটো-রুল সেট করুন"}
        description="নির্ধারিত তারিখে স্বয়ংক্রিয়ভাবে স্যালারি যোগ বা নির্দিষ্ট খরচ কাটার রুল কনফিগার করুন।"
      >
        <form onSubmit={handleSaveRule} className="space-y-3.5">
          <Field label="রুলের শিরোনাম বা নাম *" required>
            <TextInput
              required
              placeholder="যেমন: সরকারি কলেজ মূল বেতন / একাডেমি রুম ভাড়া"
              value={ruleForm.title}
              onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="লেনদেনের ধরন *" required>
              <Select
                value={ruleForm.type}
                onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value as TransactionType })}
              >
                <option value="income">🟢 আয় (যেমন: বেতন)</option>
                <option value="expense">🔴 ব্যয় (যেমন: ভাড়া/বিল)</option>
              </Select>
            </Field>

            <Field label="ক্যাটাগরি">
              <Select
                value={ruleForm.category}
                onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
              >
                {(ruleForm.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="টাকার পরিমাণ (৳) *" required>
              <TextInput
                type="number"
                required
                min={1}
                placeholder="55000"
                value={ruleForm.amount || ""}
                onChange={(e) => setRuleForm({ ...ruleForm, amount: Number(e.target.value) })}
              />
            </Field>

            <Field label="প্রতি মাসের কোন তারিখ কাটবে/যোগ হবে? *" required>
              <TextInput
                type="number"
                required
                min={1}
                max={31}
                placeholder="1"
                value={ruleForm.day_of_month || ""}
                onChange={(e) => setRuleForm({ ...ruleForm, day_of_month: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="পেমেন্টের মাধ্যম">
            <Select
              value={ruleForm.payment_method}
              onChange={(e) => setRuleForm({ ...ruleForm, payment_method: e.target.value as PaymentMethodType })}
            >
              <option value="bank">🏦 ব্যাংক অ্যাকাউন্ট</option>
              <option value="cash">💵 ক্যাশ / নগদ</option>
              <option value="bkash">📱 বিকাশ</option>
            </Select>
          </Field>

          <Field label="নোট / বিবরণ">
            <TextInput
              placeholder="যেমন: সোনালী ব্যাংক স্যালারি অ্যাকাউন্ট"
              value={ruleForm.note}
              onChange={(e) => setRuleForm({ ...ruleForm, note: e.target.value })}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setRuleModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={savingRule}>
              {savingRule ? "সংরক্ষণ হচ্ছে..." : editingRule ? "হালনাগাদ করুন" : "✓ রুল চালু করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ═══════════════ মোডাল ২: নতুন আয় এন্ট্রি ═══════════════ */}
      <Modal
        open={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        title="নতুন আয় এন্ট্রি করুন"
        description="সরকারি বেতন, স্পেশাল ব্যাচ ফি বা যেকোনো অতিরিক্ত আয় রেকর্ড করুন।"
      >
        <form onSubmit={handleSaveIncome} className="space-y-3.5">
          <Field label="আয়ের শিরোনাম বা বিবরণ *" required>
            <TextInput
              required
              placeholder="যেমন: সরকারি বেতন / স্পেশাল মডেল টেস্ট ফি"
              value={incomeForm.title}
              onChange={(e) => setIncomeForm({ ...incomeForm, title: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="আয়ের খাত / ক্যাটাগরি">
              <Select
                value={incomeForm.category}
                onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
              >
                {INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>

            <Field label="টাকার পরিমাণ (৳) *" required>
              <TextInput
                type="number"
                required
                min={1}
                placeholder="10000"
                value={incomeForm.amount || ""}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="আয়ের তারিখ *" required>
              <TextInput
                type="date"
                required
                value={incomeForm.income_date}
                onChange={(e) => setIncomeForm({ ...incomeForm, income_date: e.target.value })}
              />
            </Field>

            <Field label="মাধ্যম">
              <Select
                value={incomeForm.payment_method}
                onChange={(e) => setIncomeForm({ ...incomeForm, payment_method: e.target.value as PaymentMethodType })}
              >
                <option value="bank">🏦 ব্যাংক</option>
                <option value="cash">💵 নগদ</option>
                <option value="bkash">📱 বিকাশ</option>
              </Select>
            </Field>
          </div>

          <Field label="মন্তব্য / নোট">
            <TextInput
              placeholder="যেমন: চেক নং / রেফারেন্স"
              value={incomeForm.note}
              onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setIncomeModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <button
              type="submit"
              disabled={savingIncome}
              className="rounded-full bg-emerald-600 px-6 py-2.5 font-body text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              {savingIncome ? "সংরক্ষণ হচ্ছে..." : "✓ আয় জমা করুন"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════ মোডাল ৩: নতুন ব্যয় এন্ট্রি ═══════════════ */}
      <Modal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="নতুন ব্যয় / খরচ এন্ট্রি"
        description="ভাড়া, বিল, শিট প্রিন্টিং বা স্যারের যেকোনো খরচ রেকর্ড করুন।"
      >
        <form onSubmit={handleSaveExpense} className="space-y-3.5">
          <Field label="খরচের শিরোনাম বা বিবরণ *" required>
            <TextInput
              required
              placeholder="যেমন: ইংরেজি শিট প্রিন্টিং ও ফটোকপি"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="খরচের ক্যাটাগরি">
              <Select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>

            <Field label="টাকার পরিমাণ (৳) *" required>
              <TextInput
                type="number"
                required
                min={1}
                placeholder="1500"
                value={expenseForm.amount || ""}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="খরচের তারিখ *" required>
              <TextInput
                type="date"
                required
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
              />
            </Field>

            <Field label="মাধ্যম">
              <Select
                value={expenseForm.payment_method}
                onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value as PaymentMethodType })}
              >
                <option value="cash">💵 নগদ / ক্যাশ</option>
                <option value="bank">🏦 ব্যাংক</option>
                <option value="bkash">📱 বিকাশ</option>
              </Select>
            </Field>
          </div>

          <Field label="মন্তব্য / ভাউচার নোট">
            <TextInput
              placeholder="যেমন: ভাউচার নং ১০৪"
              value={expenseForm.note}
              onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
            />
          </Field>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-base/60 pt-4">
            <SecondaryButton type="button" onClick={() => setExpenseModalOpen(false)}>
              বাতিল
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={savingExpense}>
              {savingExpense ? "সংরক্ষণ হচ্ছে..." : "✓ খরচ সংরক্ষণ করুন"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* ═══════════════ মোডাল ৪: ডিলিট কনফার্মেশন (টাইপ-সেফ ফিক্স) ═══════════════ */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="রেকর্ড মুছে ফেলবেন?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-danger">
            🗑
          </div>
          <p className="font-body text-[13.5px] text-ink-800 leading-relaxed">
            আপনি কি নিশ্চিতভাবে <b className="text-sky-950">&quot;{deleteTarget?.title}&quot;</b> ({formatTaka(deleteTarget?.amount || 0)})-এর এই রেকর্ডটি মুছে ফেলতে চান?
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              বাতিল
            </SecondaryButton>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="rounded-full bg-danger px-5 py-2 font-body text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {deleting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
