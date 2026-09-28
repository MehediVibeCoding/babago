import { getClassroomPhotos } from "@/app/actions/classroom";
import ClassroomGalleryClient from "@/components/gallery/ClassroomGalleryClient";

export const dynamic = "force-dynamic";

export default async function ClassroomGalleryPage() {
  const photos = await getClassroomPhotos();

  return <ClassroomGalleryClient initialPhotos={photos} />;
}
