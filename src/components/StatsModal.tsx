import React from 'react';
import { X } from 'lucide-react';
import { GameStats, GameType, UserGameStats } from '../types/stats';
import { UserContext } from '../contexts/UserContext';
import { useContext } from 'react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserGameStats | null;
  loading: boolean;
  error: Error | null;
  gameType: GameType;
}

const gameTypeColors = {
  addition: 'from-green-400 to-green-600',
  subtraction: 'from-blue-400 to-blue-600',
  multiplication: 'from-purple-400 to-purple-600',
  division: 'from-orange-400 to-orange-600'
} as const;

const gameTypeNames = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division'
} as const;

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  loading,
  error,
  gameType
}) => {
  if (!isOpen) return null;

  const { user } = useContext(UserContext);

  const formatTime = (seconds: number | null | undefined) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className={`bg-gradient-to-r ${gameTypeColors[gameType]} p-6 rounded-t-lg`}>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {gameTypeNames[gameType]} Stats
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading stats...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading stats. Please try again.</p>
            </div>
          ) : !stats ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No stats available yet. Play some games to see your progress!</p>
            </div>
          ) : (
            <>
              {/* User Profile */}
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
                <div className="relative">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.username}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {user?.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {user?.username || 'User'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Addition Stats */}
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Addition Games</div>
                  <div className="text-lg font-bold text-blue-600">
                    {stats.stats?.addition?.totalGames || 0}
                  </div>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Best Time</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatTime(stats.stats?.addition?.bestTime)}s
                  </div>
                </div>
                {/* Subtraction Stats */}
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Subtraction Games</div>
                  <div className="text-lg font-bold text-green-600">
                    {stats.stats?.subtraction?.totalGames || 0}
                  </div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Best Time</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatTime(stats.stats?.subtraction?.bestTime)}s
                  </div>
                </div>
                {/* Multiplication Stats */}
                <div className="bg-purple-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Multiplication Games</div>
                  <div className="text-lg font-bold text-purple-600">
                    {stats.stats?.multiplication?.totalGames || 0}
                  </div>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Best Time</div>
                  <div className="text-lg font-bold text-purple-600">
                    {formatTime(stats.stats?.multiplication?.bestTime)}s
                  </div>
                </div>
                {/* Division Stats */}
                <div className="bg-orange-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Division Games</div>
                  <div className="text-lg font-bold text-orange-600">
                    {stats.stats?.division?.totalGames || 0}
                  </div>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Best Time</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formatTime(stats.stats?.division?.bestTime)}s
                  </div>
                </div>
              </div>

              {/* Overall Stats */}
              {stats.stats?.overall && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Overall Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Total Games</div>
                      <div className="text-xl font-bold text-gray-800">
                        {stats.stats.overall.totalGames || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Perfect Games</div>
                      <div className="text-xl font-bold text-gray-800">
                        {stats.stats.overall.perfectGames || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
