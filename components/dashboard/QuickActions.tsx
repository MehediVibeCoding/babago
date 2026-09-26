import Link from "next/link";

const ACTIONS = [
  {
    href: "/payments?action=add",
    label: "বেতন/পেমেন্ট যোগ করুন",
    hint: "অনলাইন বা হাতে-হাতে জমা",
    color: "text-success bg-emerald-50",
    icon: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  },
  {
    href: "/students?action=add",
    label: "নতুন শিক্ষার্থী যোগ করুন",
    hint: "ভর্তি তথ্য এন্ট্রি",
    color: "text-sky-600 bg-sky-100",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </>
    ),
  },
  {
    href: "/batches?action=add",
    label: "নতুন ব্যাচ চালু করুন",
    hint: "নাম, শিডিউল, আসন",
    color: "text-indigo-600 bg-indigo-100",
    icon: (
      <>
        <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z" />
        <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      </>
    ),
  },
  {
    href: "/blog?action=add",
    label: "নতুন ব্লগ পোস্ট লিখুন",
    hint: "ওয়েবসাইটে প্রকাশ হবে",
    color: "text-purple-600 bg-purple-100",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
  },
];

export default function QuickActions() {
  return (
    <div className="hover-lift rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      <h2 className="mb-4 border-b border-border-base/50 pb-3.5 font-body text-[15px] font-black tracking-tight text-sky-950">কুইক অ্যাকশন</h2>
      <div className="space-y-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-2xl border border-border-base/60 bg-white p-3 transition-all duration-brand hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sh1"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.color}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {a.icon}
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-[12.5px] font-bold text-ink-800">{a.label}</p>
              <p className="truncate font-body text-[10.5px] text-muted">{a.hint}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/50 transition-transform duration-brand group-hover:translate-x-0.5 group-hover:text-sky-600">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
