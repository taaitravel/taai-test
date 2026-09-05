/**
 * Future invitation contract for a CLONED itinerary — definition only.
 * No writes, no notifications, no emails, no database access. The UI stays
 * disabled until this contract is approved and a server function exists.
 */

export const INVITATION_CONTRACT_READY = false;

export type InvitationRole = 'viewer' | 'collaborator';
export type InvitationState = 'proposed' | 'sent' | 'accepted' | 'declined' | 'revoked' | 'expired';

/** What an invitation may ever carry. Anything else is rejected server-side. */
export interface CloneInvitationDraft {
  /** The NEW private clone. Never the source itinerary. */
  itineraryId: string;
  /** Only the clone owner may invite. */
  invitedByIsOwner: true;
  /** Hashed recipient handle/email; raw contact details never reach the client. */
  recipientHandleHash: string;
  role: InvitationRole;
  state: InvitationState;
  expiresAt: string;
}

/** Fields that must never appear in an invitation payload or response. */
export const INVITATION_FORBIDDEN_FIELDS = [
  'source_owner_id',
  'source_collaborators',
  'source_attendees',
  'source_invitations',
  'email',
  'phone',
  'bookings',
  'payments',
  'provider_confirmations',
  'private_notes',
] as const;

/** Authorization rules the future server function must enforce. */
export const INVITATION_AUTHORIZATION_RULES = [
  'Only the authenticated owner of the clone may create, revoke or resend invitations.',
  'Invitations attach to the clone only; source-trip membership is never inherited.',
  'Recipients are matched server-side from a hash; no directory lookup is exposed.',
  'Accepting grants the chosen role on the clone only and never billing or payment access.',
  'Every invitation expires and can be revoked; revocation removes access immediately.',
  'Notifications are queued server-side; the client never triggers email or push directly.',
] as const;
