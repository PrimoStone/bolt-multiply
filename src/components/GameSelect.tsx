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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

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
    <div className="min-h-screen bg-gray-100 py-4 sm:py-6 px-4 flex flex-col relative">
      <div className="max-w-7xl mx-auto relative flex flex-col min-h-[calc(100vh-2rem)] sm:min-h-[calc(100vh-3rem)]">
        {/* Logo at top */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-4 sm:mt-6">
          <Link to="/" className="inline-block">
            <img 
              src="/number-ninjas-logo.png" 
              alt="Number Ninjas" 
              className="h-12 sm:h-16 w-auto"
            />
          </Link>
        </div>

        {/* User menu */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              {renderAvatar()}
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
              >
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Profile
                </Link>

                <button
                  onClick={() => setShowStats(true)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Stats
                </button>

                <button
                  onClick={() => {
                    setUser(null);
                    navigate('/login');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center mt-20 sm:mt-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-8 text-center">
            Choose Your Challenge
          </h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
            {/* Addition Card */}
            <Link
              to="/addition"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 
                       overflow-hidden group"
            >
              <div className="p-4 sm:p-6 flex flex-col items-center">
                <img 
                  src="/addition.png" 
                  alt="Addition" 
                  className="w-32 h-32 sm:w-48 sm:h-48 object-contain mb-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">Addition</h2>
                <p className="text-sm sm:text-base text-gray-600 text-center mt-2">Practice adding numbers</p>
              </div>
            </Link>

            {/* Subtraction Card */}
            <Link
              to="/subtraction"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 
                       overflow-hidden group"
            >
              <div className="p-4 sm:p-6 flex flex-col items-center">
                <img 
                  src="/subtraction.png" 
                  alt="Subtraction" 
                  className="w-32 h-32 sm:w-48 sm:h-48 object-contain mb-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">Subtraction</h2>
                <p className="text-sm sm:text-base text-gray-600 text-center mt-2">Practice subtracting numbers</p>
              </div>
            </Link>

            {/* Multiplication Card */}
            <Link
              to="/game"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 
                       overflow-hidden group"
            >
              <div className="p-4 sm:p-6 flex flex-col items-center">
                <img 
                  src="/multiplication.png" 
                  alt="Multiplication" 
                  className="w-32 h-32 sm:w-48 sm:h-48 object-contain mb-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">Multiplication</h2>
                <p className="text-sm sm:text-base text-gray-600 text-center mt-2">Practice multiplying numbers</p>
              </div>
            </Link>

            {/* Division Card */}
            <Link
              to="/division"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 
                       overflow-hidden group"
            >
              <div className="p-4 sm:p-6 flex flex-col items-center">
                <img 
                  src="/division.png" 
                  alt="Division" 
                  className="w-32 h-32 sm:w-48 sm:h-48 object-contain mb-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">Division</h2>
                <p className="text-sm sm:text-base text-gray-600 text-center mt-2">Practice dividing numbers</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Mr. Primo logo at bottom */}
        <div className="flex justify-center py-4">
          <Link to="https://mrprimo.com" target="_blank" rel="noopener noreferrer" className="inline-block">
            <img 
              src="/MrPrimo-LOGO-sm.png" 
              alt="Mr. Primo" 
              className="h-8 sm:h-10 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        {/* Stats Modal */}
        {showStats && (
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          >
            <div className="absolute inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-headline"
                >
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3
                          className="text-lg leading-6 font-medium text-gray-900"
                          id="modal-headline"
                        >
                          Statistics
                        </h3>
                        <div className="mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            {/* Addition Stats */}
                            <div className="bg-blue-50 p-2 rounded">
                              <div className="text-xs text-gray-500">Addition Games</div>
                              <div className="text-lg font-bold text-blue-600">
                                {userStats.stats?.addition?.totalGames || 0}
                              </div>
                            </div>
                            <div className="bg-blue-50 p-2 rounded">
                              <div className="text-xs text-gray-500">Best Time</div>
                              <div className="text-lg font-bold text-blue-600">
                                {userStats.stats?.addition?.bestTime || '-'}s
                              </div>
                            </div>
                            {/* Subtraction Stats */}
                            <div className="bg-green-50 p-2 rounded">
                              <div className="text-xs text-gray-500">Subtraction Games</div>
                              <div className="text-lg font-bold text-green-600">
                                {userStats.stats?.subtraction?.totalGames || 0}
                              </div>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                              <div className="text-xs text-gray-500">Best Time</div>
                              <div className="text-lg font-bold text-green-600">
                                {userStats.stats?.subtraction?.bestTime || '-'}s
                              </div>
                            </div>
                            {/* Multiplication Stats */}
                            <div className="bg-purple-50 p-2 rounded">
                              <div className="text-xs text-gray-500">Multiplication Games</div>
                              <div className="text-lg font-bold text-purple-600">
                                {userStats.stats?.multiplication?.totalGames || 0}
                              </div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded">
                              <div className="text-xs text-gray-500">Best Time</div>
                              <div className="text-lg font-bold text-purple-600">
                                {userStats.stats?.multiplication?.bestTime || '-'}s
                              </div>
                            </div>
                            {/* Division Stats */}
                            <div className="bg-orange-50 p-2 rounded">
                              <div className="text-xs text-gray-500">Division Games</div>
                              <div className="text-lg font-bold text-orange-600">
                                {userStats.stats?.division?.totalGames || 0}
                              </div>
                            </div>
                            <div className="bg-orange-50 p-2 rounded">
                              <div className="text-xs text-gray-500">Best Time</div>
                              <div className="text-lg font-bold text-orange-600">
                                {userStats.stats?.division?.bestTime || '-'}s
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() => setShowStats(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSelect;