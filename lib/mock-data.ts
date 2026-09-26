import type {
  Batch,
  BlogPost,
  ClassDiaryEntry,
  Expense,
  Payment,
  SalaryPayment,
  Staff,
  Student,
} from "./types";

// ══════════════════════════════════════════════════════════════════════
// এই ফাইলের batches / blog_posts / class_diary_entries — আসল Supabase
// প্রজেক্ট (ahsans) থেকে সরাসরি নেওয়া প্রকৃত ডেটা (id সহ), যাতে অ্যাডমিন
// প্যানেলটা প্রিভিউতেও বাস্তব ডেটার সাথে মেলে। students / payments /
// expenses / staff — এগুলো এখনো ডাটাবেজে বাস্তব রেকর্ড নেই (students টেবিলে
// এখন খালি একটা টেস্ট এন্ট্রি আছে মাত্র), তাই সেগুলো বাস্তবসম্মত নমুনা ডেটা
// হিসেবে বানানো হয়েছে — যাতে ড্যাশবোর্ড/টেবিল/অ্যালার্ট আসল ব্যবহারের মতো
// দেখা যায়। ব্যাকএন্ড যুক্ত হলে এই ফাইলটার বদলে সরাসরি Supabase কোয়েরি বসবে।
// ══════════════════════════════════════════════════════════════════════

export const BATCHES: Batch[] = [
  {
    id: "fe972580-fa68-4ebd-b7ce-ea67c6cee7d0",
    name: "HSC 28 English",
    target_cohort: "HSC 2028 ব্যাচ",
    badge: "ভর্তি চলছে",
    schedule: "শনি, সোম, বুধ — বিকাল ৪:০০ টা",
    location: "চৌদ্দগ্রাম একাডেমি শাখা",
    features: [],
    seats_left: 8,
    is_active: true,
    sort_order: 1,
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "ab04ff51-fcd3-4b37-9406-54d62b846df0",
    name: "HSC 28 ICT",
    target_cohort: "HSC 2028 ব্যাচ",
    badge: "সীমিত আসন",
    schedule: "রবি, মঙ্গল, বৃহস্পতি — বিকাল ৪:০০ টা",
    location: "চৌদ্দগ্রাম একাডেমি শাখা",
    features: [],
    seats_left: 4,
    is_active: true,
    sort_order: 2,
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "a268664e-2b9a-4414-b4ee-ff4a7f9a96aa",
    name: "HSC 28 English and ICT Combine",
    target_cohort: "HSC 2028 ব্যাচ",
    badge: "সর্বাধিক জনপ্রিয়",
    schedule: "সপ্তাহে ৬ দিন (সুবিধাজনক টাইম)",
    location: "চৌদ্দগ্রাম একাডেমি শাখা",
    features: [],
    seats_left: 6,
    is_active: true,
    sort_order: 3,
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "465195cd-1e9a-4851-8677-37777c04d96f",
    name: "HSC 27 English",
    target_cohort: "HSC 2027 ব্যাচ",
    badge: "ভর্তি চলছে",
    schedule: "শনি, সোম, বুধ — সকাল ৯:০০ টা",
    location: "চৌদ্দগ্রাম একাডেমি শাখা",
    features: [],
    seats_left: 5,
    is_active: true,
    sort_order: 4,
    created_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "1489d1f8-87a1-457a-ae3a-37c8143f3d2e",
    name: "HSC 27 ICT",
    target_cohort: "HSC 2027 ব্যাচ",
    badge: "সীমিত আসন",
    schedule: "রবি, মঙ্গল, বৃহস্পতি — সকাল ৯:০০ টা",
    location: "চৌদ্দগ্রাম একাডেমি শাখা",
    features: [],
    seats_left: 3,
    is_active: true,
    sort_order: 5,
    created_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "3349a2e2-151d-460d-a09e-9137edc41800",
    name: "HSC 27 English and ICT Combine",
    target_cohort: "HSC 2027 ব্যাচ",
    badge: "একাডেমিক কেয়ার",
    schedule: "সপ্তাহে ৬ দিন (সকালের ব্যাচ)",
    location: "চৌদ্দগ্রাম একাডেমি শাখা",
    features: [],
    seats_left: 10,
    is_active: true,
    sort_order: 6,
    created_at: "2026-02-01T00:00:00Z",
  },
];

/** ব্যাচ অনুযায়ী মাসিক বেতন — DB-তে এখনো এই কলাম নেই, প্রস্তাবিত ডিফল্ট মান */
export const BATCH_MONTHLY_FEE: Record<string, number> = {
  "fe972580-fa68-4ebd-b7ce-ea67c6cee7d0": 1200,
  "ab04ff51-fcd3-4b37-9406-54d62b846df0": 1200,
  "a268664e-2b9a-4414-b4ee-ff4a7f9a96aa": 2000,
  "465195cd-1e9a-4851-8677-37777c04d96f": 1200,
  "1489d1f8-87a1-457a-ae3a-37c8143f3d2e": 1200,
  "3349a2e2-151d-460d-a09e-9137edc41800": 2000,
};

type StudentSeed = Omit<Student, "monthly_fee"> & { skipRecentMonths: number };

const STUDENT_SEEDS: StudentSeed[] = [
  { id: "s01", full_name: "রাফিদ হাসান", college: "চৌদ্দগ্রাম সরকারি কলেজ", college_roll: "১১০২", group_name: "বিজ্ঞান বিভাগ", batch_id: "465195cd-1e9a-4851-8677-37777c04d96f", batch_name_snapshot: "HSC 27 English", phone: "01711223344", guardian_phone: "01911223344", status: "confirmed", created_at: "2026-02-14T00:00:00Z", skipRecentMonths: 0 },
  { id: "s02", full_name: "তানজিলা আক্তার", college: "চৌদ্দগ্রাম আদর্শ মহিলা কলেজ", college_roll: "০৮৭৭", group_name: "মানবিক বিভাগ", batch_id: "465195cd-1e9a-4851-8677-37777c04d96f", batch_name_snapshot: "HSC 27 English", phone: "01812345671", guardian_phone: "01912345671", status: "confirmed", created_at: "2026-02-20T00:00:00Z", skipRecentMonths: 2 },
  { id: "s03", full_name: "সাকিব মাহমুদ", college: "কাশিনগর ডিগ্রি কলেজ", college_roll: "১২৩৪", group_name: "বিজ্ঞান বিভাগ", batch_id: "1489d1f8-87a1-457a-ae3a-37c8143f3d2e", batch_name_snapshot: "HSC 27 ICT", phone: "01911002233", guardian_phone: "01711002233", status: "confirmed", created_at: "2026-02-10T00:00:00Z", skipRecentMonths: 0 },
  { id: "s04", full_name: "নুসরাত জাহান", college: "চৌদ্দগ্রাম সরকারি কলেজ", college_roll: "০৯৯৯", group_name: "ব্যবসায় শিক্ষা বিভাগ", batch_id: "1489d1f8-87a1-457a-ae3a-37c8143f3d2e", batch_name_snapshot: "HSC 27 ICT", phone: "01611778899", guardian_phone: "01511778899", status: "confirmed", created_at: "2026-03-01T00:00:00Z", skipRecentMonths: 3 },
  { id: "s05", full_name: "ইমরান খান", college: "মিয়াবাজার কলেজ", college_roll: "০৪৫৬", group_name: "বিজ্ঞান বিভাগ", batch_id: "3349a2e2-151d-460d-a09e-9137edc41800", batch_name_snapshot: "HSC 27 English and ICT Combine", phone: "01755667788", guardian_phone: "01955667788", status: "confirmed", created_at: "2026-02-05T00:00:00Z", skipRecentMonths: 0 },
  { id: "s06", full_name: "ফারহানা ইসলাম", college: "গুণবতী কলেজ", college_roll: "০৬৭৮", group_name: "মানবিক বিভাগ", batch_id: "3349a2e2-151d-460d-a09e-9137edc41800", batch_name_snapshot: "HSC 27 English and ICT Combine", phone: "01890011223", guardian_phone: "01690011223", status: "confirmed", created_at: "2026-02-18T00:00:00Z", skipRecentMonths: 1 },
  { id: "s07", full_name: "আরাফাত হোসেন", college: "চৌদ্দগ্রাম সরকারি কলেজ", college_roll: "১৩৩৩", group_name: "বিজ্ঞান বিভাগ", batch_id: "3349a2e2-151d-460d-a09e-9137edc41800", batch_name_snapshot: "HSC 27 English and ICT Combine", phone: "01722334455", guardian_phone: "01922334455", status: "confirmed", created_at: "2026-03-10T00:00:00Z", skipRecentMonths: 3 },
  { id: "s08", full_name: "মাহি চৌধুরী", college: "চৌদ্দগ্রাম আদর্শ মহিলা কলেজ", college_roll: "০৭৭৭", group_name: "বিজ্ঞান বিভাগ", batch_id: "fe972580-fa68-4ebd-b7ce-ea67c6cee7d0", batch_name_snapshot: "HSC 28 English", phone: "01633445566", guardian_phone: "01833445566", status: "confirmed", created_at: "2026-08-05T00:00:00Z", skipRecentMonths: 0 },
  { id: "s09", full_name: "রিয়াদ হাসান", college: "কাশিনগর ডিগ্রি কলেজ", college_roll: "১১১১", group_name: "মানবিক বিভাগ", batch_id: "fe972580-fa68-4ebd-b7ce-ea67c6cee7d0", batch_name_snapshot: "HSC 28 English", phone: "01544556677", guardian_phone: "01344556677", status: "confirmed", created_at: "2026-08-12T00:00:00Z", skipRecentMonths: 1 },
  { id: "s10", full_name: "সুমাইয়া বিনতে করিম", college: "চৌদ্দগ্রাম সরকারি কলেজ", college_roll: "০২২২", group_name: "বিজ্ঞান বিভাগ", batch_id: "ab04ff51-fcd3-4b37-9406-54d62b846df0", batch_name_snapshot: "HSC 28 ICT", phone: "01966778899", guardian_phone: "01766778899", status: "confirmed", created_at: "2026-08-03T00:00:00Z", skipRecentMonths: 0 },
  { id: "s11", full_name: "তাহমিদ রহমান", college: "মিয়াবাজার কলেজ", college_roll: "০৩৩৩", group_name: "বিজ্ঞান বিভাগ", batch_id: "ab04ff51-fcd3-4b37-9406-54d62b846df0", batch_name_snapshot: "HSC 28 ICT", phone: "01877889900", guardian_phone: "01677889900", status: "pending", created_at: "2026-09-20T00:00:00Z", skipRecentMonths: 0 },
  { id: "s12", full_name: "জান্নাতুল ফেরদৌস", college: "গুণবতী কলেজ", college_roll: "০৫৫৫", group_name: "মানবিক বিভাগ", batch_id: "a268664e-2b9a-4414-b4ee-ff4a7f9a96aa", batch_name_snapshot: "HSC 28 English and ICT Combine", phone: "01722009988", guardian_phone: "01922009988", status: "confirmed", created_at: "2026-08-08T00:00:00Z", skipRecentMonths: 0 },
  { id: "s13", full_name: "নাফিজ ইকবাল", college: "চৌদ্দগ্রাম সরকারি কলেজ", college_roll: "০৬৬৬", group_name: "ব্যবসায় শিক্ষা বিভাগ", batch_id: "a268664e-2b9a-4414-b4ee-ff4a7f9a96aa", batch_name_snapshot: "HSC 28 English and ICT Combine", phone: "01633221100", guardian_phone: "01833221100", status: "confirmed", created_at: "2026-08-16T00:00:00Z", skipRecentMonths: 1 },
  { id: "s14", full_name: "লামিয়া সুলতানা", college: "কাশিনগর ডিগ্রি কলেজ", college_roll: "০৭৭৮", group_name: "বিজ্ঞান বিভাগ", batch_id: "a268664e-2b9a-4414-b4ee-ff4a7f9a96aa", batch_name_snapshot: "HSC 28 English and ICT Combine", phone: "01544009911", guardian_phone: "01344009911", status: "pending", created_at: "2026-09-18T00:00:00Z", skipRecentMonths: 0 },
  { id: "s15", full_name: "ওয়াসিফ আহমেদ", college: "মিয়াবাজার কলেজ", college_roll: "১৪৪৪", group_name: "বিজ্ঞান বিভাগ", batch_id: "465195cd-1e9a-4851-8677-37777c04d96f", batch_name_snapshot: "HSC 27 English", phone: "01699887766", guardian_phone: "01899887766", status: "inactive", created_at: "2026-02-25T00:00:00Z", skipRecentMonths: 6 },
  { id: "s16", full_name: "প্রিয়াংকা দাস", college: "চৌদ্দগ্রাম আদর্শ মহিলা কলেজ", college_roll: "০৮৮৮", group_name: "বিজ্ঞান বিভাগ", batch_id: "1489d1f8-87a1-457a-ae3a-37c8143f3d2e", batch_name_snapshot: "HSC 27 ICT", phone: "01711556677", guardian_phone: "01911556677", status: "confirmed", created_at: "2026-04-02T00:00:00Z", skipRecentMonths: 2 },
];

export const STUDENTS: Student[] = STUDENT_SEEDS.map((s) => ({
  ...s,
  monthly_fee: BATCH_MONTHLY_FEE[s.batch_id ?? ""] ?? 1200,
}));

// ── প্রতিটা শিক্ষার্থীর জন্য এনরোলমেন্ট থেকে এখন পর্যন্ত পেমেন্ট হিস্ট্রি জেনারেট ──
function generatePayments(): Payment[] {
  const today = new Date("2026-09-26T00:00:00Z");
  const payments: Payment[] = [];
  let counter = 1;

  for (const seed of STUDENT_SEEDS) {
    if (seed.status === "pending") continue; // পেন্ডিং শিক্ষার্থী এখনো ভর্তি নিশ্চিত হয়নি, বেতন শুরু হয়নি

    const start = new Date(seed.created_at);
    const totalMonths =
      (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth()) + 1;
    const monthsToPay = Math.max(0, totalMonths - seed.skipRecentMonths);
    const fee = BATCH_MONTHLY_FEE[seed.batch_id ?? ""] ?? 1200;

    for (let i = 0; i < monthsToPay; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const forMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const paidOn = new Date(d.getFullYear(), d.getMonth(), 3 + (counter % 5));
      payments.push({
        id: `p${counter++}`,
        student_id: seed.id,
        amount: fee,
        method: counter % 4 === 0 ? "cash" : "online",
        for_month: forMonth,
        note: counter % 4 === 0 ? "হাতে হাতে অফিসে জমা" : null,
        created_at: paidOn.toISOString(),
      });
    }
  }

  return payments.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export const PAYMENTS: Payment[] = generatePayments();

// ── আসল Supabase প্রজেক্ট থেকে নেওয়া ব্লগ পোস্ট ──
export const BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: "HSC English 1st Paper সম্পূর্ণ সিলেবাস (HSC-28)",
    slug: "hsc-english-1st-paper-syllabus-hsc-28",
    excerpt: "Reading ও Writing Part-এর মার্কস বিভাজন, কোন অংশে কত নম্বর, এবং প্রস্তুতির কৌশল — সব একসাথে।",
    content: "",
    cover_image_url: null,
    published: true,
    published_at: "2026-09-25T00:00:00Z",
    created_at: "2026-09-25T00:00:00Z",
  },
  {
    id: "b2",
    title: "Flow Chart লেখার সহজ নিয়ম",
    slug: "flow-chart-lekhar-sohoj-niyom",
    excerpt: "ধাপে ধাপে Flow Chart লেখার কৌশল, সংযোজক শব্দের ব্যবহার এবং কমন ভুলগুলো।",
    content: "",
    cover_image_url: null,
    published: true,
    published_at: "2026-09-20T00:00:00Z",
    created_at: "2026-09-20T00:00:00Z",
  },
  {
    id: "b3",
    title: "ICT: Logic Gate MCQ কীভাবে দ্রুত সমাধান করবে",
    slug: "ict-logic-gate-mcq-shortcut",
    excerpt: "Truth Table মুখস্থ না করেও কীভাবে যেকোনো Logic Gate MCQ সমাধান করা যায়।",
    content: "",
    cover_image_url: null,
    published: true,
    published_at: "2026-09-18T00:00:00Z",
    created_at: "2026-09-18T00:00:00Z",
  },
];

// ── আসল Supabase প্রজেক্ট থেকে নেওয়া ক্লাস ডায়েরি এন্ট্রি ──
export const CLASS_DIARY: ClassDiaryEntry[] = [
  {
    id: "d1",
    batch_id: "fe972580-fa68-4ebd-b7ce-ea67c6cee7d0",
    batch_name_snapshot: "HSC English (Batch 28)",
    topic: "Flow Chart লেখার নিয়ম ও অনুশীলন",
    note: "ক্লাসে দেওয়া ৫টা অনুশীলনী বাসায় করে আনতে হবে।",
    slide_url: null,
    entry_date: "2026-09-25",
    created_at: "2026-09-25T00:00:00Z",
  },
  {
    id: "d2",
    batch_id: "ab04ff51-fcd3-4b37-9406-54d62b846df0",
    batch_name_snapshot: "HSC ICT (Batch 28)",
    topic: "Logic Gate — AND, OR, NOT",
    note: "Truth table নিয়ে পরের ক্লাসে কুইজ হবে।",
    slide_url: null,
    entry_date: "2026-09-24",
    created_at: "2026-09-24T00:00:00Z",
  },
  {
    id: "d3",
    batch_id: "fe972580-fa68-4ebd-b7ce-ea67c6cee7d0",
    batch_name_snapshot: "HSC English (Batch 28)",
    topic: "Cloze Test with Clues — কৌশল",
    note: "",
    slide_url: null,
    entry_date: "2026-09-23",
    created_at: "2026-09-23T00:00:00Z",
  },
];

// ── প্রস্তাবিত নতুন ফিচার: খরচ ও স্টাফ বেতন (নমুনা ডেটা) ──
export const EXPENSES: Expense[] = [
  { id: "e1", title: "সেপ্টেম্বর মাসের একাডেমি ভাড়া", category: "ভাড়া", amount: 15000, expense_date: "2026-09-03", note: null, created_at: "2026-09-03T00:00:00Z" },
  { id: "e2", title: "বিদ্যুৎ বিল — আগস্ট", category: "বিদ্যুৎ বিল", amount: 2400, expense_date: "2026-09-05", note: null, created_at: "2026-09-05T00:00:00Z" },
  { id: "e3", title: "প্রশ্নপত্র প্রিন্ট ও ফটোকপি", category: "প্রিন্টিং ও খাতাপত্র", amount: 1850, expense_date: "2026-09-10", note: "HSC 28 ভর্তি পরীক্ষা", created_at: "2026-09-10T00:00:00Z" },
  { id: "e4", title: "ফেসবুক পেজ বুস্টিং", category: "মার্কেটিং", amount: 3000, expense_date: "2026-09-12", note: "নতুন ব্যাচ প্রচারণা", created_at: "2026-09-12T00:00:00Z" },
  { id: "e5", title: "হোয়াইটবোর্ড মার্কার ও কালি", category: "রক্ষণাবেক্ষণ", amount: 650, expense_date: "2026-09-15", note: null, created_at: "2026-09-15T00:00:00Z" },
  { id: "e6", title: "আগস্ট মাসের একাডেমি ভাড়া", category: "ভাড়া", amount: 15000, expense_date: "2026-08-03", note: null, created_at: "2026-08-03T00:00:00Z" },
];

export const STAFF: Staff[] = [
  { id: "st1", full_name: "মোঃ আহসান উল্লাহ", role: "প্রধান শিক্ষক (English & ICT)", phone: "01836452795", monthly_salary: 0, joined_at: "2025-06-01", is_active: true },
  { id: "st2", full_name: "সাদিয়া আফরিন", role: "সহকারী শিক্ষক (ICT)", phone: "01711998877", monthly_salary: 12000, joined_at: "2026-02-01", is_active: true },
  { id: "st3", full_name: "রফিকুল ইসলাম", role: "অফিস সহকারী", phone: "01922113344", monthly_salary: 8000, joined_at: "2026-03-15", is_active: true },
];

export const SALARY_PAYMENTS: SalaryPayment[] = [
  { id: "sp1", staff_id: "st2", amount: 12000, for_month: "2026-08-01", paid_at: "2026-09-01T00:00:00Z", note: null },
  { id: "sp2", staff_id: "st3", amount: 8000, for_month: "2026-08-01", paid_at: "2026-09-01T00:00:00Z", note: null },
];
