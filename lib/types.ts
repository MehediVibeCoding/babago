// ══════════════════════════════════════════════════════════════════════
// এই টাইপগুলো ahsans-learning-academy Supabase প্রজেক্টের প্রকৃত টেবিল স্কিমা
// (batches, students, payments, blog_posts, class_diary_entries) থেকে হুবহু
// মিলিয়ে বানানো — যাতে ব্যাকএন্ড যুক্ত করার সময় শুধু ডেটা-ফেচিং ফাংশনের ভেতরের
// লজিক পাল্টালেই হয়, টাইপ/প্রপস পাল্টাতে হবে না।
//
// expenses / staff / salary_payments — এই তিনটা টেবিল এখনো ডাটাবেজে নেই,
// এগুলো এই প্রজেক্টের জন্য প্রস্তাবিত নতুন টেবিল (দেখুন supabase/suggested_schema.sql)।
// ══════════════════════════════════════════════════════════════════════

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
  monthly_fee: number; // ব্যাচ অনুযায়ী মাসিক বেতন — প্রকৃত DB-তে এটা batches টেবিলে বা students-এ যোগ করতে হবে
  created_at: string; // ভর্তির তারিখ হিসেবে ব্যবহৃত হচ্ছে
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
  published_at: string;
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

// --- প্রস্তাবিত নতুন টেবিল (এখনো ডাটাবেজে তৈরি হয়নি) ---

export type ExpenseCategory =
  | "ভাড়া"
  | "বিদ্যুৎ বিল"
  | "প্রিন্টিং ও খাতাপত্র"
  | "মার্কেটিং"
  | "স্টাফ বেতন"
  | "রক্ষণাবেক্ষণ"
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

export type Staff = {
  id: string;
  full_name: string;
  role: string;
  phone: string;
  monthly_salary: number;
  joined_at: string;
  is_active: boolean;
};

export type SalaryPayment = {
  id: string;
  staff_id: string;
  amount: number;
  for_month: string;
  paid_at: string;
  note: string | null;
};
