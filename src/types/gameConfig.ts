export type GameMode = 'random' | 'fixed';
export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  mode: GameMode;
  fixedNumber?: number;
  difficulty: GameDifficulty;
}

export interface GameState extends GameConfig {
  score: number;
  questionsAnswered: number;
  startTime: number;
  gameType: 'addition' | 'subtraction' | 'multiplication' | 'division';
}
