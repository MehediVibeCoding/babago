import { getPaymentsData } from "@/app/actions/payments";
import PaymentsPageClient from "@/components/payments/PaymentsPageClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  try {
    const { payments, students, batches } = await getPaymentsData();

    return (
      <PaymentsPageClient
        initialPayments={payments}
        students={students}
        batches={batches}
      />
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-danger">
        <h1 className="mb-2 font-body text-lg font-bold">পেমেন্ট হিস্ট্রি লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-rose-500">
          টিপস: Supabase ডাটাবেজ কানেকশন বা পরিবেশ ভ্যারিয়েবল (Environment Variables) সঠিকভাবে সেট আছে কি না দেখে নিন।
        </p>
      </div>
    );
  }
}
