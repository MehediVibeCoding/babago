import { getMonthlyFinancialStatement } from "@/app/actions/finance";
import FinancePageClient from "@/components/expenses/ExpensesPageClient";

export const dynamic = "force-dynamic";

export default async function ExpensesFinancePage() {
  // একীভূত মাসিক আর্থিক স্টেটমেন্ট ফেচ করা (সরকারি বেতন + একাডেমি ফি + ফিক্সড বিল ও খরচ)
  const initialSummary = await getMonthlyFinancialStatement();

  return <FinancePageClient initialSummary={initialSummary} />;
}
