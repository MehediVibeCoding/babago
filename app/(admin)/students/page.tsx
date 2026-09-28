import { getStudentsData } from "@/app/actions/students";
import StudentsPageClient from "@/components/students/StudentsPageClient";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const { students, batches, payments } = await getStudentsData();

  return (
    <StudentsPageClient
      initialStudents={students}
      batches={batches}
      payments={payments}
    />
  );
}
