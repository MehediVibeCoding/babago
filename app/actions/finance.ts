"use server";

import { dhakaNow } from "@/lib/date";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export type TransactionType = "income" | "expense";
export type PaymentMethodType = "cash" | "bank" | "bkash" | "other";

export interface RecurringRule {
  id: string;
  title: string;
  type: TransactionType;
  category: string;
  amount: number;
  day_of_month: number;
  payment_method: PaymentMethodType;
  is_active: boolean;
  last_applied_month: string | null;
  note: string | null;
  created_at: string;
}

export interface UnifiedTransaction {
  id: string;
  title: string;
  type: TransactionType;
  category: string;
  amount: number;
  transaction_date: string; // YYYY-MM-DD
  payment_method: PaymentMethodType;
  note: string | null;
  is_recurring: boolean;
  source: "salary_or_income" | "student_fee" | "expense";
  created_at: string;
}

export interface MonthlyFinancialSummary {
  selectedMonth: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  salaryIncome: number;
  studentFeesIncome: number;
  otherIncome: number;
  cashIncome: number;
  bankIncome: number;
  cashExpense: number;
  bankExpense: number;
  transactions: UnifiedTransaction[];
  recurringRules: RecurringRule[];
}

export interface ActionResult<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
}

// ══════════════════════════════════════════════════════════════════════
// ⚡ ১. স্মার্ট অটো-লগ ইঞ্জিন (প্রতি মাসের স্যালারি ও ফিক্সড বিল অটো-এন্ট্রি)
// ══════════════════════════════════════════════════════════════════════
export async function applyPendingRecurringRules(): Promise<{ appliedCount: number }> {
  try {
    const supabase = await createAdminClient();
    const today = dhakaNow();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDay = today.getDate();

    // সক্রিয় রুলস ফেচ করা
    const { data: rules, error } = await supabase
      .from("recurring_finance_rules")
      .select("*")
      .eq("is_active", true);

    if (error || !rules || rules.length === 0) {
      return { appliedCount: 0 };
    }

    let applied = 0;

    for (const rule of rules) {
      // যদি চলতি মাসে ইতিমধ্যে এই রুলের এন্ট্রি পড়ে থাকে, তবে স্কিপ করো
      if (rule.last_applied_month === currentYearMonth) continue;

      // যদি আজকের তারিখ রুলের নির্ধারিত তারিখ বা তার বেশি হয়, তবে অটো-লগ করো
      if (currentDay >= rule.day_of_month) {
        const transDate = `${currentYearMonth}-${String(rule.day_of_month).padStart(2, "0")}`;

        if (rule.type === "income") {
          await supabase.from("income_records").insert({
            title: rule.title,
            category: rule.category || "সরকারি বেতন",
            amount: Number(rule.amount),
            income_date: transDate,
            payment_method: rule.payment_method || "bank",
            note: rule.note ? `${rule.note} (স্বয়ংক্রিয় মাসিক এন্ট্রি)` : `স্বয়ংক্রিয় মাসিক আয় [${rule.day_of_month} তারিখ]`,
            recurring_rule_id: rule.id,
          });
        } else {
          await supabase.from("expenses").insert({
            title: rule.title,
            category: rule.category || "ভাড়া",
            amount: Number(rule.amount),
            expense_date: transDate,
            payment_method: rule.payment_method || "cash",
            note: rule.note ? `${rule.note} (স্বয়ংক্রিয় মাসিক এন্ট্রি)` : `স্বয়ংক্রিয় মাসিক খরচ [${rule.day_of_month} তারিখ]`,
            recurring_rule_id: rule.id,
          });
        }

        // রুলের last_applied_month আপডেট
        await supabase
          .from("recurring_finance_rules")
          .update({ last_applied_month: currentYearMonth })
          .eq("id", rule.id);

        applied++;
      }
    }

    if (applied > 0) {
      revalidatePath("/expenses");
    }

    return { appliedCount: applied };
  } catch (err) {
    console.error("applyPendingRecurringRules error:", err);
    return { appliedCount: 0 };
  }
}

// ══════════════════════════════════════════════════════════════════════
// 📊 ২. একীভূত মাসিক আর্থিক স্টেটমেন্ট ফেচ করা (বেতন + টিউশন ফি + খরচ)
// ══════════════════════════════════════════════════════════════════════
export async function getMonthlyFinancialStatement(
  monthKey?: string // YYYY-MM
): Promise<MonthlyFinancialSummary> {
  const supabase = await createAdminClient();
  const now = dhakaNow();
  const targetMonth = monthKey || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // প্রথমে পেন্ডিং অটো-রুলস অ্যাপ্লাই করে নেওয়া
  await applyPendingRecurringRules();

  // প্যারালাল ডাটা ফেচিং (সরকারি/এক্সট্রা আয় + টিউশন ফি কালেকশন + খরচ + অটো-রুলস)
  const [
    { data: incomeData },
    { data: paymentsData },
    { data: expensesData },
    { data: rulesData },
    { data: studentsData },
  ] = await Promise.all([
    supabase
      .from("income_records")
      .select("*")
      .order("income_date", { ascending: false }),
    supabase
      .from("payments")
      .select("id, student_id, amount, method, for_month, note, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false }),
    supabase
      .from("recurring_finance_rules")
      .select("*")
      .order("day_of_month", { ascending: true }),
    supabase
      .from("students")
      .select("id, full_name, batch_name_snapshot"),
  ]);

  const studentNameMap = new Map<string, string>();
  (studentsData || []).forEach((s) => studentNameMap.set(s.id, s.full_name));

  const transactions: UnifiedTransaction[] = [];

  let salaryIncome = 0;
  let otherIncome = 0;
  let studentFeesIncome = 0;
  let totalExpense = 0;

  let cashIncome = 0;
  let bankIncome = 0;
  let cashExpense = 0;
  let bankExpense = 0;

  // ক. সরকারি ও সাধারণ আয়ের হিসাব
  (incomeData || []).forEach((inc) => {
    const incMonth = (inc.income_date as string).slice(0, 7);
    if (incMonth === targetMonth) {
      const amt = Number(inc.amount) || 0;
      if (inc.category === "সরকারি বেতন" || inc.title.includes("বেতন")) {
        salaryIncome += amt;
      } else {
        otherIncome += amt;
      }

      if (inc.payment_method === "cash") cashIncome += amt;
      else bankIncome += amt;

      transactions.push({
        id: inc.id,
        title: inc.title,
        type: "income",
        category: inc.category || "অন্যান্য আয়",
        amount: amt,
        transaction_date: inc.income_date,
        payment_method: inc.payment_method || "bank",
        note: inc.note,
        is_recurring: !!inc.recurring_rule_id,
        source: "salary_or_income",
        created_at: inc.created_at,
      });
    }
  });

  // খ. শিক্ষার্থীদের টিউশন ফি কালেকশন
  (paymentsData || []).forEach((p) => {
    const pMonth = (p.for_month as string).slice(0, 7);
    if (pMonth === targetMonth) {
      const amt = Number(p.amount) || 0;
      studentFeesIncome += amt;

      if (p.method === "cash") cashIncome += amt;
      else bankIncome += amt;

      const studentName = studentNameMap.get(p.student_id) || "শিক্ষার্থী ফি";

      transactions.push({
        id: `pay_${p.id}`,
        title: `${studentName} — একাডেমি টিউশন ফি`,
        type: "income",
        category: "একাডেমি টিউশন ফি",
        amount: amt,
        transaction_date: p.created_at ? p.created_at.slice(0, 10) : `${targetMonth}-01`,
        payment_method: p.method === "cash" ? "cash" : "bkash",
        note: p.note,
        is_recurring: false,
        source: "student_fee",
        created_at: p.created_at,
      });
    }
  });

  // গ. খরচের হিসাব
  (expensesData || []).forEach((exp) => {
    const expMonth = (exp.expense_date as string).slice(0, 7);
    if (expMonth === targetMonth) {
      const amt = Number(exp.amount) || 0;
      totalExpense += amt;

      if (exp.payment_method === "cash") cashExpense += amt;
      else bankExpense += amt;

      transactions.push({
        id: exp.id,
        title: exp.title,
        type: "expense",
        category: exp.category || "অন্যান্য খরচ",
        amount: amt,
        transaction_date: exp.expense_date,
        payment_method: exp.payment_method || "cash",
        note: exp.note,
        is_recurring: !!exp.recurring_rule_id,
        source: "expense",
        created_at: exp.created_at,
      });
    }
  });

  // তারিখ অনুযায়ী সর্বশেষ লেনদেন ওপরে সাজানো
  transactions.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  const totalIncome = salaryIncome + otherIncome + studentFeesIncome;
  const netProfit = totalIncome - totalExpense;

  return {
    selectedMonth: targetMonth,
    totalIncome,
    totalExpense,
    netProfit,
    salaryIncome,
    studentFeesIncome,
    otherIncome,
    cashIncome,
    bankIncome,
    cashExpense,
    bankExpense,
    transactions,
    recurringRules: (rulesData || []) as RecurringRule[],
  };
}

// ══════════════════════════════════════════════════════════════════════
// ⚙️ ৩. অটো-রুলস CRUD (Fixed Salary & Recurring Bills Management)
// ══════════════════════════════════════════════════════════════════════
export async function createRecurringRule(input: {
  title: string;
  type: TransactionType;
  category: string;
  amount: number;
  day_of_month: number;
  payment_method?: PaymentMethodType;
  note?: string;
}): Promise<ActionResult<RecurringRule>> {
  const supabase = await createAdminClient();

  const title = input.title?.trim();
  if (!title) return { ok: false, message: "রুলের নাম বা শিরোনাম দিন।" };
  if (!input.amount || Number(input.amount) <= 0) return { ok: false, message: "সঠিক টাকার পরিমাণ দিন।" };
  if (!input.day_of_month || input.day_of_month < 1 || input.day_of_month > 31) {
    return { ok: false, message: "১ থেকে ৩১ এর মধ্যে মাসের একটি তারিখ দিন।" };
  }

  const { data, error } = await supabase
    .from("recurring_finance_rules")
    .insert({
      title,
      type: input.type,
      category: input.category || "সাধারণ",
      amount: Number(input.amount),
      day_of_month: Number(input.day_of_month),
      payment_method: input.payment_method || (input.type === "income" ? "bank" : "cash"),
      is_active: true,
      note: input.note?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "অটো-রুল তৈরি ব্যর্থ: " + error.message };
  }

  revalidatePath("/expenses");
  return { ok: true, data: data as RecurringRule };
}

export async function updateRecurringRule(
  id: string,
  input: {
    title: string;
    type: TransactionType;
    category: string;
    amount: number;
    day_of_month: number;
    payment_method?: PaymentMethodType;
    note?: string;
  }
): Promise<ActionResult<RecurringRule>> {
  const supabase = await createAdminClient();

  const title = input.title?.trim();
  if (!title) return { ok: false, message: "রুলের নাম দিন।" };
  if (!input.amount || Number(input.amount) <= 0) return { ok: false, message: "সঠিক টাকার পরিমাণ দিন।" };

  const { data, error } = await supabase
    .from("recurring_finance_rules")
    .update({
      title,
      type: input.type,
      category: input.category,
      amount: Number(input.amount),
      day_of_month: Number(input.day_of_month),
      payment_method: input.payment_method,
      note: input.note?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/expenses");
  return { ok: true, data: data as RecurringRule };
}

export async function toggleRecurringRuleActive(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("recurring_finance_rules")
    .update({ is_active })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "স্ট্যাটাস পরিবর্তন ব্যর্থ: " + error.message };
  }

  revalidatePath("/expenses");
  return { ok: true };
}

export async function deleteRecurringRule(id: string): Promise<ActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from("recurring_finance_rules").delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/expenses");
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════════════
// ➕ ৪. ম্যানুয়াল অতিরিক্ত আয় এন্ট্রি CRUD (Honorarium, Special Batch, Books)
// ══════════════════════════════════════════════════════════════════════
export async function createIncomeRecord(input: {
  title: string;
  category: string;
  amount: number;
  income_date: string;
  payment_method: PaymentMethodType;
  note?: string;
}): Promise<ActionResult> {
  const supabase = await createAdminClient();

  const title = input.title?.trim();
  if (!title) return { ok: false, message: "আয়ের শিরোনাম দিন।" };
  if (!input.amount || Number(input.amount) <= 0) return { ok: false, message: "সঠিক টাকার পরিমাণ দিন।" };
  if (!input.income_date) return { ok: false, message: "আয়ের তারিখ দিন।" };

  const { data, error } = await supabase
    .from("income_records")
    .insert({
      title,
      category: input.category || "অন্যান্য আয়",
      amount: Number(input.amount),
      income_date: input.income_date,
      payment_method: input.payment_method || "bank",
      note: input.note?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আয় সংরক্ষণ ব্যর্থ: " + error.message };
  }

  revalidatePath("/expenses");
  return { ok: true, data };
}

export async function deleteIncomeRecord(id: string): Promise<ActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from("income_records").delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/expenses");
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════════════
// ➖ ৫. খরচ এন্ট্রি CRUD (Expenses)
// ══════════════════════════════════════════════════════════════════════
export async function createExpenseRecord(input: {
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  payment_method?: PaymentMethodType;
  note?: string;
}): Promise<ActionResult> {
  const supabase = await createAdminClient();

  const title = input.title?.trim();
  if (!title) return { ok: false, message: "খরচের শিরোনাম দিন।" };
  if (!input.amount || Number(input.amount) <= 0) return { ok: false, message: "সঠিক টাকার পরিমাণ দিন।" };
  if (!input.expense_date) return { ok: false, message: "খরচের তারিখ দিন।" };

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      title,
      category: input.category || "অন্যান্য",
      amount: Number(input.amount),
      expense_date: input.expense_date,
      payment_method: input.payment_method || "cash",
      note: input.note?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "খরচ সংরক্ষণ ব্যর্থ: " + error.message };
  }

  revalidatePath("/expenses");
  return { ok: true, data };
}

export async function deleteExpenseRecord(id: string): Promise<ActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/expenses");
  return { ok: true };
    }
