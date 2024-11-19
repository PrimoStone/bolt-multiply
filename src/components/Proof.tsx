import React, { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Download } from 'lucide-react';

interface LocationState {
  score: number;
  totalQuestions: number;
  startTime: number;
  endTime: number;
  gameHistory: string[];
  gameType: string;
}

const Proof: React.FC = () => {
  const location = useLocation();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Check both user and location state
    if (!user || !location.state) {
      console.log('No user or state found:', { user, locationState: location.state });
      navigate('/');
      return;
    }
  }, [user, location.state, navigate]);

  // Return early if no user or state
  if (!user || !location.state) {
    return null;
  }

  const { score, totalQuestions, startTime, endTime, gameHistory, gameType } = location.state as LocationState;

  // Validate required data
  if (!score || !totalQuestions || !startTime || !endTime || !gameHistory || !gameType) {
    console.error('Missing required game data:', location.state);
    navigate('/');
    return null;
  }

  console.log('Game stats:', {
    score,
    totalQuestions,
    startTime,
    endTime,
    gameHistory,
    gameType
  });

  const handlePrint = () => {
    window.print();
  };

  const getGameTitle = () => {
    switch (gameType) {
      case 'addition':
        return 'Addition';
      case 'subtraction':
        return 'Subtraction';
      case 'multiplication':
        return 'Multiplication';
      case 'division':
        return 'Division';
      default:
        return 'Math';
    }
  };

  const getGamePath = () => {
    switch (gameType) {
      case 'addition':
        return '/addition';
      case 'subtraction':
        return '/subtraction';
      case 'multiplication':
        return '/game';
      case 'division':
        return '/division';
      default:
        return '/gameselect';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 to-orange-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-gray-600">
                    {new Date(startTime).toLocaleDateString()} {new Date(startTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-semibold text-gray-600">{getGameTitle()} Game</h3>
                <p className="text-3xl font-bold text-blue-600">{score}/{totalQuestions}</p>
                <p className="text-gray-600">
                  Time: {Math.floor((endTime - startTime) / 1000)} seconds
                </p>
              </div>
            </div>

            {/* Game History */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Answer History:</h3>
              <div className="grid gap-2">
                {gameHistory.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg text-sm font-medium ${
                      result.includes('Correct') 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate(getGamePath())}
                className="flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-6 rounded-lg
                         hover:bg-blue-600 transition-colors duration-200 print:hidden"
              >
                <span>Play Again</span>
              </button>
              <button
                onClick={() => navigate('/leaderboard')}
                className="flex items-center justify-center space-x-2 bg-green-500 text-white py-3 px-6 rounded-lg
                         hover:bg-green-600 transition-colors duration-200 print:hidden"
              >
                <span>View Leaderboard</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center space-x-2 bg-purple-500 text-white py-3 px-6 rounded-lg
                         hover:bg-purple-600 transition-colors duration-200 print:hidden"
              >
                <span>Print Results</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proof;