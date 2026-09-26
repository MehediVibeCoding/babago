import { formatTaka } from "@/lib/utils";

export default function RevenueChart({ data }: { data: { label: string; total: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const width = 560;
  const height = 190;
  const padding = 28;
  const barGap = 18;
  const barWidth = (width - padding * 2 - barGap * (data.length - 1)) / data.length;

  return (
    <div className="hover-lift rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-body text-[15px] font-black tracking-tight text-sky-950">মাসিক কালেকশন ট্রেন্ড</h2>
        <span className="font-body text-[11px] font-semibold text-muted">শেষ {data.length} মাস</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label="মাসিক কালেকশন ট্রেন্ড চার্ট">
        {data.map((d, i) => {
          const barHeight = max === 0 ? 0 : (d.total / max) * (height - padding * 2);
          const x = padding + i * (barWidth + barGap);
          const y = height - padding - barHeight;
          return (
            <g key={d.label}>
              <rect x={x} y={padding} width={barWidth} height={height - padding * 2} rx={8} fill="#f1f5f9" />
              <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 3)} rx={8} fill="url(#revBarGrad)" />
              <text x={x + barWidth / 2} y={height - padding + 16} textAnchor="middle" className="fill-muted" fontSize="11" fontWeight={600}>
                {d.label}
              </text>
              {d.total > 0 && (
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="fill-sky-950" fontSize="10.5" fontWeight={800}>
                  {formatTaka(d.total)}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="revBarGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
