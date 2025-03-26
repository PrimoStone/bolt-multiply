# Number Ninjas - Reward System Implementation Plan

## Overview
This document outlines the plan for implementing a comprehensive reward system in the NumberNinjas application, including badges for achievements, trophy cards, and avatar development.

## 1. Reward System Components

### 1.1 Badges
Badges are earned by completing specific achievements:

| Badge Name | Description | Requirements | Visual |
|------------|-------------|--------------|--------|
| Math Apprentice | Complete your first game | Complete 1 game of any type | Simple badge icon |
| Multiplication Master | Get 100% on a multiplication game | Perfect score in multiplication | Star with "×" symbol |
| Addition Ace | Get 100% on an addition game | Perfect score in addition | Star with "+" symbol |
| Subtraction Star | Get 100% on a subtraction game | Perfect score in subtraction | Star with "-" symbol |
| Division Dynamo | Get 100% on a division game | Perfect score in division | Star with "÷" symbol |
| Speed Demon | Complete a game in under 45 seconds | Complete any game in <45 seconds | Stopwatch icon |
| Streak Seeker | Achieve a 15-answer streak | 15 correct answers in a row | Flame icon |
| Perfect Week | Play every day for 7 days | Login and play for 7 consecutive days | Calendar icon |
| All-Rounder | Complete all game types | Play each game type at least once | Circular badge |
| Math Ninja | Earn all other badges | Complete all other achievements | Golden ninja star |

### 1.2 Trophy Cards
Trophy cards are special collectible items earned through exceptional performance:

| Trophy Name | Description | Requirements | Rarity | 
|------------|-------------|--------------|--------|
| Bronze Trophy | Basic achievement recognition | Complete 5 games | Common |
| Silver Trophy | Intermediate achievement | Complete 20 games with at least 80% accuracy | Uncommon |
| Gold Trophy | Advanced achievement | Complete 50 games with at least 90% accuracy | Rare |
| Platinum Trophy | Expert achievement | Complete 100 games with at least 95% accuracy | Very Rare |
| Diamond Trophy | Master achievement | Complete all achievements and earn 1000+ coins | Legendary |

### 1.3 Avatar Development
Players can customize and upgrade their avatars as they progress:

1. **Base Avatars**: Initial avatar selection (ninja characters with different colors)
2. **Avatar Items**: Unlockable items that can be purchased with coins:
   - Headbands (different colors and patterns)
   - Outfits (different ninja styles)
   - Accessories (math-themed items like calculators, abacuses)
   - Backgrounds (different environments)
3. **Avatar Progression Tiers**:
   - Novice Ninja (starting level)
   - Skilled Ninja (after earning 5 badges)
   - Expert Ninja (after earning 10 badges)
   - Master Ninja (after earning all badges)
   - Legendary Ninja (special unlock for exceptional performance)

## 2. Database Schema Modifications

### 2.1 New Collections

#### `badges` Collection
```typescript
interface Badge {
  id: string;                // Unique identifier
  name: string;              // Display name
  description: string;       // Achievement description
  iconUrl: string;           // URL to badge icon
  requirements: {            // Requirements to earn badge
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
```

#### `userBadges` Collection
```typescript
interface UserBadge {
  id: string;                // Unique identifier
  userId: string;            // User who earned the badge
  badgeId: string;           // Reference to badge
  earnedAt: Date;            // When the badge was earned
  displayed: boolean;        // Whether badge is displayed on profile
}
```

#### `trophies` Collection
```typescript
interface Trophy {
  id: string;                // Unique identifier
  name: string;              // Display name
  description: string;       // Trophy description
  imageUrl: string;          // URL to trophy image
  rarity: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary'; // Rarity level
  requirements: {            // Requirements to earn trophy
    gamesCompleted: number;  // Number of games required
    minAccuracy?: number;    // Minimum accuracy required
    specificBadges?: string[]; // Specific badges required
    minCoins?: number;       // Minimum coins required
  };
  createdAt: Date;           // When this trophy was added to the system
}
```

#### `userTrophies` Collection
```typescript
interface UserTrophy {
  id: string;                // Unique identifier
  userId: string;            // User who earned the trophy
  trophyId: string;          // Reference to trophy
  earnedAt: Date;            // When the trophy was earned
  displayed: boolean;        // Whether trophy is displayed on profile
}
```

#### `avatarItems` Collection
```typescript
interface AvatarItem {
  id: string;                // Unique identifier
  name: string;              // Display name
  description: string;       // Item description
  type: 'headband' | 'outfit' | 'accessory' | 'background'; // Item type
  imageUrl: string;          // URL to item image
  cost: number;              // Cost in coins
  rarity: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary'; // Rarity level
  unlockRequirement?: {      // Special unlock requirements (if not just coins)
    badgeId?: string;        // Badge required to unlock
    trophyId?: string;       // Trophy required to unlock
    gameTypeRequired?: GameType; // Game type requirement
    perfectGames?: number;   // Number of perfect games required
  };
  createdAt: Date;           // When this item was added to the system
}
```

#### `userAvatarItems` Collection
```typescript
interface UserAvatarItem {
  id: string;                // Unique identifier
  userId: string;            // User who owns the item
  avatarItemId: string;      // Reference to avatar item
  purchasedAt: Date;         // When the item was purchased/earned
  equipped: boolean;         // Whether item is currently equipped
}
```

### 2.2 User Collection Updates
Add the following fields to the existing user collection:

```typescript
interface UserUpdates {
  // Existing fields remain unchanged
  avatarLevel: 'novice' | 'skilled' | 'expert' | 'master' | 'legendary'; // Current avatar level
  equippedItems: {           // Currently equipped avatar items
    headband?: string;       // Item ID of equipped headband
    outfit?: string;         // Item ID of equipped outfit
    accessory?: string;      // Item ID of equipped accessory
    background?: string;     // Item ID of equipped background
  };
  badgeCount: number;        // Total number of badges earned
  trophyCount: number;       // Total number of trophies earned
  lastGamePlayed: Date;      // Date of last game played (for streaks)
  consecutiveDays: number;   // Number of consecutive days played
}
```

## 3. Implementation Plan

### 3.1 Phase 1: Database Setup (Week 1)

1. Create new collections in Firebase Firestore:
   - `badges`
   - `userBadges`
   - `trophies`
   - `userTrophies`
   - `avatarItems`
   - `userAvatarItems`

2. Update the existing user schema with new fields

3. Add initial data to collections:
   - Create basic badges
   - Create trophy entries
   - Create starter avatar items

### 3.2 Phase 2: Core Reward Logic (Week 2)

1. Create TypeScript interfaces for all new types
2. Implement badge achievement tracking system
3. Implement trophy achievement tracking system
4. Create utilities for checking achievement criteria
5. Update game completion logic to check for new achievements

Example achievement check function:
```typescript
async function checkForAchievements(
  userId: string, 
  gameStats: UserGameStats
): Promise<AchievementResult> {
  // Logic to check for badges and trophies based on game stats
  // Return list of newly earned rewards
}
```

### 3.3 Phase 3: UI Components (Week 3)

1. Create new UI components:
   - `BadgeDisplay.tsx` - For showing earned badges
   - `TrophyCase.tsx` - For displaying earned trophies
   - `AvatarCustomizer.tsx` - For customizing avatar
   - `RewardNotification.tsx` - For notifying users of new rewards

2. Update the profile page to show badges and trophies

3. Create a new reward shop UI for purchasing avatar items

### 3.4 Phase 4: Avatar System (Week 4)

1. Implement avatar customization system
2. Create avatar rendering component
3. Implement item purchasing system with coin integration
4. Add avatar progression logic based on badges earned

### 3.5 Phase 5: Integration & Polish (Week 5)

1. Integrate reward notifications into game flow
2. Add animations for earning new rewards
3. Create achievement progress tracking
4. Implement leaderboards for badges and trophies
5. Add tutorial elements for the reward system
6. Test and optimize performance

## 4. Technical Implementation Details

### 4.1 New React Context: `RewardContext`

```typescript
// src/contexts/RewardContext.tsx
interface RewardContextType {
  badges: Badge[];
  userBadges: UserBadge[];
  trophies: Trophy[];
  userTrophies: UserTrophy[];
  avatarItems: AvatarItem[];
  userAvatarItems: UserAvatarItem[];
  checkForAchievements: (gameStats: UserGameStats) => Promise<AchievementResult>;
  purchaseAvatarItem: (itemId: string) => Promise<boolean>;
  equipAvatarItem: (itemId: string, type: string) => Promise<boolean>;
  refreshRewards: () => Promise<void>;
}
```

### 4.2 New Hooks

```typescript
// src/hooks/useUserRewards.ts
function useUserRewards(userId: string) {
  // Logic to fetch and manage user rewards
}

// src/hooks/useAvatarItems.ts
function useAvatarItems(userId: string) {
  // Logic to fetch and manage avatar items
}
```

### 4.3 Database Integration with Firebase

```typescript
// src/firebase/rewardUtils.ts
export async function earnBadge(userId: string, badgeId: string): Promise<void> {
  // Logic to award a badge to a user
}

export async function earnTrophy(userId: string, trophyId: string): Promise<void> {
  // Logic to award a trophy to a user
}

export async function purchaseAvatarItem(userId: string, itemId: string): Promise<boolean> {
  // Logic to handle item purchase with coins
}
```

### 4.4 Game Component Integration

Update the game result handling in all game components:

```typescript
// In game completion handler
const handleGameCompletion = async () => {
  // Existing code for saving game stats
  await saveGameStats(user.id, {
    gameType: 'multiplication',
    score,
    totalQuestions: TOTAL_QUESTIONS,
    timeSpent: time,
    history: gameHistory,
    difficulty
  });

  // New code for checking achievements
  const achievementResults = await checkForAchievements(user.id, {
    gameType: 'multiplication',
    score,
    totalQuestions: TOTAL_QUESTIONS,
    timeSpent: time,
    history: gameHistory,
    difficulty
  });

  // Handle newly earned rewards
  if (achievementResults.newBadges.length > 0 || achievementResults.newTrophies.length > 0) {
    // Show reward notifications
    setRewardNotifications(achievementResults);
  }

  // Navigate to results page
  navigate('/proof', { 
    state: { 
      score, 
      totalQuestions: TOTAL_QUESTIONS, 
      timeSpent: time,
      gameType: 'multiplication',
      newRewards: achievementResults 
    } 
  });
};
```

## 5. UI Design Considerations

### 5.1 Badge Display
- Grid layout of circular badge icons
- Hover for badge details
- Grayed out/locked appearance for unearned badges
- Animation when earning new badges

### 5.2 Trophy Case
- 3D-style shelf display for trophies
- Trophy cards with flip animation to show details
- Sorting options by rarity and acquisition date

### 5.3 Avatar Customization
- Character preview with real-time updates as items are equipped
- Categorized item selection interface
- Clear indication of locked/unlocked items
- Visual progression indicators for avatar levels

### 5.4 Reward Notifications
- Modal pop-up for new achievements
- Confetti animation for rare achievements
- Sound effects based on rarity
- Option to share achievements on social media

## 6. Testing Strategy

1. **Unit Testing**:
   - Test reward calculation logic
   - Test badge requirements validation
   - Test avatar item equipping

2. **Integration Testing**:
   - Test game completion → reward checking flow
   - Test coin transactions for avatar purchases
   - Test user profile updates

3. **User Testing**:
   - Test reward notification clarity
   - Test user motivation and engagement
   - Test avatar customization usability

## 7. Future Enhancements

1. **Social Features**:
   - Friend lists to see others' badges and trophies
   - Gifting avatar items to friends
   - Competition-based special achievements

2. **Advanced Reward Mechanics**:
   - Time-limited special achievements
   - Daily/weekly challenges with unique rewards
   - Achievement chains and combinations

3. **Extended Avatar System**:
   - Animated avatar effects
   - Custom emotes/reactions
   - Avatar mini-games

## 8. Resources and Assets Needed

1. **Graphic Design**:
   - Badge icons (at least 10 unique designs)
   - Trophy designs (5 rarity levels)
   - Avatar items (minimum 20 items across categories)
   - UI elements for the reward interfaces

2. **Sound Design**:
   - Achievement earned sounds
   - Trophy showcase sounds
   - Avatar customization interface sounds

3. **Animation**:
   - Badge earning animation
   - Trophy card flip animation
   - Avatar level-up animation

## 9. Conclusion

This reward system will significantly enhance user engagement and motivation by providing clear goals and visual progress indicators. The multi-tiered approach with badges, trophies, and avatar customization offers both short-term and long-term achievements to keep users engaged and motivated to improve their math skills.

Implementation should proceed in phases as outlined above, with regular testing and user feedback incorporated throughout the development process.
