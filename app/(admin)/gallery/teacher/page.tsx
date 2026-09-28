import { getTeacherPhotos } from "@/app/actions/teacher-photos";
import TeacherPhotosClient from "@/components/gallery/TeacherPhotosClient";

export const dynamic = "force-dynamic";

export default async function TeacherPhotosPage() {
  const photos = await getTeacherPhotos();

  return <TeacherPhotosClient initialPhotos={photos} />;
}
