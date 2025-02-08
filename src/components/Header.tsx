import React from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';

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

        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center bg-yellow-100 px-3 py-1.5 rounded-full">
              <Coins className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-bold text-yellow-600">
                {coins.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
