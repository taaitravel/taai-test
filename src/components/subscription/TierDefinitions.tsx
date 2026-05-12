import { Users, Star, Crown, Building } from 'lucide-react';
import { TierData, type TierType } from '@/lib/stripeConfig';

export const individualTiers: TierData[] = [
  {
    id: 'traveler' as TierType,
    name: 'Traveler',
    monthlyPrice: 0,
    priceText: { monthly: 'Free' },
    description: 'Perfect for casual travelers',
    icon: <Users className="h-6 w-6" />,
    features: [
      '5 credits for AI/API calls',
      'Up to 3 itineraries',
      'Share with up to 10 friends',
      'Basic support',
      'Booking Taxes & Fees: 8.00%'
    ],
    isPaid: false,
    isPopular: false
  },
  {
    id: 'taai_traveler' as TierType,
    name: 'taaiTraveler',
    monthlyPrice: 7.99,
    annualPrice: 79.99,
    priceText: { 
      monthly: '$7.99/mo',
      annual: '$79.99/yr'
    },
    taxNote: '+ applicable taxes',
    description: 'For regular travelers',
    icon: <Star className="h-6 w-6" />,
    features: [
      '50 credits per month',
      'Up to 20 itineraries',
      'Share with up to 20 friends',
      'Priority support',
      'Advanced trip planning',
      'Booking Taxes & Fees: 7.70%'
    ],
    isPaid: true,
    isPopular: true
  },
  {
    id: 'taai_traveler_plus' as TierType,
    name: 'taaiTraveler+',
    monthlyPrice: 19.00,
    annualPrice: 184.99,
    priceText: { 
      monthly: '$19.00/mo',
      annual: '$184.99/yr'
    },
    taxNote: '+ applicable taxes',
    description: 'For travel enthusiasts',
    icon: <Crown className="h-6 w-6" />,
    features: [
      '100 credits per month',
      'Unlimited itineraries',
      'Unlimited friend sharing',
      'Premium support',
      'Advanced analytics',
      'Custom itinerary templates',
      'Booking Taxes & Fees: 7.35%'
    ],
    isPaid: true,
    isPopular: false
  }
];

export const corporateTiers: TierData[] = [
  {
    id: 'corp_taai_traveler_plus' as TierType,
    name: 'Corp. taaiTraveler+',
    monthlyPrice: 99.00,
    annualPrice: 999.00,
    priceText: { 
      monthly: '$99.00/mo',
      annual: '$999.00/yr'
    },
    taxNote: '+ applicable taxes',
    description: 'For business teams',
    icon: <Building className="h-6 w-6" />,
    features: [
      '200 credits per month',
      'Up to 100 itineraries',
      'Share with up to 50 team members',
      'Business support',
      'Team management tools',
      'Expense tracking',
      'Booking Taxes & Fees: 7.35%'
    ],
    isPaid: true,
    isPopular: true
  },
  {
    id: 'taai_enterprise_plus' as TierType,
    name: 'taaiEnterprise+',
    monthlyPrice: 0,
    priceText: { monthly: 'Contact Us' },
    taxNote: 'Custom pricing available',
    description: 'For large enterprises',
    icon: <Crown className="h-6 w-6" />,
    features: [
      'Unlimited credits per month',
      'Unlimited itineraries',
      'Unlimited team sharing',
      'Enterprise support',
      'Custom integrations',
      'Advanced reporting',
      'Dedicated account manager',
      'SLA guarantees',
      'Booking Taxes & Fees: 7.35%'
    ],
    isPaid: false,
    isPopular: false,
    isInquiryOnly: true
  }
];