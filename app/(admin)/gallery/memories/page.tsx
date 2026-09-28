import { getFarewellMemories } from "@/app/actions/memories";
import MemoriesGalleryClient from "@/components/gallery/MemoriesGalleryClient";

export const dynamic = "force-dynamic";

export default async function MemoriesGalleryPage() {
  const memories = await getFarewellMemories();

  return <MemoriesGalleryClient initialMemories={memories} />;
}
