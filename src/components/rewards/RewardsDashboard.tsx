import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useRewards } from '../../contexts/RewardContext';
import BadgeDisplay from './BadgeDisplay';
import TrophyDisplay from './TrophyDisplay';
import AvatarCustomizer from './AvatarCustomizer';
import RewardNotification from './RewardNotification';
import { RewardNotification as RewardNotificationType } from '../../types/rewardTypes';

/**
 * RewardsDashboard component
 * 
 * A comprehensive dashboard that integrates all reward-related components:
 * - Badges collection
 * - Trophy showcase
 * - Avatar customization
 * - Notifications for new achievements
 */
const RewardsDashboard: React.FC = () => {
  // Get user information from context
  const { user, coins } = useUser();
  
  // Get rewards state and functions from context
  const { 
    badges, 
    userBadges, 
    trophies, 
    userTrophies, 
    avatarItems,
    userAvatarItems,
    checkForPendingNotifications,
    markNotificationAsRead
  } = useRewards();
  
  // Local state for active tab
  const [activeTab, setActiveTab] = useState<'badges' | 'trophies' | 'avatar'>('badges');
  
  // State for notifications
  const [notifications, setNotifications] = useState<RewardNotificationType[]>([]);
  const [currentNotification, setCurrentNotification] = useState<RewardNotificationType | null>(null);
  
  // Check for notifications when component mounts
  useEffect(() => {
    const loadNotifications = async () => {
      if (user?.uid) {
        const pendingNotifications = await checkForPendingNotifications();
        setNotifications(pendingNotifications);
        
        // Show the first notification if available
        if (pendingNotifications.length > 0) {
          setCurrentNotification(pendingNotifications[0]);
        }
      }
    };
    
    loadNotifications();
  }, [user?.uid, checkForPendingNotifications]);
  
  // Handle closing a notification
  const handleNotificationClose = async () => {
    if (currentNotification) {
      // Mark the notification as read in the database
      await markNotificationAsRead(currentNotification.id);
      
      // Remove from current notifications array
      setNotifications(prev => prev.filter(n => n.id !== currentNotification.id));
      
      // Show the next notification if available
      const nextNotifications = notifications.filter(n => n.id !== currentNotification.id);
      if (nextNotifications.length > 0) {
        setCurrentNotification(nextNotifications[0]);
      } else {
        setCurrentNotification(null);
      }
    }
  };
  
  // Handler for badge click
  const handleBadgeClick = (badgeId: string, earned: boolean) => {
    console.log(`Badge clicked: ${badgeId}, earned: ${earned}`);
    // Additional badge click functionality can be added here
  };
  
  // Handler for trophy click
  const handleTrophyClick = (trophyId: string, earned: boolean) => {
    console.log(`Trophy clicked: ${trophyId}, earned: ${earned}`);
    // Additional trophy click functionality can be added here
  };
  
  // Handle avatar item purchase
  const handleAvatarPurchase = (success: boolean) => {
    if (success) {
      // Refresh notifications to check if any new achievement was unlocked
      checkForPendingNotifications().then(pendingNotifications => {
        setNotifications(pendingNotifications);
        if (pendingNotifications.length > 0 && !currentNotification) {
          setCurrentNotification(pendingNotifications[0]);
        }
      });
    }
  };
  
  // If user is not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Please log in to view your rewards</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Rewards Dashboard
      </h1>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-white/20 p-3 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-blue-100">Total Badges</p>
            <p className="text-2xl font-bold">{userBadges.length} / {badges.length}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-white/20 p-3 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-purple-100">Total Trophies</p>
            <p className="text-2xl font-bold">{userTrophies.length} / {trophies.length}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-white/20 p-3 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-yellow-100">Coins Balance</p>
            <p className="text-2xl font-bold">{coins}</p>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('badges')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'badges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Badges
          </button>
          <button
            onClick={() => setActiveTab('trophies')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trophies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Trophies
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'avatar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Avatar Customization
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'badges' && (
          <BadgeDisplay 
            badges={badges} 
            userBadges={userBadges} 
            onBadgeClick={(badge, earned) => handleBadgeClick(badge.id, earned)} 
          />
        )}
        
        {activeTab === 'trophies' && (
          <TrophyDisplay 
            trophies={trophies} 
            userTrophies={userTrophies}
            onTrophyClick={(trophy, earned) => handleTrophyClick(trophy.id, earned)}
          />
        )}
        
        {activeTab === 'avatar' && (
          <AvatarCustomizer 
            avatarItems={avatarItems}
            userAvatarItems={userAvatarItems}
            equippedItems={user.equippedItems || {}}
            avatarLevel={user.avatarLevel || 'novice'}
            coins={coins}
            onPurchase={handleAvatarPurchase}
          />
        )}
      </div>
      
      {/* Active notification */}
      {currentNotification && (
        <RewardNotification
          notification={currentNotification}
          onClose={handleNotificationClose}
          autoClose={false}
        />
      )}
    </div>
  );
};

export default RewardsDashboard;
