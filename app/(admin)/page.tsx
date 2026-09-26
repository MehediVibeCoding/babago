import { getDashboardData } from "@/lib/dashboard";
import { STUDENTS } from "@/lib/mock-data";
import { bengaliDayName } from "@/lib/utils";
import { toBengaliDigits } from "@/lib/bengaliNumerals";
import StatGrid from "@/components/dashboard/StatGrid";
import TodayClasses from "@/components/dashboard/TodayClasses";
import DueAlerts from "@/components/dashboard/DueAlerts";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentPayments from "@/components/dashboard/RecentPayments";
import QuickActions from "@/components/dashboard/QuickActions";
import { PageHeader } from "@/components/admin/ui";

export default function DashboardPage() {
  const today = new Date();
  const data = getDashboardData(today);
  const todayLabel = `${bengaliDayName(today.getDay())}বার, ${toBengaliDigits(today.getDate())} তারিখ`;

  return (
    <>
      <PageHeader title="ড্যাশবোর্ড" subtitle="Ahsan's Learning Academy — অ্যাডমিন প্যানেল ওভারভিউ" />

      <StatGrid
        totalStudents={data.totalStudents}
        totalBatches={data.totalBatches}
        collectedThisMonth={data.collectedThisMonth}
        collectedLifetime={data.collectedLifetime}
        dueCount={data.dueStudents.length}
        todaysClassCount={data.todaysBatches.length}
        publishedBlogCount={data.publishedBlogCount}
      />

      <QuickActions />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RevenueChart data={data.revenueTrend} />
        <TodayClasses batches={data.todaysBatches} todayLabel={todayLabel} />
      </div>

      <DueAlerts items={data.dueStudents} />

      <div className="mt-5">
        <RecentPayments payments={data.recentPayments} students={STUDENTS} />
      </div>
    </>
  );
}
