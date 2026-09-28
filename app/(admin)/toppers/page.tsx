import { getSuccessToppers } from "@/app/actions/toppers";
import ToppersPageClient from "@/components/toppers/ToppersPageClient";

export const dynamic = "force-dynamic";

export default async function ToppersPage() {
  const toppers = await getSuccessToppers();

  return <ToppersPageClient initialToppers={toppers} />;
}
