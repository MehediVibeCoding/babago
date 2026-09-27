import { getMonthlyFinancialStatement } from "@/app/actions/finance";
import FinancePageClient from "@/components/expenses/ExpensesPageClient";

export const dynamic = "force-dynamic";

export default async function ExpensesFinancePage() {
  try {
    // একীভূত মাসিক আর্থিক স্টেটমেন্ট ফেচ করা (সরকারি বেতন + একাডেমি ফি + ফিক্সড বিল ও খরচ)
    const initialSummary = await getMonthlyFinancialStatement();

    return <FinancePageClient initialSummary={initialSummary} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-danger">
        <h1 className="mb-2 font-body text-lg font-bold">ফাইন্যান্সিয়াল ডাটা লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-rose-500">
          টিপস: Supabase ডাটাবেজে recurring_finance_rules ও income_records টেবিল তৈরি করা আছে কি না এবং পরিবেশ ভ্যারিয়েবল ঠিক আছে কি না দেখে নিন।
        </p>
      </div>
    );
  }
}
