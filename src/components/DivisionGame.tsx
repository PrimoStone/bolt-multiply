import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { useUserStats } from '../hooks/useUserStats';
import { StatsModal } from './StatsModal';

const TOTAL_QUESTIONS = 20;

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const DivisionGame: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(new Date());
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showStats, setShowStats] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { stats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'division');

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
      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
        {getInitials(user?.firstName, user?.lastName)}
      </div>
    );
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      generateQuestion();
      setStartTime(new Date());
    }
  }, [user, navigate]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [num1, num2]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const startGame = () => {
    setIsGameStarted(true);
    setStartTime(new Date());
    generateQuestion();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  };

  const generateQuestion = () => {
    let newNum2 = Math.floor(Math.random() * 9) + 1;
    let correctAnswer = Math.floor(Math.random() * 10) + 1;
    let newNum1 = newNum2 * correctAnswer;

    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAnswer();
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleAnswer();
    }
  };

  const handleAnswer = async () => {
    if (!userAnswer) return;

    if (!isGameStarted) {
      setIsGameStarted(true);
    }

    const correctAnswer = num1 / num2;
    const isCorrect = parseFloat(userAnswer) === correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    const historyEntry = `${num1} ÷ ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect, answer was ' + correctAnswer})`;
    setGameHistory([...gameHistory, historyEntry]);
    setUserAnswer('');
    
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);

    if (newQuestionsAnswered >= TOTAL_QUESTIONS) {
      await handleGameEnd();
    } else {
      generateQuestion();
    }
  };

  const handleGameEnd = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const endTime = new Date();
    const gameTime = (endTime.getTime() - startTime.getTime()) / 1000;

    try {
      await saveGameStats(user?.id || '', {
        gameType: 'division',
        score,
        totalQuestions: TOTAL_QUESTIONS,
        timeSpent: gameTime,
        history: gameHistory,
      });

      // Refresh stats after saving
      await refreshStats();
      
      // Show stats modal
      setShowStats(true);

    } catch (error) {
      console.error('Error saving game stats:', error);
    }

    setIsGameStarted(false);
    setTime(0);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 min-w-[500px]">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={() => navigate('/gameselect')}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    Back
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      {renderAvatar()}
                    </button>

                    {isUserMenuOpen && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                      >
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Profile
                        </Link>

                        <button
                          onClick={() => setShowStats(true)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <BarChart2 className="w-4 h-4 mr-2" />
                          Stats
                        </button>

                        <button
                          onClick={() => {
                            setUser(null);
                            navigate('/login');
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex items-center justify-center">
                  {!isGameStarted ? (
                    <div className="text-center">
                      <img 
                        src="/division.png" 
                        alt="Division" 
                        className="w-32 h-32 mx-auto mb-8"
                      />
                      <h1 className="text-4xl font-bold text-gray-800 mb-8">Division Challenge</h1>
                      <button
                        onClick={startGame}
                        className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg
                                 hover:bg-orange-700 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <PlayIcon className="w-6 h-6" />
                        <span>Start Game</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-md">
                      <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center">
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                            <div 
                              className="h-3 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%`,
                                background: 'linear-gradient(to right, violet, indigo, blue, green, yellow, orange, red)',
                                animation: 'shimmer 2s linear infinite'
                              }}
                            />
                          </div>
                          <style>
                            {`
                              @keyframes shimmer {
                                0% {
                                  background-position: 200% center;
                                }
                                100% {
                                  background-position: -200% center;
                                }
                              }
                            `}
                          </style>
                          <div className="mb-8">
                            <img 
                              src="/division.png" 
                              alt="Division" 
                              className="w-32 h-32 mx-auto"
                            />
                          </div>
                          <div className="text-6xl font-bold text-gray-800 mb-4">
                            {num1} ÷ {num2}
                          </div>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                              type="number"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              onKeyPress={handleKeyPress}
                              className="w-full text-center text-4xl font-bold py-3 border-2 border-gray-300 rounded-lg
                                       focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                              placeholder="Your answer"
                              ref={inputRef}
                            />
                            <button
                              type="submit"
                              className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold
                                       hover:bg-orange-700 transition-colors duration-200"
                            >
                              Submit Answer
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
          gameType="division"
        />
      )}
    </div>
  );
};

export default DivisionGame;