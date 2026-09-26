import { PageHeader, EmptyState } from "@/components/admin/ui";

export default function StaffPage() {
  return (
    <>
      <PageHeader title="স্টাফ ও বেতন" subtitle="স্টাফ তথ্য ও বেতন প্রদান" />
      <EmptyState
        title="এই সেকশনটি এখনো নির্মাণাধীন"
        hint="শীঘ্রই এই পেজে পূর্ণাঙ্গ ফিচার যুক্ত করা হবে।"
      />
    </>
  );
}
