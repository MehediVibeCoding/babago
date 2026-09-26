import { PageHeader, EmptyState } from "@/components/admin/ui";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="সেটিংস" subtitle="অ্যাকাউন্ট ও প্যানেল সেটিংস" />
      <EmptyState
        title="এই সেকশনটি এখনো নির্মাণাধীন"
        hint="শীঘ্রই এই পেজে পূর্ণাঙ্গ ফিচার যুক্ত করা হবে।"
      />
    </>
  );
}
