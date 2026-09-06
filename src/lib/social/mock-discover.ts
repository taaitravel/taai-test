/**
 * Discover fixtures — six fully authored sample itineraries.
 * Two rows only: "Trips by taai" (3) and "Featured" (3).
 *
 * Creators are fictional. Venues referenced are real, publicly known places
 * used as planning references only: nothing is booked, held or priced live.
 * Amounts are indicative and always re-searched on clone.
 * No production data is read here.
 */

import type {
  ItineraryCardProjection,
  PublicItineraryDay,
  PublicItineraryDetail,
  PublicItineraryPlace,
  PublicPlaceKind,
  PublicProfileProjection,
  RegionGroup,
} from './types';

type DaySeed = {
  city: string;
  places: PublicItineraryPlace[];
};

type TripSeed = {
  title: string;
  summary: string;
  destinations: string[];
  group: RegionGroup;
  author: string;
  curatedBy: 'taai' | 'community';
  coverGradient: string;
  currency: string;
  startDate: string;
  tags: string[];
  cloneCount: number;
  days: DaySeed[];
};

const TRIPS: TripSeed[] = [
  // ───────────────────────── Trips by taai ─────────────────────────
  {
    title: 'Tokyo by Neighbourhood',
    summary: 'One district a day, trains only — ramen counters, a garden morning and Toyosu at dawn.',
    destinations: ['Tokyo'],
    group: 'F',
    author: 'Ren Kitamura',
    curatedBy: 'taai',
    coverGradient: 'linear-gradient(135deg,#171822,#ff849c)',
    currency: 'JPY',
    startDate: '2026-10-12',
    tags: ['City', 'Food-led', 'Rail only', 'Slow mornings'],
    cloneCount: 148,
    days: [
      {
        city: 'Tokyo',
        places: [
          { name: 'Trunk (Hotel) Yoyogi Park', kind: 'stay', time: '15:00', area: 'Shibuya', priceApprox: 52000, note: 'Five nights, park-side. Quiet rooms face the garden; ask for a high floor.' },
          { name: 'Afuri Ebisu', kind: 'dining', time: '18:30', area: 'Ebisu', priceApprox: 1600, note: 'Yuzu shio ramen at the counter. No reservations — go before 19:00.' },
          { name: 'Bar Trench', kind: 'dining', time: '20:30', area: 'Ebisu', priceApprox: 2600, note: 'Small cocktail bar, ten seats. Good first-night reset after the flight.' },
        ],
      },
      {
        city: 'Tokyo',
        places: [
          { name: 'Bread & Espresso &', kind: 'dining', time: '08:00', area: 'Omotesando', priceApprox: 1400, note: 'Mou butter toast and a flat white before the crowds.' },
          { name: 'Shinjuku Gyoen National Garden', kind: 'activity', time: '10:00', area: 'Shinjuku', priceApprox: 500, note: 'Enter at Sendagaya gate; the greenhouse and the Taiwan pavilion pond are the quiet corners.' },
          { name: 'Tsunahachi', kind: 'dining', time: '13:00', area: 'Shinjuku', priceApprox: 2800, note: 'Tempura fried in front of you at the original 1923 shop.' },
          { name: 'Omoide Yokocho', kind: 'dining', time: '19:00', area: 'Shinjuku', priceApprox: 3500, note: 'Yakitori alley. Stand where there is space, order two skewers at a time.' },
        ],
      },
      {
        city: 'Tokyo',
        places: [
          { name: 'Yanaka Ginza', kind: 'activity', time: '09:00', area: 'Yanaka', priceApprox: 0, note: 'Old-Tokyo shopping street. Walk down the "sunset stairs" and through Yanaka cemetery.' },
          { name: 'Tokyo National Museum', kind: 'activity', time: '11:00', area: 'Ueno', priceApprox: 1000, note: 'Honkan building only — Japanese galleries, roughly 90 minutes.' },
          { name: 'Kamachiku', kind: 'dining', time: '14:00', area: 'Nezu', priceApprox: 2200, note: 'Udon in a converted brick warehouse with a garden room.' },
          { name: 'Kayaba Coffee', kind: 'dining', time: '17:00', area: 'Yanaka', priceApprox: 1100, note: 'Egg sandwich and a coffee jelly in a 1938 corner house.' },
        ],
      },
      {
        city: 'Tokyo',
        places: [
          { name: 'Toyosu Market', kind: 'activity', time: '06:30', area: 'Toyosu', priceApprox: 0, note: 'Free observation decks over the tuna auction. Yurikamome line from Shimbashi.' },
          { name: 'Sushi Dai (Toyosu)', kind: 'dining', time: '08:00', area: 'Toyosu', priceApprox: 5500, note: 'Omakase breakfast. Queue forms before opening; allow an hour of waiting.' },
          { name: 'teamLab Planets', kind: 'activity', time: '11:00', area: 'Toyosu', priceApprox: 3800, note: 'Barefoot water rooms. Timed entry — pick the first slot after lunch.' },
          { name: 'Kagari Ginza', kind: 'dining', time: '19:00', area: 'Ginza', priceApprox: 1800, note: 'Tori paitan soba in a basement counter off Ginza 6-chome.' },
        ],
      },
      {
        city: 'Tokyo',
        places: [
          { name: 'Blue Bottle Kiyosumi-Shirakawa', kind: 'dining', time: '09:00', area: 'Kiyosumi', priceApprox: 900, note: 'Roastery warehouse; last slow morning of the trip.' },
          { name: 'Kiyosumi Teien', kind: 'activity', time: '10:30', area: 'Kiyosumi', priceApprox: 150, note: 'Stepping-stone pond garden, 45 minutes end to end.' },
          { name: 'Narita Express from Tokyo Station', kind: 'transit', time: '15:00', area: 'Marunouchi', priceApprox: 3070, note: 'Reserved seat, 55 minutes. Leave central Tokyo three hours before departure.' },
        ],
      },
    ],
  },
  {
    title: 'Lisbon & the Alentejo',
    summary: 'Tiles and tinned fish, then cork-oak backroads, a wine estate and one Comporta beach day.',
    destinations: ['Lisbon', 'Évora', 'Comporta'],
    group: 'C',
    author: 'Sofia Mendes',
    curatedBy: 'taai',
    coverGradient: 'linear-gradient(135deg,#ffce87,#ff849c)',
    currency: 'EUR',
    startDate: '2026-05-08',
    tags: ['City + country', 'Wine', 'Self-drive', 'Coast finish'],
    cloneCount: 96,
    days: [
      {
        city: 'Lisbon',
        places: [
          { name: 'Memmo Alfama', kind: 'stay', time: '15:00', area: 'Alfama', priceApprox: 265, note: 'Two nights. Rooftop pool over the Tagus; rooms are small but the terrace is the point.' },
          { name: 'Miradouro das Portas do Sol', kind: 'activity', time: '17:30', area: 'Alfama', priceApprox: 0, note: 'Ten-minute walk uphill from the hotel for the first view.' },
          { name: 'Taberna Sal Grosso', kind: 'dining', time: '20:00', area: 'Alfama', priceApprox: 35, note: 'Small plates, reserve ahead — they hold tables only until 20:15.' },
        ],
      },
      {
        city: 'Lisbon',
        places: [
          { name: 'Pastéis de Belém', kind: 'dining', time: '09:00', area: 'Belém', priceApprox: 6, note: 'Two warm custard tarts standing at the back counter, not the street queue.' },
          { name: 'Mosteiro dos Jerónimos', kind: 'activity', time: '10:30', area: 'Belém', priceApprox: 12, note: 'Cloister first, church after. Book a timed ticket the night before.' },
          { name: 'Time Out Market', kind: 'dining', time: '13:00', area: 'Cais do Sodré', priceApprox: 25, note: 'Lunch counters; go for the fish, skip the dessert stalls.' },
          { name: 'Cervejaria Ramiro', kind: 'dining', time: '20:00', area: 'Intendente', priceApprox: 48, note: 'Garlic prawns and a prego to finish. Expect to wait, take a ticket.' },
        ],
      },
      {
        city: 'Évora',
        places: [
          { name: 'Drive Lisbon to Évora', kind: 'transit', time: '09:00', area: 'A6 motorway', priceApprox: 45, note: 'Rental car collected in Lisbon, roughly 90 minutes with tolls.' },
          { name: 'Capela dos Ossos', kind: 'activity', time: '11:00', area: 'Évora centre', priceApprox: 6, note: 'Bone chapel plus the cathedral roof terrace next door.' },
          { name: 'Botequim da Mouraria', kind: 'dining', time: '13:00', area: 'Mouraria', priceApprox: 32, note: 'Nine counter seats, no reservations, closed at weekends.' },
          { name: 'Herdade da Malhadinha Nova', kind: 'stay', time: '16:30', area: 'Albernoa', priceApprox: 480, note: 'Two nights on a working wine estate; dinner is on site.' },
        ],
      },
      {
        city: 'Comporta',
        places: [
          { name: 'Malhadinha vineyard tasting', kind: 'activity', time: '10:00', area: 'Albernoa', priceApprox: 38, note: 'Cellar walk plus six pours; arrange at check-in.' },
          { name: 'Praia do Pego', kind: 'activity', time: '14:00', area: 'Comporta', priceApprox: 0, note: 'Dune boardwalk beach, wide and windless in the morning.' },
          { name: 'Cavalariça', kind: 'dining', time: '20:00', area: 'Comporta village', priceApprox: 55, note: 'Converted stables, open kitchen. Book two weeks out in season.' },
        ],
      },
      {
        city: 'Lisbon',
        places: [
          { name: 'Drive Comporta to Lisbon', kind: 'transit', time: '11:00', area: 'A2 / 25 de Abril bridge', priceApprox: 20, note: 'Around 90 minutes; cross the bridge before the afternoon build-up.' },
          { name: 'Ler Devagar', kind: 'activity', time: '14:00', area: 'LX Factory', priceApprox: 0, note: 'Bookshop in an old print works — last stop before the airport.' },
          { name: 'Transfer to Humberto Delgado Airport', kind: 'transit', time: '17:00', area: 'Alcântara', priceApprox: 18, note: 'Drop the car at the terminal; 20 minutes without traffic.' },
        ],
      },
    ],
  },
  {
    title: 'Costa Rica: Two Coasts',
    summary: 'Cloud forest mornings then Pacific surf, with one long transfer day in the middle.',
    destinations: ['San José', 'Monteverde', 'Santa Teresa'],
    group: 'A',
    author: 'Theo Banks',
    curatedBy: 'taai',
    coverGradient: 'linear-gradient(135deg,#2b3350,#ffce87)',
    currency: 'USD',
    startDate: '2026-11-07',
    tags: ['Nature', 'Surf', 'Self-drive', 'Green season'],
    cloneCount: 74,
    days: [
      {
        city: 'San José',
        places: [
          { name: 'Hotel Grano de Oro', kind: 'stay', time: '15:00', area: 'Paseo Colón', priceApprox: 215, note: 'One night only — a landing pad near the airport road.' },
          { name: 'Restaurante Grano de Oro', kind: 'dining', time: '19:30', area: 'Paseo Colón', priceApprox: 45, note: 'Courtyard dining in the hotel; the sea bass is the order.' },
        ],
      },
      {
        city: 'Monteverde',
        places: [
          { name: 'Drive San José to Monteverde', kind: 'transit', time: '08:30', area: 'Route 1 / 606', priceApprox: 90, note: 'Four hours, last 30 minutes unpaved. 4x4 recommended in green season.' },
          { name: 'Monteverde Lodge & Gardens', kind: 'stay', time: '14:00', area: 'Santa Elena', priceApprox: 235, note: 'Two nights. Trails leave from the property.' },
          { name: 'Curi-Cancha night walk', kind: 'activity', time: '17:45', area: 'Monteverde', priceApprox: 28, note: 'Guided, two hours, torches provided. Book at the lodge desk.' },
        ],
      },
      {
        city: 'Monteverde',
        places: [
          { name: 'Monteverde Cloud Forest Reserve', kind: 'activity', time: '07:00', area: 'Monteverde', priceApprox: 25, note: 'First entry slot; Sendero Bosque Nuboso before the cloud closes in.' },
          { name: 'Selvatura hanging bridges', kind: 'activity', time: '11:30', area: 'Santa Elena', priceApprox: 45, note: 'Eight bridges, roughly two hours at a walking pace.' },
          { name: 'Sabor Tico', kind: 'dining', time: '19:00', area: 'Santa Elena', priceApprox: 18, note: 'Casado plates, local and unfussy. Cash is easiest.' },
        ],
      },
      {
        city: 'Santa Teresa',
        places: [
          { name: 'Drive and Puntarenas ferry to Paquera', kind: 'transit', time: '08:00', area: 'Nicoya crossing', priceApprox: 40, note: 'Ferry plus drive, six hours door to door. Arrive 45 minutes before sailing.' },
          { name: 'Nantipa', kind: 'stay', time: '16:00', area: 'Playa Carmen', priceApprox: 345, note: 'Three nights on the sand at the quieter Carmen end.' },
          { name: 'Sunset surf lesson', kind: 'activity', time: '17:30', area: 'Playa Carmen', priceApprox: 55, note: 'Board and rash guard included; the beach break is forgiving here.' },
        ],
      },
      {
        city: 'Santa Teresa',
        places: [
          { name: 'Morning paddle at Playa Carmen', kind: 'activity', time: '07:00', area: 'Playa Carmen', priceApprox: 25, note: 'Board rental for two hours at low tide.' },
          { name: 'Montezuma waterfalls', kind: 'activity', time: '11:00', area: 'Montezuma', priceApprox: 10, note: '45-minute drive, then a 25-minute scramble. Water shoes help.' },
          { name: "Koji's", kind: 'dining', time: '19:30', area: 'Santa Teresa', priceApprox: 62, note: 'Sushi from the day\'s catch. Reserve when you arrive in town.' },
        ],
      },
      {
        city: 'San José',
        places: [
          { name: 'Beach yoga at Nantipa', kind: 'activity', time: '08:00', area: 'Playa Carmen', priceApprox: 20, note: 'One hour, open to non-guests too.' },
          { name: 'Transfer Santa Teresa to SJO', kind: 'transit', time: '11:00', area: 'Nicoya to San José', priceApprox: 120, note: 'Shared shuttle plus ferry, around six hours. Or a 40-minute Sansa flight from Tambor.' },
        ],
      },
    ],
  },

  // ───────────────────────────── Featured ─────────────────────────────
  {
    title: 'Patagonia Long Weekend',
    summary: 'Three big walks, one glacier and a lot of wind — flown in and out of El Calafate.',
    destinations: ['El Calafate', 'El Chaltén'],
    group: 'B',
    author: 'Mara Quintero',
    curatedBy: 'community',
    coverGradient: 'linear-gradient(135deg,#171822,#2b3350)',
    currency: 'USD',
    startDate: '2026-11-19',
    tags: ['Hiking', 'Short trip', 'Shoulder season', 'Two bases'],
    cloneCount: 132,
    days: [
      {
        city: 'El Calafate',
        places: [
          { name: 'Design Suites Calafate', kind: 'stay', time: '14:00', area: 'Lago Argentino shore', priceApprox: 185, note: 'One night; lake-facing rooms on the upper floor.' },
          { name: 'Perito Moreno Glacier balconies', kind: 'activity', time: '15:30', area: 'Los Glaciares NP', priceApprox: 32, note: 'Afternoon light is better and the coaches have gone. Park entry paid at the gate.' },
          { name: 'La Tablita', kind: 'dining', time: '20:30', area: 'El Calafate centre', priceApprox: 42, note: 'Lamb from the asado cross. Book before you leave for the glacier.' },
        ],
      },
      {
        city: 'El Chaltén',
        places: [
          { name: 'Drive El Calafate to El Chaltén', kind: 'transit', time: '09:00', area: 'Ruta 40', priceApprox: 55, note: 'Three hours, straight and windy. Fill the tank in Calafate.' },
          { name: 'Hotel Poincenot', kind: 'stay', time: '13:00', area: 'El Chaltén', priceApprox: 225, note: 'Two nights, walking distance to every trailhead.' },
          { name: 'Mirador de los Cóndores', kind: 'activity', time: '16:00', area: 'El Chaltén', priceApprox: 0, note: 'Short acclimatiser, one hour return from the ranger station.' },
        ],
      },
      {
        city: 'El Chaltén',
        places: [
          { name: 'Laguna de los Tres', kind: 'activity', time: '06:30', area: 'Fitz Roy trail', priceApprox: 0, note: '20 km return, 8-10 hours. The last kilometre is the steep one — start in the dark.' },
          { name: 'La Cervecería Chaltén', kind: 'dining', time: '19:00', area: 'El Chaltén', priceApprox: 26, note: 'Locro and a pint after the descent. No reservations.' },
        ],
      },
      {
        city: 'El Calafate',
        places: [
          { name: 'Chorrillo del Salto', kind: 'activity', time: '09:00', area: 'El Chaltén', priceApprox: 0, note: 'Flat 4 km return to the waterfall — kind on tired legs.' },
          { name: 'Drive back to El Calafate airport', kind: 'transit', time: '13:00', area: 'Ruta 40', priceApprox: 55, note: 'Three hours plus the fuel stop; be at FTE two hours before the flight.' },
        ],
      },
    ],
  },
  {
    title: 'Cape Town & the Winelands',
    summary: 'Table Mountain early, Cape Point in the middle, then two nights among the vines.',
    destinations: ['Cape Town', 'Stellenbosch'],
    group: 'D',
    author: 'Thandi Mokoena',
    curatedBy: 'community',
    coverGradient: 'linear-gradient(135deg,#ff849c,#ffce87)',
    currency: 'ZAR',
    startDate: '2026-03-14',
    tags: ['City + wine', 'Big views', 'Fine dining', 'Self-drive'],
    cloneCount: 108,
    days: [
      {
        city: 'Cape Town',
        places: [
          { name: 'Gorgeous George', kind: 'stay', time: '15:00', area: 'City Bowl', priceApprox: 4200, note: 'Three nights on St George\'s Mall; rooftop pool for the late afternoon.' },
          { name: 'FYN Restaurant', kind: 'dining', time: '19:00', area: 'City Bowl', priceApprox: 1650, note: 'Japanese-Cape tasting menu. Reserve six weeks ahead.' },
        ],
      },
      {
        city: 'Cape Town',
        places: [
          { name: "Lion's Head sunrise walk", kind: 'activity', time: '05:45', area: 'Signal Hill', priceApprox: 0, note: 'Spiral route, 90 minutes up. Headtorch and a windproof layer.' },
          { name: 'Table Mountain cableway', kind: 'activity', time: '10:00', area: 'Tafelberg Road', priceApprox: 420, note: 'Buy online for the fast lane; the first cars have the clearest air.' },
          { name: 'Kloof Street House', kind: 'dining', time: '13:30', area: 'Gardens', priceApprox: 460, note: 'Long lunch in the garden rooms.' },
          { name: 'Camps Bay sundowners', kind: 'dining', time: '18:30', area: 'Camps Bay', priceApprox: 380, note: 'Anywhere on the strip; the sunset is the reason.' },
        ],
      },
      {
        city: 'Cape Town',
        places: [
          { name: 'Boulders Beach penguin colony', kind: 'activity', time: '08:30', area: 'Simon\'s Town', priceApprox: 190, note: 'Boardwalk entry from the Foxy Beach side, before the tour buses.' },
          { name: 'Cape Point & Cape of Good Hope', kind: 'activity', time: '11:00', area: 'Table Mountain NP', priceApprox: 400, note: 'Funicular or a 20-minute climb to the old lighthouse.' },
          { name: 'The Foodbarn', kind: 'dining', time: '14:00', area: 'Noordhoek', priceApprox: 390, note: 'Farm village stop on the way back over Ou Kaapse Weg.' },
          { name: 'La Colombe', kind: 'dining', time: '19:30', area: 'Constantia', priceApprox: 2450, note: 'Tasting menu on the Silvermist slope. Book well ahead.' },
        ],
      },
      {
        city: 'Stellenbosch',
        places: [
          { name: 'Drive Cape Town to Stellenbosch', kind: 'transit', time: '09:30', area: 'N2 / R310', priceApprox: 260, note: 'Under an hour. Collect the rental in the city the evening before.' },
          { name: 'Delaire Graff Lodges', kind: 'stay', time: '14:00', area: 'Helshoogte Pass', priceApprox: 9500, note: 'Two nights over the valley; the lodge pools face the Simonsberg.' },
          { name: 'Kanonkop tasting', kind: 'activity', time: '11:30', area: 'Stellenbosch', priceApprox: 250, note: 'Pinotage flight; ten minutes from the pass road.' },
          { name: 'Jordan Restaurant', kind: 'dining', time: '13:30', area: 'Stellenbosch Kloof', priceApprox: 780, note: 'Lunch only, over the dam. Reserve the terrace.' },
        ],
      },
      {
        city: 'Cape Town',
        places: [
          { name: 'Babylonstoren garden walk', kind: 'activity', time: '10:00', area: 'Franschhoek', priceApprox: 120, note: 'Eight-acre working garden; the bakery opens at 09:00.' },
          { name: 'Drive to Cape Town International', kind: 'transit', time: '14:00', area: 'R310 / N2', priceApprox: 240, note: '50 minutes without traffic; return the car at the terminal.' },
        ],
      },
    ],
  },
  {
    title: 'Kyoto & Kanazawa by Rail',
    summary: 'Temples and a market in Kyoto, then the Thunderbird north for gardens and raw fish.',
    destinations: ['Kyoto', 'Kanazawa'],
    group: 'F',
    author: 'Aiko Serizawa',
    curatedBy: 'community',
    coverGradient: 'linear-gradient(135deg,#2b3350,#ff849c)',
    currency: 'JPY',
    startDate: '2026-04-04',
    tags: ['Rail', 'Temples', 'Markets', 'Two cities'],
    cloneCount: 87,
    days: [
      {
        city: 'Kyoto',
        places: [
          { name: 'Hotel Kanra Kyoto', kind: 'stay', time: '15:00', area: 'Karasuma', priceApprox: 38000, note: 'Three nights, machiya-style rooms a short walk from Kyoto Station.' },
          { name: 'Giro Giro Hitoshina', kind: 'dining', time: '19:00', area: 'Kiyamachi', priceApprox: 8000, note: 'Casual kaiseki along the canal. Counter seats book out first.' },
        ],
      },
      {
        city: 'Kyoto',
        places: [
          { name: 'Fushimi Inari Taisha', kind: 'activity', time: '07:00', area: 'Fushimi', priceApprox: 0, note: 'Two stops on the Nara line. Walk to the Yotsutsuji viewpoint and turn back.' },
          { name: 'Nishiki Market', kind: 'dining', time: '11:00', area: 'Nakagyo', priceApprox: 2200, note: 'Tamagoyaki, pickles and hot soy milk. Eat standing at the stalls.' },
          { name: 'Kennin-ji', kind: 'activity', time: '14:00', area: 'Gion', priceApprox: 600, note: 'Kyoto\'s oldest Zen temple; the twin-dragon ceiling and the dry garden.' },
          { name: 'Ponto-chō evening walk', kind: 'activity', time: '18:00', area: 'Ponto-chō', priceApprox: 0, note: 'Lantern alley beside the Kamo river, then dinner wherever there is a free counter.' },
        ],
      },
      {
        city: 'Kyoto',
        places: [
          { name: 'Arashiyama bamboo grove', kind: 'activity', time: '08:00', area: 'Arashiyama', priceApprox: 0, note: 'Be there before 08:30 or it is shoulder to shoulder.' },
          { name: 'Tenryu-ji', kind: 'activity', time: '09:30', area: 'Arashiyama', priceApprox: 800, note: 'Sogen pond garden; buy the combined garden and hall ticket.' },
          { name: 'Shoraian', kind: 'dining', time: '12:00', area: 'Arashiyama', priceApprox: 6500, note: 'Tofu kaiseki above the Katsura river. Reservations essential.' },
          { name: 'Okochi Sanso Villa', kind: 'activity', time: '15:00', area: 'Arashiyama', priceApprox: 1000, note: 'Hillside garden with tea included in the ticket.' },
        ],
      },
      {
        city: 'Kanazawa',
        places: [
          { name: 'Thunderbird limited express to Kanazawa', kind: 'transit', time: '09:12', area: 'Kyoto Station', priceApprox: 7000, note: 'Just over two hours, reserved seat. Sit on the right for Lake Biwa.' },
          { name: 'Hyatt Centric Kanazawa', kind: 'stay', time: '13:00', area: 'Kanazawa Station', priceApprox: 32000, note: 'Two nights, two minutes from the station gates.' },
          { name: 'Kenroku-en', kind: 'activity', time: '14:30', area: 'Central Kanazawa', priceApprox: 320, note: 'One of the three great gardens; enter at Katsurazaka gate.' },
          { name: 'Higashi Chaya district', kind: 'activity', time: '16:30', area: 'Higashiyama', priceApprox: 0, note: 'Teahouse streets; Shima and Kaikaro can both be visited inside.' },
        ],
      },
      {
        city: 'Kanazawa',
        places: [
          { name: 'Omicho Market kaisendon', kind: 'dining', time: '08:30', area: 'Omicho', priceApprox: 3000, note: 'Breakfast rice bowl of the morning\'s catch; the upstairs counters are calmer.' },
          { name: '21st Century Museum of Contemporary Art', kind: 'activity', time: '10:30', area: 'Central Kanazawa', priceApprox: 450, note: 'Timed ticket for the Leandro Erlich swimming pool room.' },
          { name: 'Shinkansen back to Tokyo', kind: 'transit', time: '14:00', area: 'Kanazawa Station', priceApprox: 14380, note: 'Hokuriku Shinkansen Kagayaki, 2h30 to Tokyo Station.' },
        ],
      },
    ],
  },
];

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const buildCard = (seed: TripSeed, index: number): ItineraryCardProjection => ({
  id: `mock-${index + 1}`,
  publicSlug: slugify(seed.title),
  title: seed.title,
  summary: seed.summary,
  destinations: seed.destinations,
  dayCount: seed.days.length,
  regionGroup: seed.group,
  coverGradient: seed.coverGradient,
  cloneCount: seed.cloneCount,
  publishedAt: new Date(Date.UTC(2026, index % 12, ((index * 5) % 27) + 1)).toISOString(),
  author: { slug: slugify(seed.author), displayName: seed.author, fictional: true },
  curatedBy: seed.curatedBy,
  moderationStatus: 'ok',
});

export const MOCK_CARDS: ItineraryCardProjection[] = TRIPS.map(buildCard);

const buildDetail = (seed: TripSeed, index: number): PublicItineraryDetail => {
  const card = buildCard(seed, index);
  const days: PublicItineraryDay[] = seed.days.map((day, i) => ({
    day: i + 1,
    date: addDays(seed.startDate, i),
    city: day.city,
    places: day.places,
  }));

  const budget: Record<PublicPlaceKind, number> = { stay: 0, dining: 0, activity: 0, transit: 0 };
  for (const day of days) {
    for (const place of day.places) {
      budget[place.kind] += place.priceApprox ?? 0;
    }
  }

  return {
    ...card,
    suggestedStartDate: seed.startDate,
    suggestedEndDate: addDays(seed.startDate, seed.days.length - 1),
    currency: seed.currency,
    travelStyleTags: seed.tags,
    budget,
    days,
    attribution: `Shared by ${seed.author} (fictional creator). Venues are public references only — prices and availability are searched fresh when you make this trip yours.`,
  };
};

const DETAILS: PublicItineraryDetail[] = TRIPS.map(buildDetail);

export interface DiscoverRow {
  id: string;
  title: string;
  subtitle: string;
  cards: ItineraryCardProjection[];
}

export const DISCOVER_ROWS: DiscoverRow[] = [
  {
    id: 'taai',
    title: 'taai Featured',
    subtitle: 'Built end to end by our planning team',
    cards: MOCK_CARDS.filter(c => c.curatedBy === 'taai'),
  },
  {
    id: 'featured',
    title: 'taai Creators',
    subtitle: 'Public itineraries shared by travelers and creators',
    cards: MOCK_CARDS.filter(c => c.curatedBy === 'community'),
  },

  {
    id: 'trending',
    title: 'Trending',
    subtitle: 'Most added to travelers’ own trips this month',
    // Same six synthetic projections, ranked — no extra payloads are loaded.
    cards: [...MOCK_CARDS].sort((a, b) => b.cloneCount - a.cloneCount).slice(0, 4),
  },
];

export const DISCOVER_PAGE_SIZE = 6;

export const getMockCardBySlug = (slug: string) =>
  MOCK_CARDS.find(c => c.publicSlug === slug) ?? null;

export const getMockItineraryDetail = (slug: string): PublicItineraryDetail | null =>
  DETAILS.find(d => d.publicSlug === slug) ?? null;

export const getMockProfile = (slug: string): PublicProfileProjection | null => {
  const cards = MOCK_CARDS.filter(c => c.author.slug === slug);
  if (cards.length === 0) return null;
  return {
    slug,
    displayName: cards[0].author.displayName,
    shortBio: 'Fictional creator used for taai Discover previews. Public itineraries only.',
    discoverable: true,
    fictional: true,
    itineraries: cards,
  };
};
