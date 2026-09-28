import { getVideoLectures } from "@/app/actions/videos";
import VideosPageClient from "@/components/videos/VideosPageClient";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const videos = await getVideoLectures();

  return <VideosPageClient initialVideos={videos} />;
}
