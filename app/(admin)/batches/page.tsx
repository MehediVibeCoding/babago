import { getBatchesData } from "@/app/actions/batches";
import BatchesPageClient from "@/components/batches/BatchesPageClient";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const { batches, students } = await getBatchesData();

  return (
    <BatchesPageClient
      initialBatches={batches}
      students={students}
    />
  );
}
