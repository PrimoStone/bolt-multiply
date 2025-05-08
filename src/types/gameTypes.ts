import { GameDifficulty } from './gameConfig';

export type GameType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface UserGameStats {
  gameType: GameType;
  score: number;
  totalQuestions: number;
  // Keep both timeSpent and timeTaken for backward compatibility
  timeTaken: number;
  timeSpent: number; // Added to match usage in Game component
  // Made history optional since we don't always need it
  history: string[]; // Made required to match usage in Game component
  difficulty: GameDifficulty;
  // Added date field for when the game was played
  date: Date;
  // Added targetNumber field for practice mode
  targetNumber?: number;
  // Added accuracy field
  accuracy: number;
}
