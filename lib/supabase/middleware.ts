import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  const adminEmail = process.env.ADMIN_EMAIL;

  // ইউজার ভ্যালিড কি না এবং তার ইমেইল ADMIN_EMAIL এর সাথে মিলছে কি না
  const isAdmin = !!user && !!adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase();

  // ১. অ্যাডমিন না হলে এবং লগইন পেজে না থাকলে -> সরাসরি /login এ পাঠিয়ে দাও
  if (!isAdmin && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ২. ইতোমধ্যে অ্যাডমিন হিসেবে লগইন থাকলে -> /login এ ঢুকতে না দিয়ে সোজা ড্যাশবোর্ডে (/) নিয়ে যাও
  if (isAdmin && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
