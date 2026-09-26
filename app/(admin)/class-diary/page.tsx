import { PageHeader, EmptyState } from "@/components/admin/ui";

export default function ClassDiaryPage() {
  return (
    <>
      <PageHeader title="ক্লাস ডায়েরি" subtitle="দৈনিক ক্লাসের নোট ও স্লাইড রেকর্ড" />
      <EmptyState
        title="এই সেকশনটি এখনো নির্মাণাধীন"
        hint="শীঘ্রই এই পেজে পূর্ণাঙ্গ ফিচার যুক্ত করা হবে।"
      />
    </>
  );
}
