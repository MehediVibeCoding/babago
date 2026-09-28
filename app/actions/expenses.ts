"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { Expense, ExpenseCategory, Payment } from "@/lib/types";

const EXPENSES_TABLE = "expenses";
const PAYMENTS_TABLE = "payments";

export interface ExpenseActionResult {
  ok: boolean;
  message?: string;
  expense?: Expense;
}

export interface ExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  note?: string | null;
}

// ১. সকল খরচ ও পেমেন্ট ডাটা লোড করা (নিট ব্যালেন্স ও আয়ের সাথে মেলানোর জন্য)
export async function getExpensesData(): Promise<{
  expenses: Expense[];
  payments: Payment[];
}> {
  const supabase = await createAdminClient();

  const [
    { data: expensesData, error: eErr },
    { data: paymentsData, error: pErr },
  ] = await Promise.all([
    supabase.from(EXPENSES_TABLE).select("*").order("expense_date", { ascending: false }),
    supabase.from(PAYMENTS_TABLE).select("amount, for_month, created_at"),
  ]);

  if (eErr) console.error("Error fetching expenses:", eErr.message);
  if (pErr) console.error("Error fetching payments:", pErr.message);

  return {
    expenses: (expensesData || []) as Expense[],
    payments: (paymentsData || []) as Payment[],
  };
}

// ২. নতুন খরচ এন্ট্রি করা
export async function createExpense(input: ExpenseInput): Promise<ExpenseActionResult> {
  const supabase = await createAdminClient();

  const title = input.title?.trim();
  if (!title) return { ok: false, message: "খরচের শিরোনাম বা বিবরণ দিন।" };
  if (!input.amount || Number(input.amount) <= 0) {
    return { ok: false, message: "সঠিক টাকার পরিমাণ দিন।" };
  }
  if (!input.expense_date) return { ok: false, message: "খরচের তারিখ দিন।" };

  const { data, error } = await supabase
    .from(EXPENSES_TABLE)
    .insert({
      title,
      category: input.category || "অন্যান্য",
      amount: Number(input.amount),
      expense_date: input.expense_date,
      note: input.note?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, message: "খরচ সংরক্ষণ ব্যর্থ: " + error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  return { ok: true, expense: data as Expense };
}

// ৩. খরচ আপডেট করা
export async function updateExpense(
  id: string,
  input: ExpenseInput
): Promise<ExpenseActionResult> {
  const supabase = await createAdminClient();

  const title = input.title?.trim();
  if (!title) return { ok: false, message: "খরচের শিরোনাম বা বিবরণ দিন।" };
  if (!input.amount || Number(input.amount) <= 0) {
    return { ok: false, message: "সঠিক টাকার পরিমাণ দিন।" };
  }

  const { data, error } = await supabase
    .from(EXPENSES_TABLE)
    .update({
      title,
      category: input.category || "অন্যান্য",
      amount: Number(input.amount),
      expense_date: input.expense_date,
      note: input.note?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: "আপডেট ব্যর্থ: " + error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  return { ok: true, expense: data as Expense };
}

// ৪. খরচ মুছে ফেলা
export async function deleteExpense(id: string): Promise<ExpenseActionResult> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from(EXPENSES_TABLE).delete().eq("id", id);

  if (error) {
    return { ok: false, message: "মুছে ফেলা যায়নি: " + error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  return { ok: true };
  }
