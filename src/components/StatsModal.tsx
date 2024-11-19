import React from 'react';
import { X } from 'lucide-react';
import { GameType, UserGameStats } from '../types/stats';

interface StatsModalProps {
  onClose: () => void;
  isOpen: boolean;
  gameType: GameType;
  stats: UserGameStats | null;
  loading: boolean;
  error: Error | null;
}

const gameTypeColors = {
  addition: 'from-blue-500 to-blue-600',
  subtraction: 'from-green-500 to-green-600',
  multiplication: 'from-purple-500 to-purple-600',
  division: 'from-orange-500 to-orange-600'
};

const gameTypeNames = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division'
};

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const StatsModal: React.FC<StatsModalProps> = ({
  onClose,
  isOpen,
  gameType,
  stats,
  loading,
  error
}) => {
  if (!isOpen) return null;

  console.log('Stats in modal:', stats);
  const userData = stats?.user;
  console.log('User data in modal:', userData);

  const gameStats = stats?.stats?.[gameType];
  const overallStats = stats?.stats?.overall;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Stats</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

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
                {userData?.photoURL ? (
                  <img 
                    src={userData.photoURL} 
                    alt={userData.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-500">
                      {getInitials(userData?.firstName, userData?.lastName)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {userData?.username || 'User'}
                </h3>
                <p className="text-sm text-gray-600">
                  {userData?.firstName} {userData?.lastName}
                </p>
              </div>
            </div>

            {/* Game Stats */}
            <div className="space-y-6">
              {/* Game Type Stats */}
              <div>
                <h4 className="text-lg font-semibold mb-3">{gameTypeNames[gameType]} Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Total Games</div>
                    <div className="text-xl font-bold text-gray-800">{gameStats?.totalGames || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Perfect Games</div>
                    <div className="text-xl font-bold text-gray-800">{gameStats?.perfectGames || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Best Score</div>
                    <div className="text-xl font-bold text-gray-800">{gameStats?.bestScore || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Best Time</div>
                    <div className="text-xl font-bold text-gray-800">{gameStats?.bestTime ? `${gameStats.bestTime}s` : '-'}</div>
                  </div>
                </div>
              </div>

              {/* Overall Stats */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Overall Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Total Games</div>
                    <div className="text-xl font-bold text-gray-800">{overallStats?.totalGames || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Perfect Games</div>
                    <div className="text-xl font-bold text-gray-800">{overallStats?.perfectGames || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Best Score</div>
                    <div className="text-xl font-bold text-gray-800">{overallStats?.bestScore || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Favorite Game</div>
                    <div className="text-xl font-bold text-gray-800">
                      {overallStats?.favoriteGame ? gameTypeNames[overallStats.favoriteGame] : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsModal;
