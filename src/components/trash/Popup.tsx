import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useUserStats } from '../hooks/useUserStats';
import { UserContext } from '../contexts/UserContext';

interface PopupProps {
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const Popup: React.FC<PopupProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, setUser } = React.useContext(UserContext);
  const { userStats } = useUserStats(user?.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Game Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Addition Stats */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-blue-800 font-medium mb-2">Addition</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Games Played</p>
                <p className="text-lg font-medium">{userStats?.stats?.addition?.totalGames || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Score</p>
                <p className="text-lg font-medium">{userStats?.stats?.addition?.bestScore || 0}/20</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Time</p>
                <p className="text-lg font-medium">
                  {userStats?.stats?.addition?.bestTime ? formatTime(userStats.stats.addition.bestTime) : '--:--'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Perfect Games</p>
                <p className="text-lg font-medium">{userStats?.stats?.addition?.perfectGames || 0}</p>
              </div>
            </div>
          </div>

          {/* Subtraction Stats */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-green-800 font-medium mb-2">Subtraction</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Games Played</p>
                <p className="text-lg font-medium">{userStats?.stats?.subtraction?.totalGames || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Score</p>
                <p className="text-lg font-medium">{userStats?.stats?.subtraction?.bestScore || 0}/20</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Time</p>
                <p className="text-lg font-medium">
                  {userStats?.stats?.subtraction?.bestTime ? formatTime(userStats.stats.subtraction.bestTime) : '--:--'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Perfect Games</p>
                <p className="text-lg font-medium">{userStats?.stats?.subtraction?.perfectGames || 0}</p>
              </div>
            </div>
          </div>

          {/* Multiplication Stats */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-purple-800 font-medium mb-2">Multiplication</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Games Played</p>
                <p className="text-lg font-medium">{userStats?.stats?.multiplication?.totalGames || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Score</p>
                <p className="text-lg font-medium">{userStats?.stats?.multiplication?.bestScore || 0}/20</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Time</p>
                <p className="text-lg font-medium">
                  {userStats?.stats?.multiplication?.bestTime ? formatTime(userStats.stats.multiplication.bestTime) : '--:--'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Perfect Games</p>
                <p className="text-lg font-medium">{userStats?.stats?.multiplication?.perfectGames || 0}</p>
              </div>
            </div>
          </div>

          {/* Division Stats */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-yellow-800 font-medium mb-2">Division</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Games Played</p>
                <p className="text-lg font-medium">{userStats?.stats?.division?.totalGames || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Score</p>
                <p className="text-lg font-medium">{userStats?.stats?.division?.bestScore || 0}/20</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Time</p>
                <p className="text-lg font-medium">
                  {userStats?.stats?.division?.bestTime ? formatTime(userStats.stats.division.bestTime) : '--:--'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Perfect Games</p>
                <p className="text-lg font-medium">{userStats?.stats?.division?.perfectGames || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              try {
                setUser(null);
                navigate('/');
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
