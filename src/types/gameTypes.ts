import { GameDifficulty } from './gameConfig';

export type GameType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface UserGameStats {
  gameType: GameType;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  history: string[];
  difficulty: GameDifficulty;
}
