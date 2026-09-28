import { getBlogPostsData } from "@/app/actions/blog";
import BlogPageClient from "@/components/blog/BlogPageClient";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getBlogPostsData();

  return <BlogPageClient initialPosts={posts} />;
}
