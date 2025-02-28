import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext, useUser } from '../contexts/UserContext';
import { Coins, User, LogOut } from 'lucide-react';

/**
 * Navigation component that displays the app header with logo, user avatar, and coin balance
 * Shows user information only when logged in
 */
const Navigation: React.FC = () => {
  const { user, coins } = useUser(); // Get both user and coins from context
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/number-ninjas-logo.png" 
            alt="Number Ninjas" 
            className="h-10 w-auto"
          />
        </Link>

        {/* User section with coins and avatar */}
        {user ? (
          <div className="flex items-center space-x-4">
            {/* Coins display */}
            <div className="flex items-center bg-yellow-100 px-3 py-1.5 rounded-full">
              <Coins className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-bold text-yellow-600">
                {typeof coins === 'number' ? coins.toLocaleString() : '0'}
              </span>
            </div>

            {/* User avatar and dropdown */}
            <div className="relative group">
              <div className="flex items-center space-x-2 cursor-pointer">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={`${user.firstName}'s avatar`}
                    className="w-8 h-8 rounded-full border-2 border-blue-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <span className="font-medium text-gray-700">
                  {user.firstName}
                </span>
              </div>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    // Handle logout
                    localStorage.removeItem('user');
                    navigate('/login');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link 
            to="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
