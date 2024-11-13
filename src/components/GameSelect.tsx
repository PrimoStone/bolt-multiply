import React, { useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

const GameSelect: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-gradient-to-b from-orange-100 to-orange-200">
      <div className="max-w-3xl mx-auto px-4 h-full flex flex-col">
        {/* Header */}
        <div className="h-[80px] py-4 flex items-center justify-between">
          <img 
            src="/number-ninjas-logo.png"
            alt="Number Ninjas"
            className="w-24 h-auto"
          />
          <div className="flex items-center space-x-4">
            <Link to="/progress" className="text-gray-700 hover:text-gray-900">Postępy</Link>
            <Link to="/leaderboard" className="text-gray-700 hover:text-gray-900">Ranking</Link>
          </div>
        </div>

        {/* Game Selection */}
        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Wybierz grę</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-2xl w-full">
            {/* Multiplication Game */}
            <button
              onClick={() => navigate('/game')}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
            >
              <img src="/multiply.png" alt="Multiplication" className="w-16 h-16 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Mnożenie</h2>
              <p className="text-gray-600 text-center">Trenuj tabliczkę mnożenia</p>
            </button>

            {/* Division Game */}
            <button
              onClick={() => navigate('/division')}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
            >
              <img src="/division1.png" alt="Division" className="w-16 h-16 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Dzielenie</h2>
              <p className="text-gray-600 text-center">Ćwicz dzielenie liczb</p>
            </button>

            {/* Addition Game (Coming Soon) */}
            <div
              className="bg-white/50 rounded-lg shadow-lg p-6 cursor-not-allowed flex flex-col items-center"
            >
              <img src="/add.png" alt="Addition" className="w-16 h-16 mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-gray-400 mb-2">Dodawanie</h2>
              <p className="text-gray-400 text-center">Już wkrótce!</p>
              <span className="mt-2 text-sm text-gray-400">Coming Soon</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="mt-8 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
                     transition-colors duration-300 flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3zm11 4.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L11.586 7H7a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V7.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Wyloguj się
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSelect; 