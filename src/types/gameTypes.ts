import { GameDifficulty } from './gameConfig';

export type GameType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface UserGameStats {
  gameType: GameType;
  score: number;
  totalQuestions: number;
  // Renamed from timeSpent to timeTaken to match our implementation
  timeTaken: number;
  // Made history optional since we don't always need it
  history?: string[];
  difficulty: GameDifficulty;
  // Added date field for when the game was played
  date: Date;
  // Added targetNumber field for practice mode
  targetNumber?: number;
  // Added accuracy field
  accuracy: number;
}
