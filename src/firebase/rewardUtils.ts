import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { 
  Badge, 
  UserBadge, 
  Trophy, 
  UserTrophy, 
  AvatarItem, 
  UserAvatarItem,
  AchievementResult,
  AvatarLevel,
  RewardNotification
} from '../types/rewardTypes';
import { UserGameStats } from '../types/gameTypes';
import { TransactionType } from '../types/coinTypes';

/**
 * Add a new badge to the system (admin function)
 * @param badge Badge data to add
 * @returns The ID of the newly created badge
 */
export const addBadge = async (badge: Omit<Badge, 'id' | 'createdAt'>): Promise<string> => {
  try {
    // Create a new badge document
    const badgeRef = await addDoc(collection(db, 'badges'), {
      ...badge,
      createdAt: new Date()
    });
    
    console.log('Badge created with ID:', badgeRef.id);
    return badgeRef.id;
  } catch (error) {
    console.error('Error adding badge:', error);
    throw error;
  }
};

/**
 * Award a badge to a user if they don't already have it
 * @param userId User ID to award the badge to
 * @param badgeId Badge ID to award
 * @returns Boolean indicating if the badge was newly awarded
 */
export const awardBadge = async (userId: string, badgeId: string): Promise<boolean> => {
  try {
    // Check if user already has this badge
    const existingQuery = query(
      collection(db, 'userBadges'),
      where('userId', '==', userId),
      where('badgeId', '==', badgeId)
    );
    
    const existingBadges = await getDocs(existingQuery);
    
    // If user already has the badge, return false
    if (!existingBadges.empty) {
      console.log('User already has this badge');
      return false;
    }
    
    // Award the badge to the user
    const userBadge: Omit<UserBadge, 'id'> = {
      userId,
      badgeId,
      earnedAt: new Date(),
      displayed: true  // Default to displayed
    };
    
    const newBadgeRef = await addDoc(collection(db, 'userBadges'), userBadge);
    
    // Update user's badge count
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentBadgeCount = userData.badgeCount || 0;
      
      await updateDoc(userRef, {
        badgeCount: currentBadgeCount + 1
      });
      
      // Create a notification for the new badge
      const badgeRef = doc(db, 'badges', badgeId);
      const badgeDoc = await getDoc(badgeRef);
      
      if (badgeDoc.exists()) {
        const badgeData = badgeDoc.data() as Badge;
        
        await addDoc(collection(db, 'rewardNotifications'), {
          type: 'badge',
          itemId: badgeId,
          name: badgeData.name,
          description: badgeData.description,
          imageUrl: badgeData.iconUrl,
          earnedAt: new Date(),
          seen: false,
          userId
        });
      }
    }
    
    console.log('Badge awarded with ID:', newBadgeRef.id);
    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }
};

/**
 * Add a new trophy to the system (admin function)
 * @param trophy Trophy data to add
 * @returns The ID of the newly created trophy
 */
export const addTrophy = async (trophy: Omit<Trophy, 'id' | 'createdAt'>): Promise<string> => {
  try {
    // Create a new trophy document
    const trophyRef = await addDoc(collection(db, 'trophies'), {
      ...trophy,
      createdAt: new Date()
    });
    
    console.log('Trophy created with ID:', trophyRef.id);
    return trophyRef.id;
  } catch (error) {
    console.error('Error adding trophy:', error);
    throw error;
  }
};

/**
 * Award a trophy to a user if they don't already have it
 * @param userId User ID to award the trophy to
 * @param trophyId Trophy ID to award
 * @returns Boolean indicating if the trophy was newly awarded
 */
export const awardTrophy = async (userId: string, trophyId: string): Promise<boolean> => {
  try {
    // Check if user already has this trophy
    const existingQuery = query(
      collection(db, 'userTrophies'),
      where('userId', '==', userId),
      where('trophyId', '==', trophyId)
    );
    
    const existingTrophies = await getDocs(existingQuery);
    
    // If user already has the trophy, return false
    if (!existingTrophies.empty) {
      console.log('User already has this trophy');
      return false;
    }
    
    // Award the trophy to the user
    const userTrophy: Omit<UserTrophy, 'id'> = {
      userId,
      trophyId,
      earnedAt: new Date(),
      displayed: true  // Default to displayed
    };
    
    const newTrophyRef = await addDoc(collection(db, 'userTrophies'), userTrophy);
    
    // Update user's trophy count
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentTrophyCount = userData.trophyCount || 0;
      
      await updateDoc(userRef, {
        trophyCount: currentTrophyCount + 1
      });
      
      // Create a notification for the new trophy
      const trophyRef = doc(db, 'trophies', trophyId);
      const trophyDoc = await getDoc(trophyRef);
      
      if (trophyDoc.exists()) {
        const trophyData = trophyDoc.data() as Trophy;
        
        await addDoc(collection(db, 'rewardNotifications'), {
          type: 'trophy',
          itemId: trophyId,
          name: trophyData.name,
          description: trophyData.description,
          imageUrl: trophyData.imageUrl,
          rarity: trophyData.rarity,
          earnedAt: new Date(),
          seen: false,
          userId
        });
      }
    }
    
    console.log('Trophy awarded with ID:', newTrophyRef.id);
    return true;
  } catch (error) {
    console.error('Error awarding trophy:', error);
    throw error;
  }
};

/**
 * Add a new avatar item to the system (admin function)
 * @param item Avatar item data to add
 * @returns The ID of the newly created avatar item
 */
export const addAvatarItem = async (item: Omit<AvatarItem, 'id' | 'createdAt'>): Promise<string> => {
  try {
    // Create a new avatar item document
    const itemRef = await addDoc(collection(db, 'avatarItems'), {
      ...item,
      createdAt: new Date()
    });
    
    console.log('Avatar item created with ID:', itemRef.id);
    return itemRef.id;
  } catch (error) {
    console.error('Error adding avatar item:', error);
    throw error;
  }
};

/**
 * Purchase an avatar item for a user
 * @param userId User ID purchasing the item
 * @param itemId Avatar item ID to purchase
 * @param updateCoins Function to update the user's coin balance
 * @returns Boolean indicating if the purchase was successful
 */
export const purchaseAvatarItem = async (
  userId: string, 
  itemId: string,
  updateCoins: (amount: number, type: TransactionType, description: string) => Promise<void>
): Promise<boolean> => {
  try {
    // Check if user already has this item
    const existingQuery = query(
      collection(db, 'userAvatarItems'),
      where('userId', '==', userId),
      where('avatarItemId', '==', itemId)
    );
    
    const existingItems = await getDocs(existingQuery);
    
    // If user already has the item, return false
    if (!existingItems.empty) {
      console.log('User already has this avatar item');
      return false;
    }
    
    // Get item details including cost
    const itemRef = doc(db, 'avatarItems', itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      console.error('Avatar item not found');
      return false;
    }
    
    const itemData = itemDoc.data() as AvatarItem;
    
    // Get user data to check coins
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      return false;
    }
    
    const userData = userDoc.data();
    
    // Check if user has enough coins
    if (userData.coins < itemData.cost) {
      console.log('User does not have enough coins');
      return false;
    }
    
    // Deduct coins from user
    await updateCoins(-itemData.cost, 'PURCHASE', `Purchased ${itemData.name}`);
    
    // Add item to user's inventory
    const userItem: Omit<UserAvatarItem, 'id'> = {
      userId,
      avatarItemId: itemId,
      purchasedAt: new Date(),
      equipped: false  // Not equipped by default
    };
    
    await addDoc(collection(db, 'userAvatarItems'), userItem);
    
    console.log('Avatar item purchased successfully');
    return true;
  } catch (error) {
    console.error('Error purchasing avatar item:', error);
    throw error;
  }
};

/**
 * Equip an avatar item for a user
 * @param userId User ID
 * @param itemId Avatar item ID to equip
 * @returns Boolean indicating if the equip was successful
 */
export const equipAvatarItem = async (userId: string, itemId: string): Promise<boolean> => {
  try {
    // Get item details to determine type
    const itemRef = doc(db, 'avatarItems', itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      console.error('Avatar item not found');
      return false;
    }
    
    const itemData = itemDoc.data() as AvatarItem;
    const itemType = itemData.type;
    
    // Check if user owns this item
    const userItemQuery = query(
      collection(db, 'userAvatarItems'),
      where('userId', '==', userId),
      where('avatarItemId', '==', itemId)
    );
    
    const userItems = await getDocs(userItemQuery);
    
    if (userItems.empty) {
      console.error('User does not own this item');
      return false;
    }
    
    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      return false;
    }
    
    const userData = userDoc.data();
    
    // Get current equipped items
    const equippedItems = userData.equippedItems || {};
    
    // Update equipped items
    equippedItems[itemType] = itemId;
    
    // Update user document
    await updateDoc(userRef, {
      equippedItems
    });
    
    // Update item as equipped
    const userItemDoc = userItems.docs[0];
    await updateDoc(userItemDoc.ref, {
      equipped: true
    });
    
    // If there was a previously equipped item of this type, unequip it
    if (userData.equippedItems && userData.equippedItems[itemType] && userData.equippedItems[itemType] !== itemId) {
      const prevItemId = userData.equippedItems[itemType];
      
      const prevItemQuery = query(
        collection(db, 'userAvatarItems'),
        where('userId', '==', userId),
        where('avatarItemId', '==', prevItemId)
      );
      
      const prevItems = await getDocs(prevItemQuery);
      
      if (!prevItems.empty) {
        const prevItemDoc = prevItems.docs[0];
        await updateDoc(prevItemDoc.ref, {
          equipped: false
        });
      }
    }
    
    console.log('Avatar item equipped successfully');
    return true;
  } catch (error) {
    console.error('Error equipping avatar item:', error);
    throw error;
  }
};

/**
 * Update user's avatar level based on badge count
 * @param userId User ID to update
 * @returns New avatar level if changed, undefined otherwise
 */
export const updateAvatarLevel = async (userId: string): Promise<AvatarLevel | undefined> => {
  try {
    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      return undefined;
    }
    
    const userData = userDoc.data();
    const badgeCount = userData.badgeCount || 0;
    const currentLevel = userData.avatarLevel || 'novice';
    
    // Determine new level based on badge count
    let newLevel: AvatarLevel = 'novice';
    
    if (badgeCount >= 10) {
      newLevel = 'legendary';
    } else if (badgeCount >= 7) {
      newLevel = 'master';
    } else if (badgeCount >= 5) {
      newLevel = 'expert';
    } else if (badgeCount >= 3) {
      newLevel = 'skilled';
    }
    
    // If level changed, update user document
    if (newLevel !== currentLevel) {
      await updateDoc(userRef, {
        avatarLevel: newLevel
      });
      
      // Create a notification for level up
      await addDoc(collection(db, 'rewardNotifications'), {
        type: 'level',
        itemId: newLevel,
        name: `${newLevel.charAt(0).toUpperCase() + newLevel.slice(1)} Ninja`,
        description: `You've reached the ${newLevel} level!`,
        imageUrl: `/assets/avatar-levels/${newLevel}.png`,
        earnedAt: new Date(),
        seen: false,
        userId
      });
      
      console.log(`User avatar level updated to ${newLevel}`);
      return newLevel;
    }
    
    return undefined;
  } catch (error) {
    console.error('Error updating avatar level:', error);
    throw error;
  }
};

/**
 * Update user's consecutive days played
 * @param userId User ID to update
 * @returns New number of consecutive days
 */
export const updateConsecutiveDays = async (userId: string): Promise<number> => {
  try {
    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      return 0;
    }
    
    const userData = userDoc.data();
    const lastGamePlayed = userData.lastGamePlayed ? userData.lastGamePlayed.toDate() : null;
    const consecutiveDays = userData.consecutiveDays || 0;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let newConsecutiveDays = consecutiveDays;
    
    if (lastGamePlayed) {
      const lastGameDate = new Date(
        lastGamePlayed.getFullYear(),
        lastGamePlayed.getMonth(),
        lastGamePlayed.getDate()
      );
      
      // Calculate days difference
      const diffTime = today.getTime() - lastGameDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        newConsecutiveDays = consecutiveDays + 1;
      } else if (diffDays === 0) {
        // Same day, no change
        newConsecutiveDays = consecutiveDays;
      } else {
        // Streak broken
        newConsecutiveDays = 1;
      }
    } else {
      // First time playing
      newConsecutiveDays = 1;
    }
    
    // Update user document
    await updateDoc(userRef, {
      lastGamePlayed: now,
      consecutiveDays: newConsecutiveDays
    });
    
    // Check if user has reached 7 consecutive days
    if (newConsecutiveDays === 7) {
      // Find the Perfect Week badge and award it
      const perfectWeekQuery = query(
        collection(db, 'badges'),
        where('requirements.consecutiveDays', '==', 7)
      );
      
      const perfectWeekBadges = await getDocs(perfectWeekQuery);
      
      if (!perfectWeekBadges.empty) {
        const perfectWeekBadge = perfectWeekBadges.docs[0];
        await awardBadge(userId, perfectWeekBadge.id);
      }
    }
    
    console.log(`User consecutive days updated to ${newConsecutiveDays}`);
    return newConsecutiveDays;
  } catch (error) {
    console.error('Error updating consecutive days:', error);
    throw error;
  }
};

/**
 * Check for achievements after a game
 * @param userId User ID
 * @param gameStats Game statistics
 * @returns Achievement results containing new badges, trophies, and level up
 */
export const checkForAchievements = async (
  userId: string,
  gameStats: UserGameStats
): Promise<AchievementResult> => {
  try {
    const newBadges: Badge[] = [];
    const newTrophies: Trophy[] = [];
    
    // Update consecutive days
    await updateConsecutiveDays(userId);
    
    // Get all badges from the system
    const badgesSnapshot = await getDocs(collection(db, 'badges'));
    const badges = badgesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Badge[];
    
    // Check each badge's requirements
    for (const badge of badges) {
      const meetsRequirements = await checkBadgeRequirements(userId, badge, gameStats);
      
      if (meetsRequirements) {
        const awarded = await awardBadge(userId, badge.id);
        
        if (awarded) {
          newBadges.push(badge);
        }
      }
    }
    
    // Get all trophies from the system
    const trophiesSnapshot = await getDocs(collection(db, 'trophies'));
    const trophies = trophiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Trophy[];
    
    // Check each trophy's requirements
    for (const trophy of trophies) {
      const meetsRequirements = await checkTrophyRequirements(userId, trophy);
      
      if (meetsRequirements) {
        const awarded = await awardTrophy(userId, trophy.id);
        
        if (awarded) {
          newTrophies.push(trophy);
        }
      }
    }
    
    // Update avatar level if needed
    const newLevel = await updateAvatarLevel(userId);
    
    // Calculate avatar progress
    const avatarProgress = await calculateAvatarProgress(userId);
    
    return {
      newBadges,
      newTrophies,
      levelUp: newLevel,
      avatarProgress
    };
  } catch (error) {
    console.error('Error checking for achievements:', error);
    throw error;
  }
};

/**
 * Check if a user meets the requirements for a badge
 * @param userId User ID
 * @param badge Badge to check
 * @param gameStats Current game statistics
 * @returns Boolean indicating if requirements are met
 */
const checkBadgeRequirements = async (
  userId: string,
  badge: Badge,
  gameStats: UserGameStats
): Promise<boolean> => {
  const { requirements } = badge;
  
  // Check game type requirement
  if (requirements.gameType && requirements.gameType !== gameStats.gameType) {
    return false;
  }
  
  // Check minimum score requirement
  if (requirements.minScore !== undefined && gameStats.score < requirements.minScore) {
    return false;
  }
  
  // Check perfect score requirement
  if (requirements.perfectScore && gameStats.score !== gameStats.totalQuestions) {
    return false;
  }
  
  // Check minimum streak requirement
  if (requirements.minStreak !== undefined) {
    // Calculate max streak from game history
    const history = gameStats.history;
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (const result of history) {
      if (result.includes('correct')) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    if (maxStreak < requirements.minStreak) {
      return false;
    }
  }
  
  // Check maximum time requirement
  if (requirements.maxTime !== undefined && gameStats.timeSpent > requirements.maxTime) {
    return false;
  }
  
  // Check games completed requirement
  if (requirements.gamesCompleted !== undefined) {
    // Count completed games
    const statsQuery = query(
      collection(db, 'gameStats'),
      where('userId', '==', userId)
    );
    
    const statsSnapshot = await getDocs(statsQuery);
    
    if (statsSnapshot.size < requirements.gamesCompleted) {
      return false;
    }
  }
  
  // If we've made it here, all requirements are met
  return true;
};

/**
 * Check if a user meets the requirements for a trophy
 * @param userId User ID
 * @param trophy Trophy to check
 * @returns Boolean indicating if requirements are met
 */
const checkTrophyRequirements = async (
  userId: string,
  trophy: Trophy
): Promise<boolean> => {
  const { requirements } = trophy;
  
  // Check games completed requirement
  const statsQuery = query(
    collection(db, 'gameStats'),
    where('userId', '==', userId)
  );
  
  const statsSnapshot = await getDocs(statsQuery);
  
  if (statsSnapshot.size < requirements.gamesCompleted) {
    return false;
  }
  
  // Check minimum accuracy requirement
  if (requirements.minAccuracy !== undefined) {
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    statsSnapshot.forEach(doc => {
      const stats = doc.data() as UserGameStats;
      totalCorrect += stats.score;
      totalQuestions += stats.totalQuestions;
    });
    
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    if (accuracy < requirements.minAccuracy) {
      return false;
    }
  }
  
  // Check specific badges requirement
  if (requirements.specificBadges && requirements.specificBadges.length > 0) {
    for (const badgeId of requirements.specificBadges) {
      const badgeQuery = query(
        collection(db, 'userBadges'),
        where('userId', '==', userId),
        where('badgeId', '==', badgeId)
      );
      
      const badgeSnapshot = await getDocs(badgeQuery);
      
      if (badgeSnapshot.empty) {
        return false;
      }
    }
  }
  
  // Check minimum coins requirement
  if (requirements.minCoins !== undefined) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists() || userDoc.data().coins < requirements.minCoins) {
      return false;
    }
  }
  
  // If we've made it here, all requirements are met
  return true;
};

/**
 * Calculate avatar progress percentage toward next level
 * @param userId User ID
 * @returns Progress percentage (0-100)
 */
const calculateAvatarProgress = async (userId: string): Promise<number> => {
  try {
    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return 0;
    }
    
    const userData = userDoc.data();
    const badgeCount = userData.badgeCount || 0;
    const currentLevel = userData.avatarLevel || 'novice';
    
    // Define thresholds for each level
    const thresholds = {
      novice: 3,      // 3 badges to reach skilled
      skilled: 5,     // 5 badges to reach expert
      expert: 7,      // 7 badges to reach master
      master: 10,     // 10 badges to reach legendary
      legendary: 10   // Already at max level
    };
    
    // Calculate progress based on current level and badge count
    let progress = 0;
    
    switch (currentLevel) {
      case 'novice':
        progress = (badgeCount / thresholds.novice) * 100;
        break;
      case 'skilled':
        progress = ((badgeCount - thresholds.novice) / (thresholds.skilled - thresholds.novice)) * 100;
        break;
      case 'expert':
        progress = ((badgeCount - thresholds.skilled) / (thresholds.expert - thresholds.skilled)) * 100;
        break;
      case 'master':
        progress = ((badgeCount - thresholds.expert) / (thresholds.master - thresholds.expert)) * 100;
        break;
      case 'legendary':
        progress = 100; // Already at max level
        break;
    }
    
    // Ensure progress is between 0 and 100
    return Math.min(100, Math.max(0, progress));
  } catch (error) {
    console.error('Error calculating avatar progress:', error);
    return 0;
  }
};

/**
 * Get user's reward notifications
 * @param userId User ID
 * @param limit Maximum number of notifications to return
 * @returns Array of reward notifications
 */
export const getRewardNotifications = async (
  userId: string,
  limit: number = 10
): Promise<RewardNotification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, 'rewardNotifications'),
      where('userId', '==', userId),
      where('seen', '==', false)
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    const notifications = notificationsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RewardNotification[];
    
    // Sort by most recent first and limit
    return notifications
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting reward notifications:', error);
    throw error;
  }
};

/**
 * Mark reward notifications as seen
 * @param notificationIds Array of notification IDs to mark as seen
 */
export const markNotificationsAsSeen = async (notificationIds: string[]): Promise<void> => {
  try {
    const batch = db.batch();
    
    for (const id of notificationIds) {
      const notificationRef = doc(db, 'rewardNotifications', id);
      batch.update(notificationRef, { seen: true });
    }
    
    await batch.commit();
    console.log(`Marked ${notificationIds.length} notifications as seen`);
  } catch (error) {
    console.error('Error marking notifications as seen:', error);
    throw error;
  }
};
