import { getClassroomPhotos } from "@/app/actions/classroom";
import ClassroomGalleryClient from "@/components/gallery/ClassroomGalleryClient";

export const dynamic = "force-dynamic";

export default async function ClassroomGalleryPage() {
  try {
    const photos = await getClassroomPhotos();

    return <ClassroomGalleryClient initialPhotos={photos} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-danger">
        <h1 className="mb-2 font-body text-lg font-bold">ক্লাসরুম ছবি লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-rose-500">
          টিপস: Supabase ডাটাবেজে classroom_photos টেবিল তৈরি করা আছে কি না এবং পরিবেশ ভ্যারিয়েবল ঠিক আছে কি না দেখে নিন।
        </p>
      </div>
    );
  }
}
