import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useRewards } from '../contexts/RewardContext';
import AvatarSelector from './avatar/AvatarSelector';
import BadgeDisplay from './rewards/BadgeDisplay';
import TrophyDisplay from './rewards/TrophyDisplay';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChevronLeft, ChevronRight, User, Award, Settings } from 'lucide-react';
import { useUserStats } from '../hooks/useUserStats';

// Import types
import { Badge, Trophy } from '../types/rewardTypes';

// Define Avatar type if not available in a separate file
interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  isDefault?: boolean;
}

/**
 * UserCards component 
 * Provides a swipeable card interface for user profile, avatar customization, and rewards
 * @returns {JSX.Element}
 */
const UserCards: React.FC = () => {
  // Get user and rewards data from contexts
  const { user, updateUserData } = useUser();
  const { badges, userBadges, trophies, userTrophies } = useRewards();
  
  // Get user game stats for all game types
  const { stats: multiplicationStats, loading: multiplicationStatsLoading } = useUserStats(user?.id, 'multiplication');
  const { stats: additionStats, loading: additionStatsLoading } = useUserStats(user?.id, 'addition');
  const { stats: subtractionStats, loading: subtractionStatsLoading } = useUserStats(user?.id, 'subtraction');
  const { stats: divisionStats, loading: divisionStatsLoading } = useUserStats(user?.id, 'division');
  
  // Stats tab state
  const [statsTab, setStatsTab] = useState<'multiplication' | 'addition' | 'subtraction' | 'division'>('multiplication');
  
  // Card navigation state
  const [activeCard, setActiveCard] = useState<'profile' | 'avatar' | 'rewards'>('profile');
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0); // 0-100 percentage of swipe progress
  const [isDragging, setIsDragging] = useState(false);
  
  // Avatar selection state
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const mouseStartX = useRef(0);
  const mouseEndX = useRef(0);
  
  // Reward tabs state
  const [rewardTab, setRewardTab] = useState<'badges' | 'trophies'>('badges');
  
  // Load user's current avatar when component mounts
  useEffect(() => {
    if (!user) return;
    
    const fetchUserAvatar = async () => {
      try {
        // If user already has an avatar, set it as selected
        if (user.avatarId) {
          const avatarDoc = await getDoc(doc(db, 'avatars', user.avatarId));
          if (avatarDoc.exists()) {
            setSelectedAvatar({
              id: avatarDoc.id,
              ...avatarDoc.data()
            } as Avatar);
          }
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }
    };

    fetchUserAvatar();
  }, [user]);

  /**
   * Save selected avatar to user profile
   */
  const handleSaveAvatar = async () => {
    if (!user || !selectedAvatar) return;
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Update user document with selected avatar
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        avatarId: selectedAvatar.id,
        avatarUrl: selectedAvatar.imageUrl
      });
      
      // Update local user context
      updateUserData({
        ...user,
        avatarId: selectedAvatar.id,
        avatarUrl: selectedAvatar.imageUrl
      });
      
      setMessage({
        type: 'success',
        text: 'Avatar updated successfully!'
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update avatar. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle avatar selection
   */
  const handleSelectAvatar = (avatar: Avatar) => {
    setSelectedAvatar(avatar);
  };

  /**
   * Touch event handlers for mobile swipe gestures
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setSwipeDirection(null);
    setSwipeProgress(0);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    
    // Calculate swipe direction and progress
    const swipeDistance = touchEndX.current - touchStartX.current;
    const screenWidth = window.innerWidth;
    const maxSwipeDistance = screenWidth * 0.4; // 40% of screen width for full swipe
    
    // Determine swipe direction
    if (swipeDistance > 0) {
      setSwipeDirection('right');
    } else if (swipeDistance < 0) {
      setSwipeDirection('left');
    }
    
    // Calculate progress as percentage (0-100)
    const progress = Math.min(Math.abs(swipeDistance) / maxSwipeDistance * 100, 100);
    setSwipeProgress(progress);
  };
  
  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50; // Minimum swipe distance to trigger a card change
    
    if (swipeDistance > minSwipeDistance) {
      // Swipe right (previous card)
      if (activeCard === 'avatar') setActiveCard('profile');
      else if (activeCard === 'rewards') setActiveCard('avatar');
    } else if (swipeDistance < -minSwipeDistance) {
      // Swipe left (next card)
      if (activeCard === 'profile') setActiveCard('avatar');
      else if (activeCard === 'avatar') setActiveCard('rewards');
    }
    
    // Reset touch positions and swipe state
    touchStartX.current = 0;
    touchEndX.current = 0;
    setSwipeDirection(null);
    setSwipeProgress(0);
  };

  /**
   * Mouse event handlers for desktop swipe gestures
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    mouseStartX.current = e.clientX;
    setSwipeDirection(null);
    setSwipeProgress(0);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    mouseEndX.current = e.clientX;
    
    // Calculate swipe direction and progress
    const swipeDistance = mouseEndX.current - mouseStartX.current;
    const screenWidth = window.innerWidth;
    const maxSwipeDistance = screenWidth * 0.4; // 40% of screen width for full swipe
    
    // Determine swipe direction
    if (swipeDistance > 0) {
      setSwipeDirection('right');
    } else if (swipeDistance < 0) {
      setSwipeDirection('left');
    }
    
    // Calculate progress as percentage (0-100)
    const progress = Math.min(Math.abs(swipeDistance) / maxSwipeDistance * 100, 100);
    setSwipeProgress(progress);
  };
  
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const swipeDistance = mouseEndX.current - mouseStartX.current;
    const minSwipeDistance = 50; // Minimum swipe distance to trigger a card change
    
    if (swipeDistance > minSwipeDistance) {
      // Swipe right (previous card)
      if (activeCard === 'avatar') setActiveCard('profile');
      else if (activeCard === 'rewards') setActiveCard('avatar');
    } else if (swipeDistance < -minSwipeDistance) {
      // Swipe left (next card)
      if (activeCard === 'profile') setActiveCard('avatar');
      else if (activeCard === 'avatar') setActiveCard('rewards');
    }
    
    // Reset mouse positions and swipe state
    setIsDragging(false);
    mouseStartX.current = 0;
    mouseEndX.current = 0;
    setSwipeDirection(null);
    setSwipeProgress(0);
  };
  
  // Add global mouse up handler to handle cases where mouse is released outside the component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setSwipeDirection(null);
        setSwipeProgress(0);
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  /**
   * Toggle card flip state
   */
  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  /**
   * Navigation to previous card
   */
  const goToPrevCard = () => {
    if (activeCard === 'avatar') setActiveCard('profile');
    else if (activeCard === 'rewards') setActiveCard('avatar');
  };

  /**
   * Navigation to next card
   */
  const goToNextCard = () => {
    if (activeCard === 'profile') setActiveCard('avatar');
    else if (activeCard === 'avatar') setActiveCard('rewards');
  };

  // If no user is logged in, show a message
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h1>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Format time in minutes and seconds
  const formatTime = (timeInSeconds: number | null): string => {
    if (timeInSeconds === null) return 'N/A';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render the user cards interface
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md md:max-w-[80vw] mx-auto">
        {/* Card navigation indicators */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={goToPrevCard} 
            disabled={activeCard === 'profile'}
            className="p-2 rounded-full bg-white shadow-md disabled:opacity-50"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveCard('profile')}
              className={`flex flex-col items-center ${activeCard === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <User className="w-5 h-5" />
              <span className="text-xs mt-1">Profile</span>
            </button>
            <button
              onClick={() => setActiveCard('avatar')}
              className={`flex flex-col items-center ${activeCard === 'avatar' ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs mt-1">Avatar</span>
            </button>
            <button
              onClick={() => setActiveCard('rewards')}
              className={`flex flex-col items-center ${activeCard === 'rewards' ? 'text-yellow-600' : 'text-gray-400'}`}
            >
              <Award className="w-5 h-5" />
              <span className="text-xs mt-1">Rewards</span>
            </button>
          </div>
          
          <button 
            onClick={goToNextCard} 
            disabled={activeCard === 'rewards'}
            className="p-2 rounded-full bg-white shadow-md disabled:opacity-50"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
        
        {/* Card container */}
        <div className="relative">
          {/* Swipe indicators */}
          {swipeDirection && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-between px-4">
              {swipeDirection === 'right' && activeCard !== 'profile' && (
                <div 
                  className="bg-white rounded-full p-2 shadow-lg opacity-70"
                  style={{ opacity: swipeProgress / 100 }}
                >
                  <ChevronLeft className="w-8 h-8 text-blue-600" />
                </div>
              )}
              {swipeDirection === 'left' && activeCard !== 'rewards' && (
                <div 
                  className="ml-auto bg-white rounded-full p-2 shadow-lg opacity-70"
                  style={{ opacity: swipeProgress / 100 }}
                >
                  <ChevronRight className="w-8 h-8 text-blue-600" />
                </div>
              )}
            </div>
          )}
          
          {/* Profile Card */}
          {activeCard === 'profile' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl md:mx-auto">
              {/* Card header - swipeable area */}
              <div 
                className="bg-blue-600 text-white p-6 cursor-grab"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => isDragging && handleMouseUp()}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <h2 className="text-2xl font-bold">Your Profile</h2>
              </div>
              
              {!isFlipped ? (
                // Front of card - Profile view based on the image
                <div className="p-4">
                  {/* New layout based on the image - always two columns */}
                  <div className="flex flex-row gap-4">
                    {/* Left column - Avatar */}
                    <div className="flex-shrink-0 flex items-start w-[60%]">
                      {/* Use a normal image with original proportions */}
                      {selectedAvatar?.imageUrl || user.photoURL || user.avatarUrl ? (
                        <img 
                          src={selectedAvatar?.imageUrl || user.photoURL || user.avatarUrl || ''} 
                          alt={`${user.firstName}'s avatar`}
                          className="max-w-full h-auto rounded-md border border-gray-200"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=200`;
                          }}
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center rounded-md">
                          <User className="w-16 h-16 text-indigo-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Right column - User info and stats */}
                    <div className="flex-grow w-[40%] text-right">
                      {/* User name with subtle decoration */}
                      <div className="mb-2 border-b border-gray-200 pb-1">
                        <h3 className="text-base font-bold uppercase tracking-wide">
                          {user.displayName || `${user.firstName} ${user.lastName}`}
                        </h3>
                        <p className="text-gray-500 uppercase text-xs tracking-wider">USER PROFILE</p>
                      </div>
                      
                      {/* Coin balance with improved visual */}
                      <div className="mb-2">
                        <h4 className="text-xs font-bold uppercase text-gray-700 flex items-center justify-end">
                          COIN BALANCE <span className="ml-1">•</span>
                        </h4>
                        <div className="flex items-center justify-end ml-4 mt-1">
                          <span className="text-sm font-bold">{user.coins || 0}</span>
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 ml-2 shadow-sm"></div>
                        </div>
                      </div>
                      
                      {/* Game statistics with compact design */}
                      <div>
                        <h4 className="text-xs font-bold uppercase text-gray-700 flex items-center justify-end">
                          GAME STATS <span className="ml-1">•</span>
                        </h4>
                        <div className="space-y-1 text-xs mt-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Games:</span>
                            <span className="font-bold">{multiplicationStats?.stats?.overall?.totalGames ?? 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Perfect Games:</span>
                            <span className="font-bold">{multiplicationStats?.stats?.overall?.perfectGames ?? 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Best Score:</span>
                            <span className="font-bold">{multiplicationStats?.stats?.overall?.bestScore ?? 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Best Time:</span>
                            <span className="font-bold">
                              {multiplicationStats?.stats?.overall?.bestTime 
                                ? `${Math.floor(multiplicationStats.stats.overall.bestTime / 60)}:${(multiplicationStats.stats.overall.bestTime % 60).toString().padStart(2, '0')}`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Awards section with improved visuals */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <h3 className="text-xs font-bold text-center uppercase tracking-wider mb-2 text-gray-700">ACHIEVEMENTS</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {userBadges.slice(0, 3).map((badge) => (
                        <div key={badge.id} className="flex flex-col items-center">
                          <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md mb-1"></div>
                          <span className="text-center text-xs font-medium uppercase">{badge.id}</span>
                        </div>
                      ))}
                      {/* Fill with placeholders if less than 3 badges */}
                      {Array.from({ length: Math.max(0, 3 - userBadges.length) }).map((_, index) => (
                        <div key={`placeholder-${index}`} className="flex flex-col items-center">
                          <div className="w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-md mb-1"></div>
                          <span className="text-center text-xs font-medium uppercase text-gray-400">LOCKED</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Button for detailed stats with improved design */}
                  <div className="mt-4 flex flex-col space-y-2">
                    <button
                      onClick={handleCardFlip}
                      className="w-full py-1.5 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 transition text-xs font-medium"
                    >
                      View Detailed Stats
                    </button>
                  </div>
                </div>
              ) : (
                // Back of card (Detailed Stats)
                <div className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Statistics</h3>
                    
                    {/* Game type tabs */}
                    <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setStatsTab('multiplication')}
                        className={`flex-1 py-2 px-3 text-lg font-bold rounded-md transition-colors ${
                          statsTab === 'multiplication' 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md' 
                            : 'bg-white text-purple-600 hover:bg-gray-200 border border-purple-200'
                        }`}
                      >
                        <span className="text-2xl">×</span>
                      </button>
                      <button
                        onClick={() => setStatsTab('addition')}
                        className={`flex-1 py-2 px-3 text-lg font-bold rounded-md transition-colors ${
                          statsTab === 'addition' 
                            ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md' 
                            : 'bg-white text-green-600 hover:bg-gray-200 border border-green-200'
                        }`}
                      >
                        <span className="text-2xl">+</span>
                      </button>
                      <button
                        onClick={() => setStatsTab('subtraction')}
                        className={`flex-1 py-2 px-3 text-lg font-bold rounded-md transition-colors ${
                          statsTab === 'subtraction' 
                            ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md' 
                            : 'bg-white text-red-600 hover:bg-gray-200 border border-red-200'
                        }`}
                      >
                        <span className="text-2xl">−</span>
                      </button>
                      <button
                        onClick={() => setStatsTab('division')}
                        className={`flex-1 py-2 px-3 text-lg font-bold rounded-md transition-colors ${
                          statsTab === 'division' 
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-md' 
                            : 'bg-white text-yellow-600 hover:bg-gray-200 border border-yellow-200'
                        }`}
                      >
                        <span className="text-2xl">÷</span>
                      </button>
                    </div>
                    
                    {/* Game type specific stats */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <h4 className="font-bold text-lg mb-3 flex items-center">
                        {statsTab === 'multiplication' && (
                          <>
                            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 text-xl font-bold flex items-center justify-center mr-2">×</span>
                            <span className="text-purple-700">Multiplication</span>
                          </>
                        )}
                        {statsTab === 'addition' && (
                          <>
                            <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 text-xl font-bold flex items-center justify-center mr-2">+</span>
                            <span className="text-green-700">Addition</span>
                          </>
                        )}
                        {statsTab === 'subtraction' && (
                          <>
                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 text-xl font-bold flex items-center justify-center mr-2">−</span>
                            <span className="text-red-700">Subtraction</span>
                          </>
                        )}
                        {statsTab === 'division' && (
                          <>
                            <span className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 text-xl font-bold flex items-center justify-center mr-2">÷</span>
                            <span className="text-yellow-700">Division</span>
                          </>
                        )}
                      </h4>
                      
                      {/* Multiplication Stats */}
                      {statsTab === 'multiplication' && (
                        multiplicationStatsLoading ? (
                          <p className="text-gray-500 text-sm">Loading stats...</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Total Games</p>
                              <p className="font-medium">{multiplicationStats?.stats.multiplication.totalGames || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Perfect Games</p>
                              <p className="font-medium">{multiplicationStats?.stats.multiplication.perfectGames || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Best Score</p>
                              <p className="font-medium">{multiplicationStats?.stats.multiplication.bestScore || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Best Time</p>
                              <p className="font-medium">{formatTime(multiplicationStats?.stats.multiplication.bestTime || null)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Correct</p>
                              <p className="font-medium">{multiplicationStats?.stats.multiplication.totalCorrect || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Avg. Time</p>
                              <p className="font-medium">{formatTime(multiplicationStats?.stats.multiplication.averageTime || null)}</p>
                            </div>
                          </div>
                        )
                      )}
                      
                      {/* Addition Stats */}
                      {statsTab === 'addition' && (
                        additionStatsLoading ? (
                          <p className="text-gray-500 text-sm">Loading stats...</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Total Games</p>
                              <p className="font-medium">{additionStats?.stats.addition.totalGames || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Perfect Games</p>
                              <p className="font-medium">{additionStats?.stats.addition.perfectGames || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Best Score</p>
                              <p className="font-medium">{additionStats?.stats.addition.bestScore || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Best Time</p>
                              <p className="font-medium">{formatTime(additionStats?.stats.addition.bestTime || null)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Correct</p>
                              <p className="font-medium">{additionStats?.stats.addition.totalCorrect || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Avg. Time</p>
                              <p className="font-medium">{formatTime(additionStats?.stats.addition.averageTime || null)}</p>
                            </div>
                          </div>
                        )
                      )}
                      
                      {/* Subtraction Stats */}
                      {statsTab === 'subtraction' && (
                        subtractionStatsLoading ? (
                          <p className="text-gray-500 text-sm">Loading stats...</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Total Games</p>
                              <p className="font-medium">{subtractionStats?.stats.subtraction.totalGames || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Perfect Games</p>
                              <p className="font-medium">{subtractionStats?.stats.subtraction.perfectGames || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Best Score</p>
                              <p className="font-medium">{subtractionStats?.stats.subtraction.bestScore || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Best Time</p>
                              <p className="font-medium">{formatTime(subtractionStats?.stats.subtraction.bestTime || null)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Correct</p>
                              <p className="font-medium">{subtractionStats?.stats.subtraction.totalCorrect || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Avg. Time</p>
                              <p className="font-medium">{formatTime(subtractionStats?.stats.subtraction.averageTime || null)}</p>
                            </div>
                          </div>
                        )
                      )}
                      
                      {/* Division Stats */}
                      {statsTab === 'division' && (
                        divisionStatsLoading ? (
                          <p className="text-gray-500 text-sm">Loading stats...</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Total Games</p>
                              <p className="font-medium">{divisionStats?.stats.division.totalGames || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Perfect Games</p>
                              <p className="font-medium">{divisionStats?.stats.division.perfectGames || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Best Score</p>
                              <p className="font-medium">{divisionStats?.stats.division.bestScore || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Best Time</p>
                              <p className="font-medium">{formatTime(divisionStats?.stats.division.bestTime || null)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Correct</p>
                              <p className="font-medium">{divisionStats?.stats.division.totalCorrect || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Avg. Time</p>
                              <p className="font-medium">{formatTime(divisionStats?.stats.division.averageTime || null)}</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <button 
                      onClick={handleCardFlip}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Back to Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Avatar Customization Card */}
          {activeCard === 'avatar' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl md:mx-auto">
              {/* Card header - swipeable area */}
              <div 
                className="bg-purple-600 text-white p-6 cursor-grab"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => isDragging && handleMouseUp()}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <h2 className="text-2xl font-bold">Avatar Settings</h2>
              </div>
              
              <div className="p-6">
                {/* Current Avatar Preview */}
                <div className="flex flex-col items-center mb-6">
                  {selectedAvatar?.imageUrl || user.avatarUrl || user.photoURL ? (
                    <img
                      src={selectedAvatar?.imageUrl || user.avatarUrl || user.photoURL}
                      alt={`${user.firstName}'s avatar`}
                      className="w-24 h-24 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=200`;
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-purple-100 flex items-center justify-center rounded-lg shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c1.474 0 2.946.644 4.204 1.732M12 10h.01M15.495 14.305A7.035 7.035 0 006 13c-1.1 0-2 .9-2 2a7.002 7.002 0 014 13 9 9 0 01-18 0z" />
                      </svg>
                    </div>
                  )}
                  <h3 className="text-lg font-medium text-gray-800">Current Avatar</h3>
                </div>
                
                {/* Status message */}
                {message && (
                  <div className={`mb-6 p-3 rounded ${
                    message.type === 'success' 
                      ? 'bg-green-100 text-green-700 border border-green-400' 
                      : 'bg-red-100 text-red-700 border border-red-400'
                  }`}>
                    {message.text}
                  </div>
                )}
                
                {/* Avatar selection section */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Choose Your Avatar</h3>
                  <AvatarSelector 
                    selectedAvatarId={selectedAvatar?.id || null}
                    onSelectAvatar={handleSelectAvatar} 
                    showOnlyDefaults={false}
                    className="mb-4"
                  />
                  
                  <button
                    onClick={handleSaveAvatar}
                    disabled={loading || !selectedAvatar || selectedAvatar.id === user.avatarId}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Avatar'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Rewards Card */}
          {activeCard === 'rewards' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl md:mx-auto">
              {/* Card header - swipeable area */}
              <div 
                className="bg-yellow-600 text-white p-6 cursor-grab"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => isDragging && handleMouseUp()}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <h2 className="text-2xl font-bold">Your Rewards</h2>
                
                {/* Rewards Tab Navigation */}
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setRewardTab('badges')}
                    className={`px-4 py-1 rounded-full text-sm font-medium ${
                      rewardTab === 'badges' 
                        ? 'bg-white text-yellow-600' 
                        : 'bg-yellow-700 text-white'
                    }`}
                  >
                    Badges
                  </button>
                  <button
                    onClick={() => setRewardTab('trophies')}
                    className={`px-4 py-1 rounded-full text-sm font-medium ${
                      rewardTab === 'trophies' 
                        ? 'bg-white text-yellow-600' 
                        : 'bg-yellow-700 text-white'
                    }`}
                  >
                    Trophies
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {/* Rewards Content */}
                {rewardTab === 'badges' ? (
                  <BadgeDisplay 
                    badges={badges} 
                    userBadges={userBadges} 
                    onBadgeClick={(badge: Badge, earned: boolean) => console.log(`Badge clicked: ${badge.id}, earned: ${earned}`)} 
                  />
                ) : (
                  <TrophyDisplay 
                    trophies={trophies} 
                    userTrophies={userTrophies} 
                    onTrophyClick={(trophy: Trophy, earned: boolean) => console.log(`Trophy clicked: ${trophy.id}, earned: ${earned}`)} 
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCards;
