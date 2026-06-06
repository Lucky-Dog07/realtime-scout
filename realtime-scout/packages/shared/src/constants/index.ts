export const TASK_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  SUBMITTED: 'submitted',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const MIN_REWARD = 0.01;
export const MAX_DISTANCE_METERS = 1000;
export const AUTO_CONFIRM_HOURS = 24;
export const DEFAULT_SEARCH_RADIUS = 5000;

export const RATING_BASELINE = 5.0;
export const RATING_PRIOR_COUNT = 5;
