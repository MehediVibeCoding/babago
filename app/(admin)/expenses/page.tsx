import { PageHeader, EmptyState } from "@/components/admin/ui";

export default function ExpensesPage() {
  return (
    <>
      <PageHeader title="খরচ" subtitle="প্রাতিষ্ঠানিক খরচের হিসাব" />
      <EmptyState
        title="এই সেকশনটি এখনো নির্মাণাধীন"
        hint="শীঘ্রই এই পেজে পূর্ণাঙ্গ ফিচার যুক্ত করা হবে।"
      />
    </>
  );
}
