import { useMemo } from 'react';
import { Compass, Plane, Hotel, Utensils } from 'lucide-react';

export type CartCategory = 'activities' | 'transportation' | 'properties' | 'reservations';

export const CART_CATEGORIES: { key: CartCategory; label: string; varName: string; icon: typeof Plane }[] = [
  { key: 'activities', label: 'Activities', varName: '--cat-activities', icon: Compass },
  { key: 'transportation', label: 'Transportation', varName: '--cat-transportation', icon: Plane },
  { key: 'properties', label: 'Properties', varName: '--cat-properties', icon: Hotel },
  { key: 'reservations', label: 'Reservations', varName: '--cat-reservations', icon: Utensils },
];

export const categorizeCartType = (type: string): CartCategory => {
  const t = (type || '').toLowerCase();
  if (['flight', 'car', 'car_rental', 'transfer', 'train', 'transportation'].includes(t)) return 'transportation';
  if (['hotel', 'property', 'vrbo', 'rental', 'stay', 'accommodation'].includes(t)) return 'properties';
  if (['restaurant', 'dining', 'reservation', 'venue'].includes(t)) return 'reservations';
  return 'activities';
};

interface CartBudgetRingProps {
  /** Selected amount per category (provider prices, pre-tax). */
  totals: Record<CartCategory, number>;
  /** Grand total shown in the middle (taxes included). */
  centerValue: number;
  centerLabel?: string;
  selectedCount: number;
  totalCount: number;
}

const formatMoney = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RADIUS = 62;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const CartBudgetRing = ({
  totals,
  centerValue,
  centerLabel = 'Selected total',
  selectedCount,
  totalCount,
}: CartBudgetRingProps) => {
  const sum = useMemo(
    () => CART_CATEGORIES.reduce((s, c) => s + (totals[c.key] || 0), 0),
    [totals]
  );

  const segments = useMemo(() => {
    let offset = 0;
    return CART_CATEGORIES.map((c) => {
      const value = totals[c.key] || 0;
      const fraction = sum > 0 ? value / sum : 0;
      const length = fraction * CIRCUMFERENCE;
      const seg = { ...c, value, fraction, length, offset };
      offset += length;
      return seg;
    });
  }, [totals, sum]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center lg:flex-col">
      <div className="relative h-[168px] w-[168px] flex-shrink-0">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-muted"
          />
          {sum > 0 &&
            segments.map((seg) =>
              seg.length > 0 ? (
                <circle
                  key={seg.key}
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE}
                  strokeLinecap="butt"
                  stroke={`hsl(var(${seg.varName}))`}
                  strokeDasharray={`${Math.max(seg.length - 1.5, 0)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-seg.offset}
                  className="transition-all duration-500 ease-out"
                />
              ) : null
            )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{centerLabel}</span>
          <span className="mt-0.5 text-base font-bold tabular-nums text-foreground leading-tight">
            {formatMoney(centerValue)}
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">
            {selectedCount} of {totalCount} selected
          </span>
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {segments.map((seg) => {
          const Icon = seg.icon;
          return (
            <li
              key={seg.key}
              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs ${
                seg.value > 0 ? 'bg-background/60' : 'opacity-50'
              }`}
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: `hsl(var(${seg.varName}))` }}
                />
                <Icon className="h-3.5 w-3.5" />
                {seg.label}
              </span>
              <span className="tabular-nums font-medium text-foreground">
                {formatMoney(seg.value)}
                <span className="ml-1 text-muted-foreground font-normal">
                  {sum > 0 ? `${Math.round(seg.fraction * 100)}%` : '0%'}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
