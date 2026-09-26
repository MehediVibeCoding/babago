import { PageHeader, EmptyState } from "@/components/admin/ui";

export default function BlogPage() {
  return (
    <>
      <PageHeader title="ব্লগ ও আর্টিকেল" subtitle="ব্লগ পোস্ট লেখা ও প্রকাশনা" />
      <EmptyState
        title="এই সেকশনটি এখনো নির্মাণাধীন"
        hint="শীঘ্রই এই পেজে পূর্ণাঙ্গ ফিচার যুক্ত করা হবে।"
      />
    </>
  );
}
