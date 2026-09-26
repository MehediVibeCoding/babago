import { getBatchesData } from "@/app/actions/batches";
import BatchesPageClient from "@/components/batches/BatchesPageClient";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  try {
    const { batches, students } = await getBatchesData();

    return (
      <BatchesPageClient
        initialBatches={batches}
        students={students}
      />
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-danger">
        <h1 className="mb-2 font-body text-lg font-bold">ব্যাচের তালিকা লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-rose-500">
          টিপস: Supabase ডাটাবেজ কানেকশন বা পরিবেশ ভ্যারিয়েবল (Environment Variables) সঠিকভাবে সেট আছে কি না দেখে নিন।
        </p>
      </div>
    );
  }
}
