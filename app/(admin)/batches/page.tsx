import { PageHeader, EmptyState } from "@/components/admin/ui";

export default function BatchesPage() {
  return (
    <>
      <PageHeader title="ব্যাচ ম্যানেজমেন্ট" subtitle="ব্যাচ তৈরি ও পরিচালনা" />
      <EmptyState
        title="এই সেকশনটি এখনো নির্মাণাধীন"
        hint="শীঘ্রই এই পেজে পূর্ণাঙ্গ ফিচার যুক্ত করা হবে।"
      />
    </>
  );
}
