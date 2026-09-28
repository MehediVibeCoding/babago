import { getClassDiaryData } from "@/app/actions/class-diary";
import ClassDiaryPageClient from "@/components/class-diary/ClassDiaryPageClient";

export const dynamic = "force-dynamic";

export default async function ClassDiaryPage() {
  const { entries, batches } = await getClassDiaryData();

  return (
    <ClassDiaryPageClient
      initialEntries={entries}
      batches={batches}
    />
  );
}
