# Ahsan's Learning Academy — অ্যাডমিন প্যানেল

Next.js 16 + React 19 + Supabase। শিক্ষার্থী, বেতন, ব্যাচ, খরচ/আয় ও ওয়েবসাইটের কন্টেন্ট ম্যানেজমেন্ট।
একই Supabase ডাটাবেজ মূল সাইট (`test` রিপো) ব্যবহার করে।

## চালানো
```bash
cp .env.example .env.local   # মান বসান
npm install
npm run dev
```

## নিরাপত্তা কাঠামো (তিন স্তর)
1. `proxy.ts` (Middleware): লগইন না থাকলে বা ইমেইল `ADMIN_EMAIL` না হলে `/login`।
2. প্রতিটি Server Action `createAdminClient()` দিয়ে শুরু হয় — আবার অ্যাডমিন যাচাই করে (`lib/supabase/server.ts`)।
3. ডাটাবেজ RLS: `is_admin()` ফাংশন JWT-র ইমেইল দেখে। **`ADMIN_EMAIL` এবং ডাটাবেজের `is_admin()`-এর ইমেইল একই হতে হবে।**

`service_role` key এই প্রজেক্টে ব্যবহার হয় না, ব্যবহার করবেন না।

## সময়
সব তারিখ/মাস ঢাকার সময় (`lib/date.ts`) ধরে হিসাব হয়। বকেয়া: ভর্তির তারিখ থেকে সম্পূর্ণ হওয়া প্রতিটি মাস আলাদাভাবে পরিশোধিত কিনা দেখা হয়; অগ্রিম টাকা পুরোনো বকেয়া কমায় না।

## Vercel Environment Variables
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAIL`

## চেক
`npm run typecheck && npm run lint && npm run build`
