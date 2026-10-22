/**
 * TAAI Brand Identity Configuration
 * Based on personal_dna_template.md
 */

export const TAAI_BRAND = {
  name: 'TAAI Travel',
  
  acronym: 'Trip planning, affiliate links, and intelligence',
  
  mission: 'To make trip planning easier with AI recommendations, collaborative itineraries, and one workspace for organizing a trip. Travel is purchased from third-party providers.',
  
  vision: 'To become the default infrastructure for how modern travelers plan, manage, and experience trips—globally, collaboratively, and intelligently.',
  
  usp: 'TAAI unifies inspiration, planning, and coordination into one information tool. Travel purchases are made with third-party providers.',
  
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
 * Compatibility exports. The operating-system manifest is the single source
 * of truth; traveler and internal surfaces must not define local agent roles.
 */
export {
  TAAI_AGENT_MANIFEST as AGENT_ROLES,
  type AgentKey,
  type AgentRole,
} from './operating-system';
