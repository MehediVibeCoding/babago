import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** সেশন-ভিত্তিক Supabase ক্লায়েন্ট (anon key + লগইন কুকি)। ডেটার সুরক্ষা ডাটাবেজের RLS দেখে। */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component থেকে কল হলে middleware সেশন রিফ্রেশ পরিচালনা করে
          }
        },
      },
    }
  );
}

/**
 * প্রতিটি Server Action ও ডেটা-ফেচের প্রবেশদ্বার।
 * Middleware ছাড়াও এখানে আবার যাচাই হয় (defense in depth): লগইন করা এবং ইমেইল
 * ADMIN_EMAIL-এর সাথে মিললেই কেবল ক্লায়েন্ট পাওয়া যায়, নইলে এরর।
 * ডাটাবেজের RLS-ও একই অ্যাডমিন ইমেইল চেক করে।
 */
export async function createAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = !!user && !!adminEmail && user.email?.toLowerCase() === adminEmail;

  if (!isAdmin) {
    throw new Error("UNAUTHORIZED");
  }
  return supabase;
}
