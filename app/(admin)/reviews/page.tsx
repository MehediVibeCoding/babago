import { getTestimonials } from "@/app/actions/reviews";
import ReviewsPageClient from "@/components/reviews/ReviewsPageClient";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const testimonials = await getTestimonials();

  return <ReviewsPageClient initialTestimonials={testimonials} />;
}
