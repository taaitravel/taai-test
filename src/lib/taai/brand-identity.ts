/**
 * TAAI Brand Identity Configuration
 * Based on personal_dna_template.md
 */

export const TAAI_BRAND = {
  name: 'TAAI Travel',
  
  acronym: 'Travel Agent (TA) Affiliate (A) Intelligence (I)',
  
  mission: 'To make luxury and group travel effortless by combining intelligent AI, seamless booking tools, and collaborative planning into a single, intuitive platform.',
  
  vision: 'To become the default infrastructure for how modern travelers plan, manage, and experience trips—globally, collaboratively, and intelligently.',
  
  usp: 'TAAI unifies inspiration, planning, booking, and coordination into one intelligent system—eliminating fragmentation, guesswork, and friction common in traditional travel platforms.',
  
  coreBenefits: {
    individuals: 'Faster, smarter planning with premium results.',
    groups: 'Clear coordination, shared visibility, and reduced conflict.',
    luxuryTravelers: 'Curated options without time-intensive research.'
  },
  
  values: [
    'Precision',
    'Transparency', 
    'Personalization',
    'Trust',
    'Exploration',
    'Continuous improvement'
  ],
  
  primaryGoals: [
    'AI-powered itinerary creation',
    'Luxury flight, hotel, and experience discovery',
    'Group trip coordination',
    'Shared expense tracking and splitting',
    'Real-time itinerary updates across devices'
  ],
  
  targetAudience: {
    profile: 'Higher-end travelers seeking premium experiences',
    relationship: 'Discerning, capable decision-makers'
  },
  
  kpis: [
    'Monthly active users',
    'Booking conversion rate',
    'Average trip value',
    'Retention and repeat planning behavior'
  ],
  
  infrastructure: {
    backend: ['Supabase (data, auth, real-time sync)'],
    ai: ['OpenAI (planning, recommendations, conversational interface)', 'Lovable AI Gateway'],
    mapping: ['Mapbox (visual itinerary mapping)'],
    frontend: ['Web app (Lovable / Vite / React)', 'Mobile expansion planned']
  },
  
  partners: {
    booking: ['Airline, hotel, and experience booking partners', 'Luxury travel providers and aggregators'],
    api: ['Mapping, payments, and financial tracking APIs'],
    marketing: ['Influencers, travel communities, and brand collaborators']
  }
};

export const getTAAIIntroduction = (): string => {
  return `${TAAI_BRAND.name} - ${TAAI_BRAND.mission}`;
};

export const getTAAIValueProposition = (): string => {
  return TAAI_BRAND.usp;
};

/**
 * Gate 8 agent role model.
 * Miles + Bob are traveler-facing. Ajax + Hermes are internal-only and must
 * never render in traveler UI. AgentChip enforces this at render time.
 */
export type AgentKey = 'miles' | 'bob' | 'ajax' | 'hermes';

export interface AgentRole {
  name: string;
  role: string;
  travelerFacing: boolean;
  summary: string;
}

export const AGENT_ROLES: Record<AgentKey, AgentRole> = {
  miles: {
    name: 'Miles',
    role: 'Travel concierge',
    travelerFacing: true,
    summary: 'Your traveler-facing companion for trip questions, status, and approvals.',
  },
  bob: {
    name: 'Bob',
    role: 'Planning specialist',
    travelerFacing: true,
    summary: 'Builds itineraries day-by-day inside Create Itinerary and planning flows.',
  },
  ajax: {
    name: 'Ajax',
    role: 'Commercial ops (internal)',
    travelerFacing: false,
    summary: 'Internal commercial and sales automation operator. Not shown to travelers.',
  },
  hermes: {
    name: 'Hermes',
    role: 'Runtime (internal)',
    travelerFacing: false,
    summary: 'Invisible orchestration/runtime layer. Never a traveler-facing personality.',
  },
};
