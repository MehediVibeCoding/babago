import { PageHeader, EmptyState } from "@/components/admin/ui";

export default function PaymentsPage() {
  return (
    <>
      <PageHeader title="বেতন/পেমেন্ট" subtitle="বেতন ও পেমেন্ট রেকর্ড ব্যবস্থাপনা" />
      <EmptyState
        title="এই সেকশনটি এখনো নির্মাণাধীন"
        hint="শীঘ্রই এই পেজে পূর্ণাঙ্গ ফিচার যুক্ত করা হবে।"
      />
    </>
  );
}
