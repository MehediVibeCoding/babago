import Link from "next/link";
import type { Batch } from "@/lib/types";
import { Badge } from "@/components/admin/ui";

export default function TodayClasses({ batches, todayLabel }: { batches: Batch[]; todayLabel: string }) {
  return (
    <div className="hover-lift rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border-base/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="font-body text-[15px] font-black tracking-tight text-sky-950">আজকের ক্লাস</h2>
            <p className="font-body text-[11px] font-medium text-muted">{todayLabel}</p>
          </div>
        </div>
        <Link href="/batches" className="font-body text-[11.5px] font-bold text-sky-600 hover:underline">
          সব ব্যাচ →
        </Link>
      </div>

      {batches.length === 0 ? (
        <p className="py-4 text-center font-body text-[13px] text-muted">আজ কোনো নির্ধারিত ক্লাস নেই।</p>
      ) : (
        <div className="space-y-2">
          {batches.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-surface-muted/50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-body text-[12px] font-black">
                {b.name.includes("Combine") ? "C" : b.name.includes("ICT") ? "I" : "E"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-[13px] font-bold text-sky-950">{b.name}</p>
                <p className="truncate font-body text-[11px] text-muted">{b.schedule}</p>
              </div>
              <Badge tone="info">{b.target_cohort}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
