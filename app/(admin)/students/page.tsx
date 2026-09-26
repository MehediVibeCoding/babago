import { PageHeader, EmptyState } from "@/components/admin/ui";

export default function StudentsPage() {
  return (
    <>
      <PageHeader title="শিক্ষার্থী" subtitle="শিক্ষার্থীদের তালিকা, ভর্তি ও তথ্য ব্যবস্থাপনা" />
      <EmptyState
        title="এই সেকশনটি এখনো নির্মাণাধীন"
        hint="শীঘ্রই এই পেজে পূর্ণাঙ্গ ফিচার যুক্ত করা হবে।"
      />
    </>
  );
}
