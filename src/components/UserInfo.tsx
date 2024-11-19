import React, { useEffect, useState } from 'react';
import { getUserStats, getUserAchievements } from '../firebase/utils';
import { UserGameStats, Achievement } from '../types/stats';

interface UserInfoProps {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  onLoadingChange?: (loading: boolean) => void;
}

const UserInfo: React.FC<UserInfoProps> = ({ 
  userId, 
  username, 
  firstName, 
  lastName,
  onLoadingChange 
}) => {
  const [stats, setStats] = useState<UserGameStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchUserData = async () => {
      if (!mounted) return;
      
      setLoading(true);
      onLoadingChange?.(true);
      setError(null);

      try {
        const [userStats, userAchievements] = await Promise.all([
          getUserStats(userId),
          getUserAchievements(userId)
        ]);
        
        if (!mounted) return;
        
        if (!userStats) {
          throw new Error('Failed to load user stats');
        }

        console.log('Fetched user stats:', userStats);
        setStats(userStats);
        setAchievements(userAchievements || []);
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        if (mounted) {
          setLoading(false);
          onLoadingChange?.(false);
        }
      }
    };

    fetchUserData();
    
    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-4 text-gray-600">
        No stats available
      </div>
    );
  }

  const userData = stats.user;
  const gameStats = stats.stats;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      {/* User Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">{userData.firstName} {userData.lastName}</h2>
        <p className="text-gray-600">@{userData.username}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Addition</h3>
          <div className="space-y-2">
            <p>Total Games: {gameStats?.addition?.totalGames || 0}</p>
            <p>Perfect Games: {gameStats?.addition?.perfectGames || 0}</p>
            <p>Best Score: {gameStats?.addition?.bestScore || 0}</p>
            <p>Average Time: {gameStats?.addition?.averageTime?.toFixed(2) || 0}s</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-green-800">Multiplication</h3>
          <div className="space-y-2">
            <p>Total Games: {gameStats?.multiplication?.totalGames || 0}</p>
            <p>Perfect Games: {gameStats?.multiplication?.perfectGames || 0}</p>
            <p>Best Score: {gameStats?.multiplication?.bestScore || 0}</p>
            <p>Average Time: {gameStats?.multiplication?.averageTime?.toFixed(2) || 0}s</p>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-purple-800">Subtraction</h3>
          <div className="space-y-2">
            <p>Total Games: {gameStats?.subtraction?.totalGames || 0}</p>
            <p>Perfect Games: {gameStats?.subtraction?.perfectGames || 0}</p>
            <p>Best Score: {gameStats?.subtraction?.bestScore || 0}</p>
            <p>Average Time: {gameStats?.subtraction?.averageTime?.toFixed(2) || 0}s</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-yellow-800">Division</h3>
          <div className="space-y-2">
            <p>Total Games: {gameStats?.division?.totalGames || 0}</p>
            <p>Perfect Games: {gameStats?.division?.perfectGames || 0}</p>
            <p>Best Score: {gameStats?.division?.bestScore || 0}</p>
            <p>Average Time: {gameStats?.division?.averageTime?.toFixed(2) || 0}s</p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      {gameStats?.overall && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Overall Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Games</p>
              <p className="text-lg font-bold">{gameStats.overall.totalGames}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Perfect Games</p>
              <p className="text-lg font-bold">{gameStats.overall.perfectGames}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Best Score</p>
              <p className="text-lg font-bold">{gameStats.overall.bestScore}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Time</p>
              <p className="text-lg font-bold">{gameStats.overall.averageTime?.toFixed(2) || 0}s</p>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <h4 className="font-semibold text-gray-800">{achievement.title}</h4>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                <p className="text-xs text-gray-500 mt-2">Earned: {new Date(achievement.earnedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfo;
