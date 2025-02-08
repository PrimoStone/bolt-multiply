import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Download, CheckCircle2, XCircle, BarChart2 } from 'lucide-react';
import { useUserStats } from '../hooks/useUserStats';
import StatsModal from './StatsModal';

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
  const [showStats, setShowStats] = useState(false);
  const { stats, loading: statsLoading, error: statsError } = useUserStats(user?.id || '', location.state?.gameType || '');

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
              <div className="grid grid-cols-2 gap-3">
                {gameHistory.map((result, index) => {
                  const isCorrect = typeof result === 'string' 
                    ? result.includes('Correct') || result === 'correct'
                    : result;

                  // Parse equation and answer based on result format
                  let equation = '';
                  let userAnswer = '';
                  let correctAnswer = '';

                  if (typeof result === 'string') {
                    if (result.includes('=')) {
                      // Format: "5 × 3 = 15 (Correct!)" or "5 × 3 = 12 (correct answer was 15)"
                      const [eq, ans] = result.split(' = ');
                      equation = eq;
                      
                      if (isCorrect) {
                        userAnswer = ans.split(' ')[0];
                        correctAnswer = userAnswer;
                      } else {
                        userAnswer = ans.split(' ')[0];
                        correctAnswer = ans.split('was ')[1]?.split(')')[0] || '';
                      }
                    } else {
                      // Simple format: "correct" or "incorrect"
                      equation = `Question ${index + 1}`;
                      userAnswer = isCorrect ? 'Correct' : 'Incorrect';
                      correctAnswer = userAnswer;
                    }
                  }

                  return (
                    <div 
                      key={index}
                      className={`flex items-center p-3 rounded-lg text-sm font-medium ${
                        isCorrect 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-semibold">{equation}</span>
                        {equation !== `Question ${index + 1}` && (
                          <>
                            <span> = </span>
                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {userAnswer}
                            </span>
                            {!isCorrect && correctAnswer && (
                              <span className="text-gray-500 ml-2">
                                (correct: {correctAnswer})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="ml-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
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
                onClick={() => setShowStats(true)}
                className="flex items-center justify-center space-x-2 bg-orange-500 text-white py-3 px-6 rounded-lg
                         hover:bg-orange-600 transition-colors duration-200 print:hidden"
              >
                <BarChart2 className="w-5 h-5" />
                <span>View Stats</span>
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

      {/* Stats Modal */}
      {showStats && (
        <StatsModal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          stats={stats}
          loading={statsLoading}
          error={statsError}
          gameType={gameType}
        />
      )}
    </div>
  );
};

export default Proof;