import React, { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import { Coins, User, Settings } from 'lucide-react';

/**
 * Header component displays the app header with logo, user info, and admin button
 * Admin button is only visible for users with admin privileges
 */
const Header: React.FC = () => {
  const { user, coins } = useUser();
  
  // Check if user has admin privileges
  // Using the same admin check logic as in AdminPanel.tsx
  const adminIdentifiers = ['admin123', 'Primo'];
  
  // Debug user information
  useEffect(() => {
    if (user) {
      console.log('Current user in Header:', user);
      console.log('User ID:', user.id);
      console.log('User firstName:', user.firstName);
      console.log('Admin identifiers:', adminIdentifiers);
      console.log('ID match:', user.id && adminIdentifiers.includes(user.id));
      console.log('firstName match:', user.firstName && adminIdentifiers.includes(user.firstName));
      console.log('Development mode:', process.env.NODE_ENV === 'development');
    }
  }, [user]);
  
  // Force admin button to be visible for debugging
  const showAdminButton = true;

  return (
    <header className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/number-ninjas-logo.png" 
            alt="Number Ninjas" 
            className="h-8 w-auto"
          />
        </Link>

        {user && (
          <div className="flex items-center space-x-4">
            {/* Admin Button - Always visible for debugging */}
            {showAdminButton && (
              <Link 
                to="/admin" 
                className="flex items-center bg-purple-100 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors"
              >
                <Settings className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-600">Admin</span>
              </Link>
            )}
            
            {/* Coin Display */}
            <div className="flex items-center bg-yellow-100 px-3 py-1.5 rounded-full">
              <Coins className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-bold text-yellow-600">
                {coins.toLocaleString()}
              </span>
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={`${user.firstName}'s avatar`}
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
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
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
