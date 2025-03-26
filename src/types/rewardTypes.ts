import { GameType, UserGameStats } from './gameTypes';
import { GameDifficulty } from './gameConfig';

/**
 * Badge interface representing achievements players can earn
 */
export interface Badge {
  id: string;                // Unique identifier
  name: string;              // Display name
  description: string;       // Achievement description
  iconUrl: string;           // URL to badge icon
  requirements: {            
    gameType?: GameType;     // Specific game type required (if any)
    minScore?: number;       // Minimum score required (if any)
    minStreak?: number;      // Minimum streak required (if any)
    maxTime?: number;        // Maximum time required (if any)
    gamesCompleted?: number; // Number of games to complete (if any)
    perfectScore?: boolean;  // Whether a perfect score is required
    consecutiveDays?: number; // Consecutive days of play required (if any)
  };
  createdAt: Date;           // When this badge was added to the system
}

/**
 * UserBadge interface that links users to earned badges
 */
export interface UserBadge {
  id: string;                // Unique identifier
  userId: string;            // User who earned the badge
  badgeId: string;           // Reference to badge
  earnedAt: Date;            // When the badge was earned
  displayed: boolean;        // Whether badge is displayed on profile
}

/**
 * Trophy rarity levels
 */
export type TrophyRarity = 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary';

/**
 * Trophy interface representing special collectible items
 */
export interface Trophy {
  id: string;                // Unique identifier
  name: string;              // Display name
  description: string;       // Trophy description
  imageUrl: string;          // URL to trophy image
  rarity: TrophyRarity;      // Rarity level
  requirements: {            
    gamesCompleted: number;  // Number of games required
    minAccuracy?: number;    // Minimum accuracy required
    specificBadges?: string[]; // Specific badges required
    minCoins?: number;       // Minimum coins required
  };
  createdAt: Date;           // When this trophy was added to the system
}

/**
 * UserTrophy interface that links users to earned trophies
 */
export interface UserTrophy {
  id: string;                // Unique identifier
  userId: string;            // User who earned the trophy
  trophyId: string;          // Reference to trophy
  earnedAt: Date;            // When the trophy was earned
  displayed: boolean;        // Whether trophy is displayed on profile
}

/**
 * Avatar item types
 */
export type AvatarItemType = 'headband' | 'outfit' | 'accessory' | 'background';

/**
 * AvatarItem interface for customizable avatar components
 */
export interface AvatarItem {
  id: string;                // Unique identifier
  name: string;              // Display name
  description: string;       // Item description
  type: AvatarItemType;      // Item type
  imageUrl: string;          // URL to item image
  cost: number;              // Cost in coins
  rarity: TrophyRarity;      // Rarity level
  unlockRequirement?: {      // Special unlock requirements (if not just coins)
    badgeId?: string;        // Badge required to unlock
    trophyId?: string;       // Trophy required to unlock
    gameTypeRequired?: GameType; // Game type requirement
    perfectGames?: number;   // Number of perfect games required
  };
  createdAt: Date;           // When this item was added to the system
}

/**
 * UserAvatarItem interface that links users to owned avatar items
 */
export interface UserAvatarItem {
  id: string;                // Unique identifier
  userId: string;            // User who owns the item
  avatarItemId: string;      // Reference to avatar item
  purchasedAt: Date;         // When the item was purchased/earned
  equipped: boolean;         // Whether item is currently equipped
}

/**
 * Avatar level progression tiers
 */
export type AvatarLevel = 'novice' | 'skilled' | 'expert' | 'master' | 'legendary';

/**
 * EquippedItems interface for tracking which items are currently equipped
 */
export interface EquippedItems {
  headband?: string;         // Item ID of equipped headband
  outfit?: string;           // Item ID of equipped outfit
  accessory?: string;        // Item ID of equipped accessory
  background?: string;       // Item ID of equipped background
}

/**
 * User reward fields to be added to the existing user interface
 */
export interface UserRewardFields {
  avatarLevel: AvatarLevel;  // Current avatar level
  equippedItems: EquippedItems; // Currently equipped avatar items
  badgeCount: number;        // Total number of badges earned
  trophyCount: number;       // Total number of trophies earned
  lastGamePlayed: Date;      // Date of last game played (for streaks)
  consecutiveDays: number;   // Number of consecutive days played
}

/**
 * Achievement result returned when checking for new achievements
 */
export interface AchievementResult {
  newBadges: Badge[];        // Newly earned badges
  newTrophies: Trophy[];     // Newly earned trophies
  levelUp?: AvatarLevel;     // New avatar level if leveled up
  avatarProgress: number;    // Progress toward next level (0-100%)
}

/**
 * Reward notification type for displaying new achievements
 */
export interface RewardNotification {
  id: string;                // Unique identifier
  type: 'badge' | 'trophy' | 'level'; // Type of reward
  itemId: string;            // ID of the badge or trophy
  name: string;              // Name of the reward
  description: string;       // Description of the reward
  imageUrl: string;          // URL to the reward image
  rarity?: TrophyRarity;     // Rarity if applicable
  earnedAt: Date;            // When it was earned
  seen: boolean;             // Whether notification has been seen
}
