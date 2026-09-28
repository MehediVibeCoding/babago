export type Batch = {
  id: string;
  name: string;
  target_cohort: string;
  badge: string;
  schedule: string;
  location: string;
  features: string[];
  seats_left: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type StudentStatus = "pending" | "confirmed" | "inactive";

export type Student = {
  id: string;
  full_name: string;
  college: string;
  college_roll: string;
  group_name: string;
  batch_id: string | null;
  batch_name_snapshot: string | null;
  phone: string;
  guardian_phone: string;
  status: StudentStatus;
  created_at: string;
};

export type PaymentMethod = "online" | "cash";

export type Payment = {
  id: string;
  student_id: string;
  amount: number;
  method: PaymentMethod;
  for_month: string; // YYYY-MM-01
  note: string | null;
  created_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export type ClassDiaryEntry = {
  id: string;
  batch_id: string | null;
  batch_name_snapshot: string | null;
  topic: string;
  note: string;
  slide_url: string | null;
  entry_date: string;
  created_at: string;
};

export type ExpenseCategory =
  | "ভাড়া"
  | "বিদ্যুৎ বিল"
  | "প্রিন্টিং ও খাতাপত্র"
  | "মার্কেটিং"
  | "আপ্যায়ন ও নাস্তা"
  | "রক্ষণাবেক্ষণ"
  | "ব্যক্তিগত"
  | "অন্যান্য";

export type Expense = {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  note: string | null;
  created_at: string;
};

// ══════════════════════════════════════════════════════════════════════
// 🌟 মেইন ওয়েবসাইটের ৫টি নতুন সেকশনের ডাটাবেজ টাইপ
// ══════════════════════════════════════════════════════════════════════

/** ১. রিয়েল ক্লাসরুম ও একাডেমি লাইফ গ্যালারি */
export type ClassroomPhoto = {
  id: string;
  caption: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

/** ২. বিদায় সংবর্ধনা ও স্মৃতি অ্যালবাম */
export type FarewellMemory = {
  id: string;
  batch_tag: string; // যেমন: "HSC 2025 বিদায় সংবর্ধনা", "HSC 2026 বিদায় উৎসব", "ক্লাসরুম মোমেন্টস"
  caption: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

/** ৩. কৃতি শিক্ষার্থীদের দেয়াল (রেজাল্ট বোর্ড) */
export type SuccessTopper = {
  id: string;
  name: string;
  batch: string; // যেমন: "HSC 2025"
  result: string; // যেমন: "GPA 5.00"
  subject: string; // যেমন: "English A+, ICT A+"
  college: string;
  photo_url: string | null;
  sort_order: number;
  created_at: string;
};

/** ৪. সর্বশেষ ভিডিও লেকচার */
export type VideoLecture = {
  id: string;
  title: string;
  video_url: string; // YouTube / Embed link
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
};

/** ৫. শিক্ষার্থী ও অভিভাবকদের মতামত / রিভিউ */
export type TestimonialItem = {
  id: string;
  name: string;
  role_type: "শিক্ষার্থী" | "অভিভাবক";
  batch_year: string; // যেমন: "HSC 2026"
  quote: string;
  is_featured: boolean; // হোমপেজের উপরের ৩টি কার্ডে দেখাবে কি না
  sort_order: number;
  created_at: string;
};
