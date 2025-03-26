import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Badge, 
  UserBadge, 
  Trophy, 
  UserTrophy, 
  AvatarItem, 
  UserAvatarItem,
  AchievementResult,
  RewardNotification
} from '../types/rewardTypes';
import { UserGameStats } from '../types/gameTypes';
import { useUser } from './UserContext';
import { 
  awardBadge, 
  awardTrophy, 
  checkForAchievements, 
  purchaseAvatarItem as purchaseItem,
  equipAvatarItem as equipItem,
  getRewardNotifications,
  markNotificationsAsSeen
} from '../firebase/rewardUtils';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * RewardContext interface defining available context properties and methods
 */
interface RewardContextType {
  badges: Badge[];
  userBadges: UserBadge[];
  trophies: Trophy[];
  userTrophies: UserTrophy[];
  avatarItems: AvatarItem[];
  userAvatarItems: UserAvatarItem[];
  notifications: RewardNotification[];
  loading: boolean;
  error: string | null;
  checkGameAchievements: (gameStats: UserGameStats) => Promise<AchievementResult>;
  purchaseAvatarItem: (itemId: string) => Promise<boolean>;
  equipAvatarItem: (itemId: string, type: string) => Promise<boolean>;
  refreshRewards: () => Promise<void>;
  clearNotifications: () => Promise<void>;
}

// Create the context
export const RewardContext = createContext<RewardContextType>({
  badges: [],
  userBadges: [],
  trophies: [],
  userTrophies: [],
  avatarItems: [],
  userAvatarItems: [],
  notifications: [],
  loading: false,
  error: null,
  checkGameAchievements: async () => ({ newBadges: [], newTrophies: [], avatarProgress: 0 }),
  purchaseAvatarItem: async () => false,
  equipAvatarItem: async () => false,
  refreshRewards: async () => {},
  clearNotifications: async () => {}
});

// Custom hook for using the context
export const useRewards = () => {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardProvider');
  }
  return context;
};

/**
 * RewardProvider component that manages rewards state and provides context
 */
export const RewardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateCoins } = useUser();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [userTrophies, setUserTrophies] = useState<UserTrophy[]>([]);
  const [avatarItems, setAvatarItems] = useState<AvatarItem[]>([]);
  const [userAvatarItems, setUserAvatarItems] = useState<UserAvatarItem[]>([]);
  const [notifications, setNotifications] = useState<RewardNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load all reward data when user changes
  useEffect(() => {
    if (!user) {
      // Reset state when user logs out
      setBadges([]);
      setUserBadges([]);
      setTrophies([]);
      setUserTrophies([]);
      setAvatarItems([]);
      setUserAvatarItems([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Load badges
    const loadBadges = async () => {
      try {
        const badgesQuery = query(collection(db, 'badges'));
        const badgesSnapshot = await getDocs(badgesQuery);
        
        const loadedBadges = badgesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Badge[];
        
        setBadges(loadedBadges);
        
        // Load user badges
        const userBadgesQuery = query(
          collection(db, 'userBadges'),
          where('userId', '==', user.id)
        );
        
        const userBadgesSnapshot = await getDocs(userBadgesQuery);
        
        const loadedUserBadges = userBadgesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserBadge[];
        
        setUserBadges(loadedUserBadges);
      } catch (err) {
        console.error('Error loading badges:', err);
        setError('Failed to load badges');
      }
    };

    // Load trophies
    const loadTrophies = async () => {
      try {
        const trophiesQuery = query(collection(db, 'trophies'));
        const trophiesSnapshot = await getDocs(trophiesQuery);
        
        const loadedTrophies = trophiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trophy[];
        
        setTrophies(loadedTrophies);
        
        // Load user trophies
        const userTrophiesQuery = query(
          collection(db, 'userTrophies'),
          where('userId', '==', user.id)
        );
        
        const userTrophiesSnapshot = await getDocs(userTrophiesQuery);
        
        const loadedUserTrophies = userTrophiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserTrophy[];
        
        setUserTrophies(loadedUserTrophies);
      } catch (err) {
        console.error('Error loading trophies:', err);
        setError('Failed to load trophies');
      }
    };

    // Load avatar items
    const loadAvatarItems = async () => {
      try {
        const avatarItemsQuery = query(collection(db, 'avatarItems'));
        const avatarItemsSnapshot = await getDocs(avatarItemsQuery);
        
        const loadedAvatarItems = avatarItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AvatarItem[];
        
        setAvatarItems(loadedAvatarItems);
        
        // Load user avatar items
        const userAvatarItemsQuery = query(
          collection(db, 'userAvatarItems'),
          where('userId', '==', user.id)
        );
        
        const userAvatarItemsSnapshot = await getDocs(userAvatarItemsQuery);
        
        const loadedUserAvatarItems = userAvatarItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserAvatarItem[];
        
        setUserAvatarItems(loadedUserAvatarItems);
      } catch (err) {
        console.error('Error loading avatar items:', err);
        setError('Failed to load avatar items');
      }
    };

    // Load notifications
    const loadNotifications = async () => {
      try {
        const notifications = await getRewardNotifications(user.id);
        setNotifications(notifications);
      } catch (err) {
        console.error('Error loading notifications:', err);
        setError('Failed to load notifications');
      }
    };

    // Set up real-time listener for notifications
    const unsubscribeNotifications = onSnapshot(
      query(
        collection(db, 'rewardNotifications'),
        where('userId', '==', user.id),
        where('seen', '==', false)
      ),
      (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RewardNotification[];
        
        setNotifications(newNotifications);
      },
      (err) => {
        console.error('Error in notifications listener:', err);
        setError('Failed to listen for notifications');
      }
    );

    // Load all data
    Promise.all([
      loadBadges(),
      loadTrophies(),
      loadAvatarItems(),
      loadNotifications()
    ])
      .then(() => setLoading(false))
      .catch(err => {
        console.error('Error loading reward data:', err);
        setError('Failed to load reward data');
        setLoading(false);
      });

    // Clean up listener on unmount
    return () => {
      unsubscribeNotifications();
    };
  }, [user]);

  /**
   * Check for achievements after a game
   * @param gameStats Game statistics
   * @returns Achievement results
   */
  const checkGameAchievements = async (gameStats: UserGameStats): Promise<AchievementResult> => {
    if (!user) {
      return { newBadges: [], newTrophies: [], avatarProgress: 0 };
    }

    try {
      const result = await checkForAchievements(user.id, gameStats);
      
      // Refresh rewards after new achievements
      if (result.newBadges.length > 0 || result.newTrophies.length > 0) {
        await refreshRewards();
      }
      
      return result;
    } catch (err) {
      console.error('Error checking for achievements:', err);
      setError('Failed to check for achievements');
      return { newBadges: [], newTrophies: [], avatarProgress: 0 };
    }
  };

  /**
   * Purchase an avatar item
   * @param itemId Item ID to purchase
   * @returns Boolean indicating success
   */
  const purchaseAvatarItem = async (itemId: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const result = await purchaseItem(user.id, itemId, updateCoins);
      
      if (result) {
        await refreshRewards();
      }
      
      return result;
    } catch (err) {
      console.error('Error purchasing avatar item:', err);
      setError('Failed to purchase item');
      return false;
    }
  };

  /**
   * Equip an avatar item
   * @param itemId Item ID to equip
   * @param type Item type
   * @returns Boolean indicating success
   */
  const equipAvatarItem = async (itemId: string, type: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const result = await equipItem(user.id, itemId);
      
      if (result) {
        await refreshRewards();
      }
      
      return result;
    } catch (err) {
      console.error('Error equipping avatar item:', err);
      setError('Failed to equip item');
      return false;
    }
  };

  /**
   * Refresh all reward data
   */
  const refreshRewards = async (): Promise<void> => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Reload all data
      // Badges
      const badgesQuery = query(collection(db, 'badges'));
      const badgesSnapshot = await getDocs(badgesQuery);
      
      const loadedBadges = badgesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Badge[];
      
      setBadges(loadedBadges);
      
      // User badges
      const userBadgesQuery = query(
        collection(db, 'userBadges'),
        where('userId', '==', user.id)
      );
      
      const userBadgesSnapshot = await getDocs(userBadgesQuery);
      
      const loadedUserBadges = userBadgesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserBadge[];
      
      setUserBadges(loadedUserBadges);
      
      // Trophies
      const trophiesQuery = query(collection(db, 'trophies'));
      const trophiesSnapshot = await getDocs(trophiesQuery);
      
      const loadedTrophies = trophiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trophy[];
      
      setTrophies(loadedTrophies);
      
      // User trophies
      const userTrophiesQuery = query(
        collection(db, 'userTrophies'),
        where('userId', '==', user.id)
      );
      
      const userTrophiesSnapshot = await getDocs(userTrophiesQuery);
      
      const loadedUserTrophies = userTrophiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserTrophy[];
      
      setUserTrophies(loadedUserTrophies);
      
      // Avatar items
      const avatarItemsQuery = query(collection(db, 'avatarItems'));
      const avatarItemsSnapshot = await getDocs(avatarItemsQuery);
      
      const loadedAvatarItems = avatarItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AvatarItem[];
      
      setAvatarItems(loadedAvatarItems);
      
      // User avatar items
      const userAvatarItemsQuery = query(
        collection(db, 'userAvatarItems'),
        where('userId', '==', user.id)
      );
      
      const userAvatarItemsSnapshot = await getDocs(userAvatarItemsQuery);
      
      const loadedUserAvatarItems = userAvatarItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserAvatarItem[];
      
      setUserAvatarItems(loadedUserAvatarItems);
      
      // Notifications
      const notifications = await getRewardNotifications(user.id);
      setNotifications(notifications);
    } catch (err) {
      console.error('Error refreshing rewards:', err);
      setError('Failed to refresh rewards');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all notifications
   */
  const clearNotifications = async (): Promise<void> => {
    if (!user || notifications.length === 0) {
      return;
    }

    try {
      const notificationIds = notifications.map(notification => notification.id);
      await markNotificationsAsSeen(notificationIds);
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError('Failed to clear notifications');
    }
  };

  const value = {
    badges,
    userBadges,
    trophies,
    userTrophies,
    avatarItems,
    userAvatarItems,
    notifications,
    loading,
    error,
    checkGameAchievements,
    purchaseAvatarItem,
    equipAvatarItem,
    refreshRewards,
    clearNotifications
  };

  return (
    <RewardContext.Provider value={value}>
      {children}
    </RewardContext.Provider>
  );
};

export default RewardProvider;
