export const ACCOUNT_NOTICE_KEY = 'taai.accountNotice';

export const accountClosureNotice = (decision: 'reject_stale_session' | 'past_grace' | 'closed' | 'deleted'): string => {
  if (decision === 'past_grace') {
    return 'This account is closed and the grace period has ended. It cannot be reopened.';
  }
  if (decision === 'deleted') {
    return 'Your account has been deleted. Shared trips were transferred first. Billing records stay unlinked.';
  }
  if (decision === 'closed') {
    return 'Your account is closed. Sign in again during the grace period to reopen it. The software subscription is cancelled.';
  }
  return 'This account is closed. Sign in again during the grace period to reopen it.';
};
