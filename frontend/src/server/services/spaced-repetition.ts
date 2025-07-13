/**
 * Spaced repetition utility functions
 * Based on the SuperMemo SM-2 algorithm with modifications
 */

export type PerformanceRating = 'failed' | 'hard' | 'medium' | 'easy';

export interface SpacedRepetitionResult {
  nextInterval: number;
  nextReviewAt: Date;
  easeFactor?: number;
}

// Default spaced repetition intervals in days
export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30, 60, 120];

/**
 * Calculate the next review date based on performance
 * Uses a simplified SM-2 algorithm
 */
export function calculateNextReview(
  currentInterval: number,
  performance: PerformanceRating,
  easeFactor: number = 2.5
): SpacedRepetitionResult {
  let nextInterval: number;
  let newEaseFactor = easeFactor;

  switch (performance) {
    case 'failed':
      // Reset to first interval
      nextInterval = 1;
      newEaseFactor = Math.max(1.3, easeFactor - 0.2);
      break;

    case 'hard':
      // Slightly increase or maintain interval
      nextInterval = Math.max(1, Math.floor(currentInterval * 1.2));
      newEaseFactor = Math.max(1.3, easeFactor - 0.15);
      break;

    case 'medium':
      // Standard increase
      nextInterval = Math.floor(currentInterval * newEaseFactor);
      break;

    case 'easy':
      // Larger increase
      nextInterval = Math.floor(currentInterval * newEaseFactor * 1.3);
      newEaseFactor = easeFactor + 0.1;
      break;

    default:
      nextInterval = currentInterval;
  }

  // Cap the interval at maximum
  nextInterval = Math.min(120, nextInterval);

  // Ensure minimum interval
  nextInterval = Math.max(1, nextInterval);

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);

  return {
    nextInterval,
    nextReviewAt,
    easeFactor: newEaseFactor,
  };
}

/**
 * Get the optimal review schedule for a new item
 */
export function getInitialReviewSchedule(): SpacedRepetitionResult {
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + 1); // Start with 1 day

  return {
    nextInterval: 1,
    nextReviewAt,
    easeFactor: 2.5,
  };
}

/**
 * Calculate retention rate based on review history
 */
export function calculateRetentionRate(
  totalReviews: number,
  successfulReviews: number
): number {
  if (totalReviews === 0) return 0;
  return Math.round((successfulReviews / totalReviews) * 100);
}

/**
 * Determine if a card is due for review
 */
export function isDueForReview(nextReviewAt: Date | null): boolean {
  if (!nextReviewAt) return true;
  return new Date() >= nextReviewAt;
}

/**
 * Calculate study load based on due cards
 */
export function calculateStudyLoad(dueCards: number): 'light' | 'moderate' | 'heavy' {
  if (dueCards <= 10) return 'light';
  if (dueCards <= 30) return 'moderate';
  return 'heavy';
}

/**
 * Get recommended daily study target
 */
export function getRecommendedDailyTarget(
  totalCards: number,
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): number {
  const baseTarget = {
    beginner: 10,
    intermediate: 20,
    advanced: 30,
  }[userLevel];

  // Adjust based on total cards
  const scaleFactor = Math.min(1.5, totalCards / 100);
  return Math.floor(baseTarget * scaleFactor);
}

/**
 * Format time until next review
 */
export function formatTimeUntilReview(nextReviewAt: Date): string {
  const now = new Date();
  const diffMs = nextReviewAt.getTime() - now.getTime();

  if (diffMs <= 0) return 'Due now';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  }
}

/**
 * Generate study session based on available time and due cards
 */
export function generateStudySession(
  dueCards: Array<{ id: string; priority?: number }>,
  availableTimeMinutes: number = 30
): Array<{ id: string; priority?: number }> {
  // Estimate 2-3 minutes per card
  const estimatedCardsPerSession = Math.floor(availableTimeMinutes / 2.5);

  // Sort by priority if available, otherwise randomize
  const sortedCards = dueCards.sort((a, b) => {
    if (a.priority && b.priority) {
      return b.priority - a.priority;
    }
    return Math.random() - 0.5;
  });

  return sortedCards.slice(0, estimatedCardsPerSession);
}
