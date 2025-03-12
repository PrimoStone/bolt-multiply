export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: Date;
}

// Transaction types for the game
export type TransactionType = 
  | 'REWARD' 
  | 'DAILY_BONUS' 
  | 'STREAK_BONUS' 
  | 'PERFECT_GAME' 
  | 'PURCHASE'
  | 'CORRECT_ANSWER';

export interface DailyBonus {
  lastClaimDate: string; // ISO date string
  currentStreak: number;
}

/**
 * Constants for coin rewards in the game
 * - CORRECT_ANSWER: 1 coin for each correct answer
 * - STREAK_BONUS: 10 coins for 10 correct answers in a row
 * - PERFECT_GAME: 20 coins for completing a game with all correct answers
 */
export const COIN_REWARDS = {
  CORRECT_ANSWER: 1,
  STREAK_BONUS: 10, // 10 coins for 10 correct answers in a row
  PERFECT_GAME: 20
} as const;

export const DAILY_BONUS_RULES = {
  BASE_AMOUNT: 50,
  STREAK_MULTIPLIER: 10,
  MAX_STREAK: 7,
  RESET_HOURS: 48 // Hours before streak resets
} as const;
