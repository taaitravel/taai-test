export type BookingActorType =
  | 'traveler'
  | 'travel_agent'
  | 'company_traveler'
  | 'company_admin'
  | 'support';

export type PayerType = 'traveler' | 'agent' | 'company' | 'other';

interface BookingContextInput {
  userId: string;
  userType?: string | null;
  companyName?: string | null;
  payerType?: PayerType;
}

const actorTypeFor = (userType?: string | null): BookingActorType => {
  const normalized = String(userType || '').toLowerCase();
  if (normalized.includes('agent') || normalized.includes('advisor')) return 'travel_agent';
  if (normalized.includes('admin')) return 'company_admin';
  if (normalized.includes('corporate') || normalized.includes('company')) return 'company_traveler';
  if (normalized.includes('support')) return 'support';
  return 'traveler';
};

export const buildBookingContext = ({
  userId,
  userType,
  companyName,
  payerType = 'traveler',
}: BookingContextInput) => {
  const bookingActorType = actorTypeFor(userType);
  const organizationType = bookingActorType === 'travel_agent'
    ? 'agency'
    : bookingActorType.startsWith('company_') ? 'company' : null;

  return {
    contract_version: '1.0',
    booking_actor: {
      type: bookingActorType,
      user_id: userId,
    },
    traveler: {
      relationship: 'self',
      profile_id: null,
    },
    payer: {
      type: payerType,
    },
    organization: organizationType ? {
      type: organizationType,
      id: null,
      name: companyName || null,
    } : null,
    agency_reference: null,
    cost_center: null,
    servicing_owner_user_id: userId,
  };
};

export const emptyEarningsContract = () => ({
  commission_status: 'not_available',
  commission_tier: null,
  commission_basis: null,
  commission_rate: null,
  estimated_commission: null,
  settlement_currency: null,
});
