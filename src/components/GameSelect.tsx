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

    if (showStats) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStats]);

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
              className="flex items-center space-x-2 px-4 py-2 rounded-lg 
                         bg-yellow-500 text-white hover:bg-yellow-600 
                         transition-colors duration-200 shadow-sm"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>Leaderboard</span>
            </Link>

            {/* User avatar */}
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={() => setShowStats(!showStats)}
              >
                <div className="flex items-center">
                  {renderAvatar()}
                </div>
              </div>

              {/* Stats dropdown */}
              {showStats && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-10">
                  {/* User info (mobile) */}
                  <div className="md:hidden px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{user?.username}
                    </div>
                  </div>

                  {/* Stats header */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-700">Statistics</div>
                  </div>

                  {/* Stats grid */}
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
                  <div className="px-4 pt-2 mt-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 
                               hover:bg-red-50 rounded transition-colors duration-200"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L11.586 7H7a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 11-2 0V7.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      <span>Logout</span>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
            {/* Multiplication Game */}
            <Link 
              to="/game" 
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 
                       overflow-hidden group"
            >
              <div className="p-6 flex flex-col items-center">
                <img 
                  src="/multiply.png" 
                  alt="Multiplication" 
                  className="w-32 h-32 object-contain mb-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <h2 className="text-2xl font-bold text-gray-800 text-center">
                  Multiplication
                </h2>
              </div>
            </Link>

            {/* Division Game */}
            <Link 
              to="/division" 
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 
                       overflow-hidden group"
            >
              <div className="p-6 flex flex-col items-center">
                <img 
                  src="/division1.png" 
                  alt="Division" 
                  className="w-48 h-48 object-contain mb-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <h2 className="text-2xl font-bold text-gray-800 text-center">
                  Division
                </h2>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSelect; 