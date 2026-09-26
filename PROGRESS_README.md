# Ahsan's Learning Academy — Admin Panel (কাজ চলমান / In Progress)

এই প্রজেক্টটা এখনো **সম্পূর্ণ হয়নি**। নিচে ঠিক কতটুকু হয়েছে, আর বাকি কী কী করতে
হবে তার বিস্তারিত লিস্ট দেওয়া হলো, যাতে অন্য কেউ (বা অন্য AI) এটা ধরে সহজে
এগিয়ে নিতে পারে।

## টেক স্ট্যাক (মূল ওয়েবসাইটের সাথে মিলিয়ে)
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3 — মূল সাইটের ঠিক একই color token/glass ডিজাইন সিস্টেম (Liquid Glass × Sky Blue)
- ডাটাবেজ: Supabase প্রজেক্ট **ahsans** (project ref: `iwiepllovwwvbjokwkgc`) — মূল
  ওয়েবসাইটের সাথে **same database**, আলাদা কিছু বানাতে হয়নি।

## ✅ এখন পর্যন্ত যা তৈরি হয়েছে

### Config / base
- `package.json`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js`, `.gitignore`, `.env.example`
- `app/layout.tsx` — root layout, ফন্ট `<link>` ট্যাগে লোড (মূল সাইটে
  `next/font/google` দিয়ে Vercel বিল্ড ক্র্যাশ করেছিল বলে ওরা যে ফিক্স করেছিল,
  এখানেও সেটাই কপি করা হয়েছে — দেখুন `test` রিপোর `app/layout.tsx`-এর কমেন্ট)
- `app/globals.css` — মূল সাইটের glass-panel/hover-lift/btn-glow ইউটিলিটি ক্লাস কপি করা
- `app/(admin)/layout.tsx` — সাইডবার + টোস্ট প্রোভাইডার wrapper

### লাইব্রেরি / ডেটা লেয়ার
- `lib/types.ts` — Supabase-এর **আসল** টেবিল স্কিমা (batches/students/payments/
  blog_posts/class_diary_entries) থেকে হুবহু মিলিয়ে বানানো TypeScript টাইপ +
  ৩টা প্রস্তাবিত নতুন টেবিলের টাইপ (expenses/staff/salary_payments — এগুলো
  এখনো DB-তে নেই, `supabase/suggested_schema.sql` বানানো এখনো বাকি)
- `lib/mock-data.ts` — batches/blog_posts/class_diary_entries এখানে **আসল DB
  থেকে টেনে আনা বাস্তব ডেটা**; students/payments/expenses/staff বাস্তবসম্মত
  নমুনা ডেটা (যাতে UI ফাঁকা না দেখায়)
- `lib/utils.ts` — টাকা ফরম্যাট, বকেয়া মাস হিসাব (`dueMonthsForStudent`), আজ
  কোন ব্যাচের ক্লাস আছে তা বের করা (`isBatchToday`) ইত্যাদি হেল্পার
- `lib/bengaliNumerals.ts` — মূল সাইট থেকে কপি করা বাংলা সংখ্যা ফরম্যাটার
- `lib/dashboard.ts` — ড্যাশবোর্ডের সব পরিসংখ্যান (`getDashboardData`,
  `getMonthlyRevenueTrend`) মক ডেটা থেকে হিসাব করে — **ব্যাকএন্ড যুক্ত করার সময়
  এই ফাইলটার ভেতরের লজিক পাল্টে আসল Supabase কোয়েরি বসালেই হবে, বাইরের
  ইন্টারফেস/রিটার্ন শেপ এক রাখলে বাকি কম্পোনেন্ট কিছুই পাল্টাতে হবে না।**

### শেয়ারড UI কম্পোনেন্ট
- `components/admin/Sidebar.tsx` — ডেস্কটপ hover-expand গ্লাস সাইডবার +
  মোবাইল বটম বার + স্লাইড-আপ ড্রয়ার (৯টা নেভ আইটেম: ড্যাশবোর্ড, শিক্ষার্থী,
  বেতন/পেমেন্ট, ব্যাচ, ক্লাস ডায়েরি, ব্লগ, খরচ, স্টাফ, সেটিংস)
- `components/admin/Toast.tsx` — success/error/info টোস্ট নোটিফিকেশন
- `components/admin/Modal.tsx` — জেনেরিক গ্লাস মোডাল (সব ফর্মে reuse হবে)
- `components/admin/ui.tsx` — Badge, EmptyState, PageHeader, PrimaryButton,
  SecondaryButton, Field, TextInput, TextArea, Select — সব ফর্ম/পেজে reuse হবে

### ড্যাশবোর্ডের কম্পোনেন্ট (তৈরি হয়েছে, কিন্তু এখনো কোনো page.tsx-এ জোড়া লাগেনি)
- `components/dashboard/StatGrid.tsx` — হিরো কার্ড (এই মাসের কালেকশন) + ৬টা টাইল
- `components/dashboard/TodayClasses.tsx` — আজ কোন ব্যাচের ক্লাস আছে
- `components/dashboard/DueAlerts.tsx` — বেতন বকেয়া সতর্কতা (স্টক-অ্যালার্টের
  প্যাটার্নে, ২/৩ মাস বাকি থাকলে যেভাবে দেখতে চেয়েছিলেন ঠিক সেভাবে)
- `components/dashboard/RecentPayments.tsx` — সাম্প্রতিক পেমেন্ট লিস্ট
- `components/dashboard/QuickActions.tsx` — কুইক অ্যাকশন বাটন (নতুন
  শিক্ষার্থী/পেমেন্ট/ব্যাচ/ব্লগ যোগ করার শর্টকাট)
- `components/dashboard/RevenueChart.tsx` — কাস্টম SVG বার চার্ট (কোনো external
  chart library লাগেনি)

## ❌ এখনো যা বাকি (পরের ধাপ)

1. **`app/(admin)/page.tsx` — ড্যাশবোর্ড পেজ** যেটা উপরের সব
   dashboard/* কম্পোনেন্ট একসাথে জোড়া লাগাবে (`getDashboardData()` কল করে props
   পাস করতে হবে)। এটা সবচেয়ে জরুরি পরের ধাপ — এখন `app/(admin)/` ফোল্ডারে
   `layout.tsx` আছে কিন্তু `page.tsx` নেই, তাই এখনই রান করলে root route 404 দিবে।
2. **`app/(admin)/students/`** — শিক্ষার্থী লিস্ট পেজ + টেবিল (নাম/কলেজ/ব্যাচ/কত
   মাস ধরে আছে/মোট দিয়েছে/কত মাস বাকি) + ফিল্টার (`?filter=due` কুয়েরি প্যারাম
   ধরে বকেয়া অনুযায়ী ফিল্টার — Sidebar/DueAlerts থেকে লিংক করা আছে) + Add/Edit
   Student মোডাল ফর্ম
3. **`app/(admin)/payments/`** — সব পেমেন্টের টেবিল + "বেতন/পেমেন্ট যোগ করুন"
   মোডাল (এখানেই অনলাইন/নগদ সিলেক্ট করে ম্যানুয়ালি অফলাইন পেমেন্ট এন্ট্রির
   অপশনটা বসবে — এটা মূল রিকোয়ারমেন্ট ছিল)
4. **`app/(admin)/batches/`** — ব্যাচ কার্ড গ্রিড + নতুন ব্যাচ যোগ করার মোডাল
   (ডায়নামিক অ্যাড — নাম/শিডিউল/আসন/ব্যাজ)
5. **`app/(admin)/class-diary/`** — ডায়েরি এন্ট্রি লিস্ট + নতুন এন্ট্রি ফর্ম
6. **`app/(admin)/blog/`** — ব্লগ পোস্ট টেবিল + Add/Edit মোডাল (title/slug/
   excerpt/content/published toggle)
7. **`app/(admin)/expenses/`** — খরচ ট্র্যাকার (category/amount/date) — নতুন
   সাজেশন ফিচার, `lib/types.ts`-এ টাইপ রেডি আছে, শুধু পেজ/টেবিল/মোডাল বাকি
8. **`app/(admin)/staff/`** — স্টাফ লিস্ট + মাসিক বেতন পেমেন্ট ট্র্যাকিং — নতুন
   সাজেশন ফিচার, টাইপ রেডি আছে
9. **`app/(admin)/settings/`** — একাডেমি প্রোফাইল সেটিংস (নাম/লোকেশন/যোগাযোগ)
10. **`app/login/page.tsx`** — সাধারণ লগইন UI (এখনো কোনো auth logic ছাড়া, শুধু ডিজাইন)
11. **`supabase/suggested_schema.sql`** — expenses/staff/salary_payments টেবিলের
    জন্য প্রস্তাবিত `CREATE TABLE` SQL (RLS enabled, বাকি টেবিলের কনভেনশন মেনে)
12. একবার সব পেজ হয়ে গেলে: `npm install` + `npm run build` চালিয়ে TypeScript/
    বিল্ড এরর ঠিক করে নিতে হবে — এখনো এটা করা হয়নি।

## যেভাবে চালাবেন

```bash
npm install
npm run dev
```

## ব্যাকএন্ড যুক্ত করার সময় খেয়াল রাখবেন

- এখন সব ডেটা `lib/mock-data.ts`-এ হার্ডকোড করা (রিফ্রেশ দিলে হারিয়ে যাবে,
  কোনো mutation আসলে সেভ হয় না)। Supabase client বসানোর জন্য মূল সাইটের
  `lib/supabase/client.ts` ও `lib/supabase/server.ts` এখানেও কপি করে আনলেই হবে।
- `lib/types.ts`-এর টাইপগুলো আসল কলাম নামের সাথে হুবহু মিলে, তাই query লেখা সহজ হবে।
- `students` টেবিলে `monthly_fee` কলামটা এখনো নেই (আমি টাইপে যোগ করেছি ধরে
  নিয়ে) — এটা হয় `batches` টেবিলে নতুন কলাম হিসেবে, নয়তো `students`-এ যোগ করতে হবে।
