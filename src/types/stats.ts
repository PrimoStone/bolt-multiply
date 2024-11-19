export type GameType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface GameStats {
  totalGames: number;
  perfectGames: number;
  bestScore: number;
  bestTime: number | null;
  totalCorrect: number;
  averageTime: number;
  lastPlayed: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
}

export interface UserGameStats {
  user: UserProfile | null;
  stats: {
    addition: GameStats;
    subtraction: GameStats;
    multiplication: GameStats;
    division: GameStats;
    overall: {
      totalGames: number;
      perfectGames: number;
      bestScore: number;
      bestTime: number | null;
      totalCorrect: number;
      averageTime: number;
      lastPlayed: Date;
      favoriteGame: GameType | null;
    };
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  gameType: GameType | 'overall';
  requirement: {
    type: 'perfectGames' | 'totalGames' | 'bestScore' | 'bestTime';
    value: number;
  };
  icon: string;
  unlockedAt?: Date;
}

export interface UserAchievements {
  [key: string]: Achievement[];
}
