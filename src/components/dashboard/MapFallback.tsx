import { MapPin } from 'lucide-react';

interface MapFallbackProps {
  title: string;
  detail: string;
  countries: string[];
}

export const MapFallback = ({ title, detail, countries }: MapFallbackProps) => {
  return (
    <div className="flex h-full min-h-[220px] flex-col justify-between rounded-lg border border-border bg-muted p-4">
      <div>
        <MapPin className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      {countries.length > 0 ? (
        <ul className="mt-3 flex max-h-28 flex-wrap gap-1 overflow-y-auto" aria-label="Countries on your profile">
          {countries.map((country) => (
            <li key={country} className="rounded-full bg-background px-2 py-1 text-xs text-foreground">
              {country}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No countries are saved on your profile.</p>
      )}
    </div>
  );
};
