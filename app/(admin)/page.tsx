import { getLiveDashboardData } from "@/app/actions/dashboard";
import StatGrid from "@/components/dashboard/StatGrid";
import TodayClasses from "@/components/dashboard/TodayClasses";
import DueAlerts from "@/components/dashboard/DueAlerts";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentPayments from "@/components/dashboard/RecentPayments";
import QuickActions from "@/components/dashboard/QuickActions";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Supabase থেকে সরাসরি রিয়েলটাইম লাইভ ডাটা ফেচ করা (মক ডাটা সম্পূর্ণ রিমুভ)
  const data = await getLiveDashboardData();

  return (
    <>
      <PageHeader
        title="ড্যাশবোর্ড"
        subtitle="Ahsan's Learning Academy — রিয়েলটাইম একাডেমি ও ফাইন্যান্সিয়াল ওভারভিউ"
      />

      <StatGrid
        totalStudents={data.totalStudents}
        totalBatches={data.totalBatches}
        collectedThisMonth={data.collectedThisMonth}
        collectedLifetime={data.collectedLifetime}
        dueCount={data.dueCount}
        todaysClassCount={data.todaysClassCount}
        publishedBlogCount={data.publishedBlogCount}
      />

      <div className="mt-5">
        <QuickActions />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RevenueChart data={data.revenueTrend} />
        <TodayClasses batches={data.todaysBatches} todayLabel={data.todayLabel} />
      </div>

      <DueAlerts items={data.dueStudents} />

      <div className="mt-5">
        <RecentPayments payments={data.recentPayments} students={data.allStudents} />
      </div>
    </>
  );
}
