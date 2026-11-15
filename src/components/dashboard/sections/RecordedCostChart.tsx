import { formatRecordedMoney, type ChartSeries } from '@/lib/dashboard/travel-metrics';

interface RecordedCostChartProps {
  series: ChartSeries[];
  caption: string;
}

export const RecordedCostChart = ({ series, caption }: RecordedCostChartProps) => {
  if (series.length === 0) return null;
  const shown = series[0];
  const points = shown.points;
  const width = 320;
  const height = 140;
  const pad = 8;
  const max = Math.max(...points.map((point) => point.cumulative), 0);
  const min = Math.min(...points.map((point) => point.cumulative), 0);
  const span = max - min || 1;
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = pad + index * step;
    const y = height - pad - ((point.cumulative - min) / span) * (height - pad * 2);
    return { x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const area = coords.length
    ? `M${coords[0].x},${height - pad} ${coords.map((point) => `L${point.x},${point.y}`).join(' ')} L${coords[coords.length - 1].x},${height - pad} Z`
    : '';
  const last = points[points.length - 1];

  return (
    <figure className="mt-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
        <p className="font-display text-lg font-semibold text-foreground">
          {formatRecordedMoney(last?.cumulative ?? 0, shown.currency)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${shown.kind === 'settled' ? 'Verified paid' : 'Recorded costs'} cumulative ${shown.currency}`}
        className="h-36 w-full text-primary"
      >
        <path d={area} className="fill-primary/15" />
        <polyline points={line} fill="none" className="stroke-primary" strokeWidth="2" />
      </svg>
      <table className="mt-2 w-full text-left text-xs text-muted-foreground">
        <caption className="sr-only">Cumulative values by date for {shown.currency}</caption>
        <thead>
          <tr>
            <th className="font-medium">Date</th>
            <th className="font-medium">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {points.slice(-4).map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{formatRecordedMoney(point.cumulative, shown.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {series.length > 1 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {series.length - 1} other {series.length - 1 === 1 ? 'currency is' : 'currencies are'} listed in Analytics and not added to this line.
        </p>
      )}
    </figure>
  );
};
