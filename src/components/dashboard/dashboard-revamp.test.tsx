import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/date-time', async () => {
  const actual = await vi.importActual<typeof import('@/lib/date-time')>('@/lib/date-time');
  return { ...actual, localDateOnlyFromDate: () => '2026-11-07' };
});

import { SocialCta } from './sections/SocialCta';
import { TripsSection } from './TripsSection';
import { MapFallback } from './MapFallback';

describe('dashboard revamp surfaces', () => {
  it('keeps stories unavailable and routes discover and itineraries to working pages', () => {
    render(
      <MemoryRouter>
        <SocialCta />
      </MemoryRouter>,
    );
    const unavailable = screen.getByRole('button', { name: /unavailable/i }) as HTMLButtonElement;
    expect(unavailable.disabled).toBe(true);
    expect(screen.getByText(/there is no feed here/i).textContent).toMatch(/no feed/i);
    expect(screen.queryByText(/posted/i)).toBeNull();
    expect((screen.getByRole('button', { name: /discover/i }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: /your itineraries/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('puts an in-progress Nov 1–15 trip with upcoming trips, not past trips', () => {
    render(
      <MemoryRouter>
        <TripsSection
          loading={false}
          activeItineraries={[{
            id: 7,
            itin_name: 'Iberia week',
            itin_date_start: '2026-11-01',
            itin_date_end: '2026-11-15',
            itin_locations: ['Madrid, Spain'],
          }]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /now & upcoming/i }).textContent).toMatch(/now & upcoming/i);
    expect(screen.getByText('Iberia week').textContent).toBe('Iberia week');
    expect(screen.getByText(/no past trips yet/i).textContent).toMatch(/past/i);
    expect(screen.getByText('active').textContent).toBe('active');
  });

  it('renders a country list instead of an empty map panel', () => {
    const { container } = render(
      <MapFallback
        title="Map unavailable"
        detail="Tiles or the map key did not load."
        countries={['Spain', 'Japan']}
      />,
    );
    expect(screen.getByText('Map unavailable').textContent).toBe('Map unavailable');
    expect(screen.getByText('Spain').textContent).toBe('Spain');
    expect((container.firstChild as HTMLElement).className).toContain('bg-muted');
  });
});
