import { getPaymentsData } from "@/app/actions/payments";
import PaymentsPageClient from "@/components/payments/PaymentsPageClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const { payments, students, batches } = await getPaymentsData();

  return (
    <PaymentsPageClient
      initialPayments={payments}
      students={students}
      batches={batches}
    />
  );
}
