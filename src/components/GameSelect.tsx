import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useUserStats } from '../hooks/useUserStats';

const GameSelect: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const { userStats } = useUserStats(user?.id);
  const [showStats, setShowStats] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStats(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (firstName: string = '', lastName: string = '') => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderAvatar = () => {
    if (user?.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
        {getInitials(user?.firstName, user?.lastName)}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 to-orange-200">
      <div className="max-w-3xl mx-auto px-4 h-full flex flex-col">
        {/* Header */}
        <div className="h-[80px] flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <img 
              src="/number-ninjas-logo.png"
              alt="Number Ninjas"
              className="w-24 h-auto"
            />
          </div>

          {/* Right side header content */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/leaderboard" 
              className="text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Leaderboard
            </Link>

            {/* User stats and avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={() => setShowStats(!showStats)}
              >
                <div className="flex items-center space-x-2">
                  {renderAvatar()}
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{user?.username}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats dropdown */}
              {showStats && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-10">
                  {/* User info w dropdownie (widoczne na mobile) */}
                  <div className="md:hidden px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{user?.username}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-700">Statistics</div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Total Games</div>
                      <div className="text-lg font-bold text-blue-600">{userStats.totalGames}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Perfect Games</div>
                      <div className="text-lg font-bold text-green-600">{userStats.perfectGames}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Best Score</div>
                      <div className="text-lg font-bold text-purple-600">{userStats.bestScore}/20</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Best Time</div>
                      <div className="text-lg font-bold text-orange-600">
                        {userStats.bestTime ? `${userStats.bestTime}s` : '-'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Logout button */}
                  <div className="px-4 pt-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Selection */}
        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Choose a Game</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-2xl w-full">
            {/* Multiplication Game */}
            <button
              onClick={() => navigate('/game')}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
            >
              <img src="/multiply.png" alt="Multiplication" className="w-16 h-16 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Multiplication</h2>
              <p className="text-gray-600 text-center">Practice multiplication tables</p>
            </button>

            {/* Division Game */}
            <button
              onClick={() => navigate('/division')}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
            >
              <img src="/division1.png" alt="Division" className="w-16 h-16 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Division</h2>
              <p className="text-gray-600 text-center">Practice division</p>
            </button>

            {/* Addition Game (Coming Soon) */}
            <div
              className="bg-white/50 rounded-lg shadow-lg p-6 cursor-not-allowed flex flex-col items-center"
            >
              <img src="/add.png" alt="Addition" className="w-16 h-16 mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-gray-400 mb-2">Addition</h2>
              <p className="text-gray-400 text-center">Coming Soon!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSelect; 