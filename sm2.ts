
import { Card, CardState, Rating } from '../types';

/**
 * SM-2 Algorithm Implementation (Anki behavior)
 * Logic:
 * 1 (Again): Fail. Interval reset to 0 or 1. Ease -20%
 * 2 (Hard): Pass but difficult. Interval * 1.2. Ease -15%
 * 3 (Good): Correct. Interval * Ease. 
 * 4 (Easy): Very correct. Interval * Ease * 1.3. Ease +15%
 */

export function calculateNextReview(card: Card, rating: Rating): Partial<Card> {
  let { easeFactor, interval, repetitions, state, lapses } = card;
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (rating === Rating.AGAIN) {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    state = CardState.RELEARNING;
    lapses += 1;
  } else {
    if (rating === Rating.HARD) {
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      interval = Math.max(1, interval * 1.2);
    } else if (rating === Rating.GOOD) {
      // Keep ease factor mostly same
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    } else if (rating === Rating.EASY) {
      easeFactor += 0.15;
      if (repetitions === 0) {
        interval = 4;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
    }
    
    repetitions += 1;
    state = CardState.REVIEW;
  }

  return {
    easeFactor,
    interval,
    repetitions,
    state,
    lapses,
    nextReview: now + (interval * ONE_DAY),
    lastReview: now
  };
}

export function getIntervalString(card: Card, rating: Rating): string {
  const result = calculateNextReview(card, rating);
  const days = result.interval || 1;
  if (days < 1) return '< 1 يوم';
  if (days === 1) return 'يوم واحد';
  if (days <= 10) return `${days} أيام`;
  return `${days} يوم`;
}
