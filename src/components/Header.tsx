import React from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import { Coins, User } from 'lucide-react';

const Header: React.FC = () => {
  const { user, coins } = useUser();

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
