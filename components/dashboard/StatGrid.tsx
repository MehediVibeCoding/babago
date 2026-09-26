import Link from "next/link";
import { formatTaka } from "@/lib/utils";
import { toBengaliDigits } from "@/lib/bengaliNumerals";

interface CardConfig {
  id: string;
  label: string;
  value: string;
  note?: string;
  href: string;
  cardBg: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

export default function StatGrid({
  totalStudents,
  totalBatches,
  collectedThisMonth,
  collectedLifetime,
  dueCount,
  todaysClassCount,
  publishedBlogCount,
}: {
  totalStudents: number;
  totalBatches: number;
  collectedThisMonth: number;
  collectedLifetime: number;
  dueCount: number;
  todaysClassCount: number;
  publishedBlogCount: number;
}) {
  const tiles: CardConfig[] = [
    {
      id: "students",
      label: "মোট শিক্ষার্থী",
      value: toBengaliDigits(totalStudents),
      href: "/students",
      cardBg: "bg-gradient-to-br from-[#EBF5FF] via-white to-white",
      borderColor: "border-sky-200/70 hover:border-sky-400/60",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      icon: (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </>
      ),
    },
    {
      id: "batches",
      label: "চলমান ব্যাচ",
      value: toBengaliDigits(totalBatches),
      href: "/batches",
      cardBg: "bg-gradient-to-br from-[#EEF2FF] via-white to-white",
      borderColor: "border-indigo-200/70 hover:border-indigo-300",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      icon: (
        <>
          <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z" />
          <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
        </>
      ),
    },
    {
      id: "today",
      label: "আজকের ক্লাস",
      value: toBengaliDigits(todaysClassCount),
      href: "/batches",
      cardBg: "bg-gradient-to-br from-[#F0FDFA] via-white to-white",
      borderColor: "border-teal-200/70 hover:border-teal-300",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      icon: (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </>
      ),
    },
    {
      id: "due",
      label: "বেতন বাকি",
      value: toBengaliDigits(dueCount),
      note: dueCount > 0 ? "নিচে তালিকা দেখুন" : "সবার বেতন হালনাগাদ",
      href: "/students?filter=due",
      cardBg: "bg-gradient-to-br from-[#FFFBEB] via-white to-white",
      borderColor: "border-amber-200/70 hover:border-amber-300",
      iconBg: "bg-amber-100",
      iconColor: "text-warn",
      icon: (
        <>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      ),
    },
    {
      id: "lifetime",
      label: "সর্বমোট কালেকশন",
      value: formatTaka(collectedLifetime),
      href: "/payments",
      cardBg: "bg-gradient-to-br from-[#ECFDF5] via-white to-white",
      borderColor: "border-emerald-200/70 hover:border-emerald-300",
      iconBg: "bg-emerald-100",
      iconColor: "text-success",
      icon: (
        <>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
      ),
    },
    {
      id: "blog",
      label: "প্রকাশিত ব্লগ",
      value: toBengaliDigits(publishedBlogCount),
      href: "/blog",
      cardBg: "bg-gradient-to-br from-[#FAF5FF] via-white to-white",
      borderColor: "border-purple-200/70 hover:border-purple-300",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      icon: (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_1.9fr]">
      {/* হিরো কার্ড — এই মাসের কালেকশন */}
      <Link
        href="/payments"
        className="group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-5 shadow-sh2 transition-all duration-brand hover:-translate-y-0.5"
      >
        <svg aria-hidden="true" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" className="pointer-events-none absolute -right-5 -top-5 opacity-[0.14]">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/20 text-white backdrop-blur-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="font-body text-[12px] font-extrabold uppercase tracking-wider text-white/85">এই মাসে কালেকশন</span>
        </div>
        <div className="relative z-10">
          <div className="font-body text-[30px] font-black leading-tight tracking-tight text-white sm:text-[34px]">
            {formatTaka(collectedThisMonth)}
          </div>
          <div className="mt-0.5 font-body text-[11.5px] font-semibold text-white/80">সর্বমোট: {formatTaka(collectedLifetime)}</div>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className={`group flex items-center gap-2.5 rounded-2xl border p-3.5 backdrop-blur-xl transition-all duration-brand hover:-translate-y-0.5 ${card.cardBg} ${card.borderColor}`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] transition-transform duration-brand group-hover:scale-110 ${card.iconBg} ${card.iconColor}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {card.icon}
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-body text-[10px] font-extrabold uppercase tracking-wider text-muted/85">{card.label}</div>
              <div className="truncate font-body text-[17px] font-black leading-tight tracking-tight text-sky-950">{card.value}</div>
              {card.note && <div className="truncate font-body text-[9.5px] font-semibold text-muted/75">{card.note}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
