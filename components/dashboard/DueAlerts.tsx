import Link from "next/link";
import type { DueStudent } from "@/lib/dashboard";

export default function DueAlerts({ items }: { items: DueStudent[] }) {
  if (!items.length) {
    return (
      <div className="hover-lift mt-5 rounded-[24px] border border-white/90 bg-white/80 p-6 text-center shadow-sh1 backdrop-blur-xl">
        <p className="font-body text-[13.5px] font-bold text-success">🎉 সবার বেতন হালনাগাদ আছে — কোনো বকেয়া নেই</p>
      </div>
    );
  }

  return (
    <div className="hover-lift mt-5 overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-base/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-warn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="font-body text-[15px] font-black tracking-tight text-sky-950">বেতন বকেয়া সতর্কতা</h2>
            <p className="font-body text-[11px] font-medium text-muted">{items.length} জন শিক্ষার্থীর বেতন বাকি</p>
          </div>
        </div>
        <Link
          href="/students?filter=due"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border-base/80 bg-white px-3.5 py-1.5 font-body text-[11.5px] font-bold text-ink-800 shadow-xs transition-all duration-brand hover:border-sky-400 hover:bg-sky-100/40 hover:text-sky-700"
        >
          <span>সব দেখুন</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-brand group-hover:translate-x-0.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {items.slice(0, 8).map(({ student, dueMonths }) => {
          const severe = dueMonths >= 3;
          return (
            <Link
              key={student.id}
              href="/students?filter=due"
              title={`${student.full_name} — বেতন যোগ করতে ক্লিক করুন`}
              className="group flex items-center gap-2.5 rounded-2xl p-2 transition-all duration-brand hover:bg-surface-muted active:scale-[0.98]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 font-body text-[11px] font-black text-sky-700">
                {student.full_name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-[12.5px] font-bold text-ink-800">{student.full_name}</p>
                <p className="truncate font-body text-[10.5px] text-muted">{student.batch_name_snapshot}</p>
              </div>
              <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[10px] font-extrabold ${severe ? "bg-danger text-white" : "bg-warn/20 text-[#92400E]"}`}>
                {dueMonths} মাস বাকি
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
