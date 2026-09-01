/**
 * Synthetic Discover fixtures. Fictional creators only — no real, identifiable
 * or celebrity attribution. "Inspired by" language is used for style cues.
 * No production data is read here.
 */

import type {
  ItineraryCardProjection,
  PublicItineraryDetail,
  PublicProfileProjection,
  RegionGroup,
} from './types';

const GRADIENTS = [
  'linear-gradient(135deg,#ff849c,#ffce87)',
  'linear-gradient(135deg,#171822,#ff849c)',
  'linear-gradient(135deg,#ffce87,#faf7f2)',
  'linear-gradient(135deg,#2b3350,#ff849c)',
  'linear-gradient(135deg,#ff849c,#2b3350)',
];

type Seed = {
  title: string;
  summary: string;
  destinations: string[];
  days: number;
  group: RegionGroup;
  author: string;
  curatedBy: 'taai' | 'community';
};

const SEEDS: Seed[] = [
  // Group A — USA, Canada, Bahamas, Mexico, Central America
  { title: 'Pacific Coast Slow Drive', summary: 'Big Sur pull-offs, cold-water swims and one very good bakery.', destinations: ['San Francisco', 'Big Sur', 'Santa Barbara'], days: 8, group: 'A', author: 'June Marlowe', curatedBy: 'taai' },
  { title: 'Banff in Shoulder Season', summary: 'Lakes without the queues, plus a hot-spring evening.', destinations: ['Calgary', 'Banff', 'Lake Louise'], days: 5, group: 'A', author: 'Ellis Ward', curatedBy: 'community' },
  { title: 'Bahamas Out Islands', summary: 'Ferry-hopping, conch shacks and reef mornings.', destinations: ['Nassau', 'Harbour Island', 'Eleuthera'], days: 4, group: 'A', author: 'Cass Rivera', curatedBy: 'taai' },
  { title: 'Oaxaca Market Week', summary: 'Mezcal tasting, mole classes and a Sunday market crawl.', destinations: ['Oaxaca City', 'Hierve el Agua'], days: 5, group: 'A', author: 'Nina Delacroix', curatedBy: 'community' },
  { title: 'Costa Rica Two Coasts', summary: 'Cloud forest to Pacific surf, inspired by classic overland routes.', destinations: ['San José', 'Monteverde', 'Santa Teresa'], days: 9, group: 'A', author: 'Theo Banks', curatedBy: 'taai' },

  // Group B — South America / LATAM
  { title: 'Patagonia Long Weekend', summary: 'Three big walks and a lot of wind.', destinations: ['El Calafate', 'El Chaltén'], days: 4, group: 'B', author: 'Mara Quintero', curatedBy: 'taai' },
  { title: 'Peru Highlands Loop', summary: 'Cusco acclimatisation, Sacred Valley, one train day.', destinations: ['Lima', 'Cusco', 'Ollantaytambo'], days: 9, group: 'B', author: 'Iva Solano', curatedBy: 'community' },
  { title: 'Colombia Coffee & Coast', summary: 'Finca mornings then Caribbean afternoons.', destinations: ['Medellín', 'Salento', 'Cartagena'], days: 10, group: 'B', author: 'Rafa Iturbe', curatedBy: 'taai' },
  { title: 'Rio to Paraty', summary: 'City beaches, colonial streets, boat day.', destinations: ['Rio de Janeiro', 'Paraty'], days: 5, group: 'B', author: 'Lu Ferraz', curatedBy: 'community' },

  // Group C — Europe & Middle East
  { title: 'Lisbon & the Alentejo', summary: 'Tiles, tinned fish and cork-oak backroads.', destinations: ['Lisbon', 'Évora', 'Comporta'], days: 7, group: 'C', author: 'Sofia Mendes', curatedBy: 'taai' },
  { title: 'Dolomites Hut Route', summary: 'Rifugio dinners and sunrise ridgelines.', destinations: ['Bolzano', 'Ortisei', 'Cortina'], days: 5, group: 'C', author: 'Anton Brecht', curatedBy: 'community' },
  { title: 'Athens to Two Islands', summary: 'Museum morning, then ferries.', destinations: ['Athens', 'Naxos', 'Paros'], days: 9, group: 'C', author: 'Elena Vasilis', curatedBy: 'taai' },
  { title: 'Amman & Wadi Rum', summary: 'Ruins, desert camp, Dead Sea float.', destinations: ['Amman', 'Petra', 'Wadi Rum'], days: 7, group: 'C', author: 'Karim Nasr', curatedBy: 'taai' },
  { title: 'Paris in Three Days', summary: 'One museum, two markets, zero queues before 10am.', destinations: ['Paris'], days: 3, group: 'C', author: 'Camille Roux', curatedBy: 'community' },

  // Group D — Africa through Australia
  { title: 'Cape Town & Winelands', summary: 'Table Mountain early, Stellenbosch late.', destinations: ['Cape Town', 'Stellenbosch'], days: 5, group: 'D', author: 'Thandi Mokoena', curatedBy: 'taai' },
  { title: 'Marrakech Riads & Atlas', summary: 'Souk navigation plus a mountain overnight.', destinations: ['Marrakech', 'Imlil'], days: 4, group: 'D', author: 'Yasmin Alaoui', curatedBy: 'community' },
  { title: 'Tanzania Green Season', summary: 'Fewer vehicles, dramatic skies, inspired by classic safari circuits.', destinations: ['Arusha', 'Serengeti', 'Zanzibar'], days: 10, group: 'D', author: 'Baraka Juma', curatedBy: 'taai' },
  { title: 'Sydney to Byron', summary: 'Coast road, surf lessons, one long lunch.', destinations: ['Sydney', 'Byron Bay'], days: 8, group: 'D', author: 'Pip Hargreaves', curatedBy: 'community' },

  // Group F — Asia & remaining regions
  { title: 'Tokyo Neighbourhood Week', summary: 'One district a day, trains only.', destinations: ['Tokyo'], days: 7, group: 'F', author: 'Ren Kitamura', curatedBy: 'taai' },
  { title: 'Kyoto & Kanazawa Rail', summary: 'Temples, gardens, seafood market.', destinations: ['Kyoto', 'Kanazawa'], days: 5, group: 'F', author: 'Aiko Serizawa', curatedBy: 'community' },
  { title: 'Vietnam North to Centre', summary: 'Hanoi street food then Hoi An tailoring.', destinations: ['Hanoi', 'Ninh Binh', 'Hoi An'], days: 10, group: 'F', author: 'Linh Pham', curatedBy: 'taai' },
  { title: 'Bali Off-Peak', summary: 'Ubud mornings, east-coast afternoons.', destinations: ['Ubud', 'Amed'], days: 8, group: 'F', author: 'Gede Astawa', curatedBy: 'community' },
  { title: 'Seoul Weekend Reset', summary: 'Bathhouse, market, one hike.', destinations: ['Seoul'], days: 3, group: 'F', author: 'Hana Choi', curatedBy: 'taai' },
];

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const MOCK_CARDS: ItineraryCardProjection[] = SEEDS.map((seed, index) => ({
  id: `mock-${index + 1}`,
  publicSlug: slugify(seed.title),
  title: seed.title,
  summary: seed.summary,
  destinations: seed.destinations,
  dayCount: seed.days,
  regionGroup: seed.group,
  coverGradient: GRADIENTS[index % GRADIENTS.length],
  cloneCount: ((index * 37) % 240) + 6,
  publishedAt: new Date(Date.UTC(2026, index % 12, ((index * 3) % 27) + 1)).toISOString(),
  author: { slug: slugify(seed.author), displayName: seed.author, fictional: true },
  curatedBy: seed.curatedBy,
  moderationStatus: 'ok',
}));

export interface DiscoverRow {
  id: string;
  title: string;
  subtitle: string;
  cards: ItineraryCardProjection[];
}

export const DISCOVER_ROWS: DiscoverRow[] = [
  {
    id: 'taai',
    title: 'Trips by taai',
    subtitle: 'Curated by our planning team',
    cards: MOCK_CARDS.filter(c => c.curatedBy === 'taai'),
  },
  {
    id: 'featured',
    title: 'Featured',
    subtitle: 'Hand-picked this month',
    cards: [...MOCK_CARDS].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 10),
  },
  {
    id: 'trending',
    title: 'Trending',
    subtitle: 'Most cloned in the last 30 days',
    cards: [...MOCK_CARDS].sort((a, b) => b.cloneCount - a.cloneCount).slice(0, 10),
  },
  {
    id: 'weekend',
    title: 'Weekend Escapes',
    subtitle: '3–5 days',
    cards: MOCK_CARDS.filter(c => c.dayCount >= 3 && c.dayCount <= 5),
  },
  {
    id: 'complete',
    title: 'Complete Journeys',
    subtitle: '7–10 days',
    cards: MOCK_CARDS.filter(c => c.dayCount >= 7 && c.dayCount <= 10),
  },
];

export const DISCOVER_PAGE_SIZE = 6;

export const getMockCardBySlug = (slug: string) =>
  MOCK_CARDS.find(c => c.publicSlug === slug) ?? null;

export const getMockItineraryDetail = (slug: string): PublicItineraryDetail | null => {
  const card = getMockCardBySlug(slug);
  if (!card) return null;

  const days = Array.from({ length: card.dayCount }, (_, i) => {
    const city = card.destinations[i % card.destinations.length];
    return {
      day: i + 1,
      city,
      places: [
        { name: `Stay reference · ${city}`, kind: 'stay' as const, note: 'Neighbourhood suggestion — prices searched fresh on clone.' },
        { name: `Morning walk · ${city}`, kind: 'activity' as const, note: 'Curated place reference, no booking attached.' },
        { name: `Dinner idea · ${city}`, kind: 'dining' as const, note: 'Reserve yourself; nothing is held.' },
      ],
    };
  });

  return {
    ...card,
    days,
    attribution: `Inspired itinerary shared by ${card.author.displayName} (fictional creator, synthetic fixture).`,
  };
};

export const getMockProfile = (slug: string): PublicProfileProjection | null => {
  const cards = MOCK_CARDS.filter(c => c.author.slug === slug);
  if (cards.length === 0) return null;
  return {
    slug,
    displayName: cards[0].author.displayName,
    shortBio: 'Fictional creator used for synthetic Discover fixtures. Public itineraries only.',
    discoverable: true,
    fictional: true,
    itineraries: cards,
  };
};
