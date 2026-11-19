import { useState } from 'react';
import { formatStoryMoney, type CategorySlice, type ComparisonItem, type MonthBucket } from '@/lib/dashboard/travel-story';

export function Donut({
  slices,
  center,
  caption,
  currency,
}: {
  slices: CategorySlice[];
  center: string;
  caption: string;
  currency: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  let offset = 0;
  const label = active == null ? caption : slices[active].label;
  const figure = active == null ? center : formatStoryMoney(slices[active].amount, currency);

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,210px)_1fr]">
      <div className="relative mx-auto grid w-full max-w-[210px] place-items-center">
        <svg viewBox="0 0 160 160" className="w-full -rotate-90" role="img" aria-label={caption}>
          {slices.map((slice, index) => {
            const length = total > 0 ? (circumference * slice.amount) / total : 0;
            const circle = (
              <circle
                key={slice.key}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={active === index ? 27 : 21}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                opacity={active == null || active === index ? 1 : 0.3}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
              />
            );
            offset += length;
            return circle;
          })}
        </svg>
        <div className="pointer-events-none absolute text-center">
          <div className="bright-grad-text font-display text-[26px] font-semibold leading-none tracking-[-0.04em]">{figure}</div>
          <div className="font-mono-label mt-1.5">{label}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1" onMouseLeave={() => setActive(null)}>
        {slices.map((slice, index) => (
          <button
            key={slice.key}
            type="button"
            className={`flex items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left ${active === index ? 'bg-[var(--cream-2)]' : ''}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
          >
            <i className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: slice.color }} />
            <span className="text-[13px] font-medium text-foreground">{slice.label}</span>
            <span className="h-1 min-w-7 flex-1 overflow-hidden rounded-sm bg-[var(--cream-2)]">
              <i className="block h-full rounded-sm" style={{ width: `${slice.percent}%`, background: slice.color }} />
            </span>
            <span className="min-w-[62px] text-right font-mono text-[11px] text-foreground">{formatStoryMoney(slice.amount, currency)}</span>
            <span className="min-w-[34px] text-right font-mono text-[10px] text-[var(--ink-3)]">{slice.percent.toFixed(1)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CompareList({ items }: { items: ComparisonItem[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={`${item.icon}-${item.label}`} className="grid grid-cols-[30px_minmax(0,1fr)_minmax(0,46%)] items-center gap-3">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[10px] bg-[var(--cream-2)] text-[15px]" aria-hidden="true">{item.icon}</span>
          <span className="relative h-[26px] overflow-hidden rounded-full bg-[var(--cream-2)]">
            <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, Math.max(item.percent, 8))}%`, background: 'var(--grad-deep)' }} />
          </span>
          <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-[12.5px] leading-tight text-[var(--ink-2)]">
            <b className="font-display text-[15px] font-semibold tracking-[-0.025em] text-foreground">{item.value}</b>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CumulativeChart({
  months,
  currency,
}: {
  months: MonthBucket[];
  currency: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (!months.length) return <p className="py-8 text-center text-sm text-[var(--ink-2)]">Nothing planned in this view.</p>;
  const width = 740;
  const height = 230;
  const left = 44;
  const right = 14;
  const top = 16;
  const bottom = 30;
  let running = 0;
  const cumulative = months.map((month) => (running += month.amount));
  let priorRunning = 0;
  const prior = months.some((month) => month.prior != null)
    ? months.map((month) => (priorRunning += month.prior ?? 0))
    : null;
  const max = Math.max(cumulative[cumulative.length - 1] ?? 0, prior ? prior[prior.length - 1] : 0, 1) * 1.08;
  const x = (index: number) => left + (months.length === 1 ? (width - left - right) / 2 : index * ((width - left - right) / (months.length - 1)));
  const y = (value: number) => height - bottom - (value / max) * (height - top - bottom);
  const path = (values: number[]) => values.map((value, index) => `${index ? 'L' : 'M'}${x(index)} ${y(value)}`).join(' ');
  const currentPath = path(cumulative);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label="Cumulative planned spend by service month">
        <defs>
          <linearGradient id="metrics-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F2536E" />
            <stop offset="1" stopColor="#E2913C" />
          </linearGradient>
          <linearGradient id="metrics-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F2536E" stopOpacity="0.22" />
            <stop offset="1" stopColor="#E2913C" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((step) => {
          const value = (max * step) / 4;
          const yy = y(value);
          return (
            <g key={step}>
              <line x1={left} y1={yy} x2={width - right} y2={yy} stroke="var(--line-2)" />
              <text x={left - 9} y={yy + 3} textAnchor="end" className="fill-[var(--ink-3)] font-mono text-[8.5px]">{axisMoney(value)}</text>
            </g>
          );
        })}
        {prior && <path d={path(prior)} fill="none" stroke="rgba(23,19,16,0.26)" strokeWidth="1.5" strokeDasharray="4 4" />}
        <path d={`${currentPath} L${x(cumulative.length - 1)} ${height - bottom} L${x(0)} ${height - bottom} Z`} fill="url(#metrics-fill)" />
        <path d={currentPath} fill="none" stroke="url(#metrics-line)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {months.map((month, index) => (
          <g key={month.key}>
            <text x={x(index)} y={height - bottom + 17} textAnchor="middle" className="fill-[var(--ink-3)] font-mono text-[8.5px]">{month.label}</text>
            {month.amount > 0 && <circle cx={x(index)} cy={y(cumulative[index])} r="3.6" fill="#fff" stroke="#F2536E" strokeWidth="2.2" />}
            <rect
              x={x(index) - 26}
              y={top}
              width="52"
              height={height - top - bottom}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>
      {hover != null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[120%] rounded-[10px] bg-[#171822] px-2.5 py-2 text-[11.5px] text-white shadow-m"
          style={{ left: `${(x(hover) / width) * 100}%`, top: `${(y(cumulative[hover]) / height) * 100}%` }}
        >
          <span className="mb-0.5 block font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/50">{months[hover].label} · cumulative</span>
          <b className="font-display font-semibold">{formatStoryMoney(cumulative[hover], currency)}</b>
          {prior && <span className="text-white/55"> vs {formatStoryMoney(prior[hover], currency)}</span>}
        </div>
      )}
    </div>
  );
}

export function MonthBars({ months, currency }: { months: MonthBucket[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!months.length) return <p className="py-8 text-center text-sm text-[var(--ink-2)]">Nothing planned in this view.</p>;
  const width = 740;
  const height = 220;
  const left = 44;
  const right = 14;
  const top = 14;
  const bottom = 30;
  const max = Math.max(...months.map((month) => month.amount), 1) * 1.12;
  const slot = (width - left - right) / months.length;
  const pad = slot * 0.26;
  const y = (value: number) => height - bottom - (value / max) * (height - top - bottom);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label="Planned spend by month">
        <defs>
          <linearGradient id="metrics-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F2536E" />
            <stop offset="1" stopColor="#E2913C" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((step) => {
          const value = (max * step) / 3;
          const yy = y(value);
          return (
            <g key={step}>
              <line x1={left} y1={yy} x2={width - right} y2={yy} stroke="var(--line-2)" />
              <text x={left - 9} y={yy + 3} textAnchor="end" className="fill-[var(--ink-3)] font-mono text-[8.5px]">{axisMoney(value)}</text>
            </g>
          );
        })}
        {months.map((month, index) => {
          const barHeight = Math.max((month.amount / max) * (height - top - bottom), 3);
          const bx = left + index * slot + pad;
          const barWidth = slot - pad * 2;
          return (
            <g key={month.key} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}>
              <rect
                x={bx}
                y={height - bottom - barHeight}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill={month.amount ? 'url(#metrics-bar)' : 'rgba(23,19,16,0.055)'}
              />
              <text x={bx + barWidth / 2} y={height - bottom + 17} textAnchor="middle" className="fill-[var(--ink-3)] font-mono text-[8.5px]">{month.label}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-[10px] bg-[#171822] px-2.5 py-2 text-[11.5px] text-white">
          <span className="mb-0.5 block font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/50">{months[hover].label}</span>
          <b className="font-display font-semibold">{months[hover].amount ? formatStoryMoney(months[hover].amount, currency) : 'Nothing planned'}</b>
        </div>
      )}
    </div>
  );
}

export function WeekdayChart({ days }: { days: Array<{ label: string; count: number }> }) {
  const max = Math.max(...days.map((day) => day.count), 1);
  return (
    <div className="flex h-[152px] items-end gap-2" role="img" aria-label="Flights by departure weekday">
      {days.map((day) => (
        <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="font-mono text-[10px] text-[var(--ink-2)]">{day.count || ''}</span>
          <span
            className="w-full rounded-t-[7px] rounded-b-[3px]"
            style={{
              height: `${day.count ? Math.max(22, (day.count / max) * 112) : 4}px`,
              background: day.count ? 'var(--grad-deep)' : 'var(--cream-2)',
            }}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-3)]">{day.label}</span>
        </div>
      ))}
    </div>
  );
}

function axisMoney(value: number): string {
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${Math.round(value)}`;
}
