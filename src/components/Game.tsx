import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { convertToBase64 } from '../firebase/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserStats } from '../hooks/useUserStats';
import StatsModal from '../components/StatsModal'; // Import StatsModal component

const TOTAL_QUESTIONS = 20;

interface GameProps {
  // twoje istniejące props
}

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const Game: React.FC = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const [time, setTime] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { stats: userStats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'multiplication');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStats, setShowStats] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('User data:', {
      fullUser: user,
      photoURL: user?.photoURL || null,
      firstName: user?.firstName,
      lastName: user?.lastName
    });
  }, []);

  console.log('User photo data:', {
    hasPhoto: !!user?.photoURL,
    photoURL: user?.photoURL,
    photoURLType: typeof user?.photoURL,
    photoURLLength: user?.photoURL?.length
  });

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
    if (isGameStarted) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isGameStarted]);

  useEffect(() => {
    console.log('Current user stats:', userStats);
  }, [userStats]);

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

  const generateQuestion = () => {
    setNum1(Math.floor(Math.random() * 11) + 2);
    setNum2(Math.floor(Math.random() * 11) + 2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctAnswer = num1 * num2;
    const isCorrect = parseInt(userAnswer) === correctAnswer;
    
    // Update game history
    const historyEntry = `${num1} × ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect, answer was ' + correctAnswer})`;
    setGameHistory([...gameHistory, historyEntry]);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setQuestionsAnswered(questionsAnswered + 1);

    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const finalScore = score + (isCorrect ? 1 : 0);
      const finalHistory = [...gameHistory, historyEntry];

      if (user) {
        try {
          await saveGameStats(
            user.id,
            {
              gameType: 'multiplication',
              score: finalScore,
              totalQuestions: TOTAL_QUESTIONS,
              timeSpent: timeSpent,
              history: finalHistory
            }
          );
          console.log('Game stats saved successfully');
          
          await refreshStats();
          console.log('Stats refreshed');

          // Navigate with state after successful save
          navigate('/proof', { 
            state: { 
              score: finalScore, 
              totalQuestions: TOTAL_QUESTIONS,
              startTime: startTime.getTime(),
              endTime: endTime.getTime(),
              gameHistory: finalHistory,
              gameType: 'multiplication'
            },
            replace: true  // Use replace to prevent back navigation
          });
        } catch (error) {
          console.error('Error saving game stats:', error);
        }
      }
    } else {
      generateQuestion();
      setUserAnswer('');
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startGame = () => {
    setIsGameStarted(true);
    setTime(0);
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      // Kompresja i konwersja do base64
      const base64String = await convertToBase64(file);
      
      // Aktualizacja w Firebase
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        photoURL: base64String
      });

      // Aktualizacja w UserContext
      setUser({
        ...user,
        photoURL: base64String
      });

    } catch (error) {
      console.error('Błąd podczas aktualizacji zdjęcia:', error);
      alert('Nie udało się zaktualizować zdjęcia profilowego');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
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

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-6 px-4 flex flex-col justify-center relative">
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

      <div className="relative py-3 w-full max-w-[95%] sm:max-w-xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-3 py-6 sm:px-4 sm:py-10 bg-white shadow-lg sm:rounded-3xl md:p-20 w-full min-w-[280px] sm:min-w-[500px]">
          <div className="w-full max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-4 sm:py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center mb-4 sm:mb-8">
                  <button
                    onClick={() => navigate('/gameselect')}
                    className="flex items-center text-gray-600 hover:text-gray-800 text-sm sm:text-base"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
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
                    <div className="text-center w-full">
                      <img 
                        src="/multiplication.png" 
                        alt="Multiplication" 
                        className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-8"
                      />
                      <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-8">Multiplication Challenge</h1>
                      <button
                        onClick={startGame}
                        className="bg-purple-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg
                                 hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2 mx-auto text-sm sm:text-base"
                      >
                        <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>Start Game</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-md">
                      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
                        <div className="text-center">
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-4 sm:mb-6 overflow-hidden">
                            <div 
                              className="h-2 sm:h-3 rounded-full transition-all duration-300"
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
                          <div className="mb-4 sm:mb-8">
                            <img 
                              src="/multiplication.png" 
                              alt="Multiplication" 
                              className="w-24 h-24 sm:w-32 sm:h-32 mx-auto"
                            />
                          </div>
                          <div className="text-4xl sm:text-6xl font-bold text-gray-800 mb-4">
                            {num1} × {num2}
                          </div>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                              type="number"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              className="w-full text-center text-3xl sm:text-4xl font-bold py-2 sm:py-3 border-2 border-gray-300 rounded-lg
                                       focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                              placeholder="Your answer"
                              ref={inputRef}
                            />
                            <button
                              type="submit"
                              className="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base
                                       hover:bg-purple-700 transition-colors duration-200"
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

      {/* Mr. Primo logo at bottom */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-4 sm:mb-6">
        <Link to="https://mrprimo.com" target="_blank" rel="noopener noreferrer" className="inline-block">
          <img 
            src="/MrPrimo-LOGO-sm.png" 
            alt="Mr. Primo" 
            className="h-8 sm:h-10 w-auto hover:opacity-80 transition-opacity"
          />
        </Link>
        <div className="text-center text-xs sm:text-sm text-gray-500 mt-1">
          Powered by Mr. Primo
        </div>
      </div>

      {/* Stats Modal */}
      {showStats && (
        <StatsModal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          stats={userStats}
          loading={statsLoading}
          error={statsError}
          gameType="multiplication"
        />
      )}

      {/* Hidden file input for profile picture */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handlePhotoChange}
      />
    </div>
  );
};

export default Game;