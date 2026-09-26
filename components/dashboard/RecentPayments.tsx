import Link from "next/link";
import { formatTaka } from "@/lib/utils";
import { formatBengaliDate } from "@/lib/bengaliNumerals";
import { Badge } from "@/components/admin/ui";
import type { Payment, Student } from "@/lib/types";

export default function RecentPayments({ payments, students }: { payments: Payment[]; students: Student[] }) {
  const nameOf = (id: string) => students.find((s) => s.id === id)?.full_name ?? "অজানা";

  return (
    <div className="hover-lift rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border-base/50 pb-3.5">
        <h2 className="font-body text-[15px] font-black tracking-tight text-sky-950">সাম্প্রতিক পেমেন্ট</h2>
        <Link href="/payments" className="font-body text-[11.5px] font-bold text-sky-600 hover:underline">
          সব দেখুন →
        </Link>
      </div>

      {payments.length === 0 ? (
        <p className="py-4 text-center font-body text-[13px] text-muted">এখনো কোনো পেমেন্ট রেকর্ড নেই।</p>
      ) : (
        <div className="space-y-1">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-surface-muted/60">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-[12.5px] font-bold text-ink-800">{nameOf(p.student_id)}</p>
                <p className="truncate font-body text-[10.5px] text-muted">{formatBengaliDate(p.created_at.slice(0, 10))}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="font-body text-[13px] font-black text-sky-950">{formatTaka(p.amount)}</span>
                <Badge tone={p.method === "online" ? "info" : "muted"}>{p.method === "online" ? "অনলাইন" : "নগদ"}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
