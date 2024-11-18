import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { convertToBase64, saveGameStats, getUserStats } from '../firebase/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const TOTAL_QUESTIONS = 20;

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const Subtraction: React.FC = () => {
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userStats, setUserStats] = useState<any>(null);

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

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      generateQuestion();
      setStartTime(new Date());
      loadUserStats();
    }
  }, [user, navigate]);

  const loadUserStats = async () => {
    if (user) {
      try {
        const stats = await getUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    }
  };

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
    let newNum1 = Math.floor(Math.random() * 20) + 1;
    let newNum2 = Math.floor(Math.random() * newNum1) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctAnswer = num1 - num2;
    const isCorrect = parseInt(userAnswer) === correctAnswer;
    
    const historyEntry = `${num1} - ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect'})`;
    setGameHistory([...gameHistory, historyEntry]);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);

    if (newQuestionsAnswered === TOTAL_QUESTIONS) {
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const finalScore = score + (isCorrect ? 1 : 0);

      // Save game stats before navigating
      if (user) {
        await saveGameStats(
          user.id,
          user.username,
          user.firstName,
          user.lastName,
          finalScore,
          duration,
          finalScore === TOTAL_QUESTIONS,
          'subtraction'
        );
      }

      navigate('/proof', { 
        state: { 
          score: finalScore, 
          total: TOTAL_QUESTIONS,
          time: duration,
          history: [...gameHistory, historyEntry],
          gameType: 'subtraction'
        } 
      });
      return;
    }

    generateQuestion();
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        if (user) {
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, {
            photoURL: base64
          });
          setUser({ ...user, photoURL: base64 });
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-gradient-to-b from-orange-100 to-orange-200">
      <div className="max-w-3xl mx-auto px-4 h-full flex flex-col">
        {/* Header */}
        <div className="h-[80px] py-4 flex items-center justify-between relative">
          {/* Left side counters */}
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center bg-white/50 px-3 py-1 rounded-lg shadow-sm">
              <span className="text-gray-700 font-medium">Time:</span>
              <span className="ml-2 font-bold text-blue-600">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="flex items-center bg-white/50 px-3 py-1 rounded-lg shadow-sm">
              <span className="text-gray-700 font-medium">Score:</span>
              <span className="ml-2 font-bold text-green-600">{score}/{questionsAnswered}</span>
            </div>
          </div>

          {/* Centered logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link to="/">
              <img 
                src="/number-ninjas-logo.png"
                alt="Number Ninjas"
                className="w-24 h-auto"
              />
            </Link>
          </div>

          {/* User menu on right */}
          <div className="flex flex-col items-end relative">
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="flex items-center">
                  {renderAvatar()}
                </div>
              </div>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-10">
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="Change profile picture"
                      >
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover 
                                     group-hover:opacity-80 transition-all duration-200"
                          />
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center 
                                     text-white font-bold group-hover:bg-blue-600 transition-all duration-200"
                          >
                            {getInitials(user?.firstName, user?.lastName)}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center rounded-full 
                                      bg-black/0 group-hover:bg-black/20 transition-all duration-200">
                          <Users className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                        <div className="text-sm text-gray-500">{user?.username}</div>
                      </div>
                    </div>
                  </div>
                  
                  {userStats && (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-medium text-gray-700">Statistics</div>
                        <Link 
                          to="/profile"
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span>View Full Stats</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 ml-1" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </Link>
                      </div>
                      {/* Addition Stats */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Addition</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-gray-500">Games</div>
                            <div className="text-lg font-bold text-blue-600">
                              {userStats.stats.addition.totalGames || 0}
                            </div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-xs text-gray-500">Best Time</div>
                            <div className="text-lg font-bold text-orange-600">
                              {userStats.stats.addition.bestTime ? `${userStats.stats.addition.bestTime}s` : '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subtraction Stats */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Subtraction</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-gray-500">Games</div>
                            <div className="text-lg font-bold text-blue-600">
                              {userStats.stats.subtraction.totalGames || 0}
                            </div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-xs text-gray-500">Best Time</div>
                            <div className="text-lg font-bold text-orange-600">
                              {userStats.stats.subtraction.bestTime ? `${userStats.stats.subtraction.bestTime}s` : '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Multiplication Stats */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Multiplication</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-gray-500">Games</div>
                            <div className="text-lg font-bold text-blue-600">
                              {userStats.stats.multiplication.totalGames || 0}
                            </div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-xs text-gray-500">Best Time</div>
                            <div className="text-lg font-bold text-orange-600">
                              {userStats.stats.multiplication.bestTime ? `${userStats.stats.multiplication.bestTime}s` : '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Division Stats */}
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Division</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-gray-500">Games</div>
                            <div className="text-lg font-bold text-blue-600">
                              {userStats.stats.division.totalGames || 0}
                            </div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-xs text-gray-500">Best Time</div>
                            <div className="text-lg font-bold text-orange-600">
                              {userStats.stats.division.bestTime ? `${userStats.stats.division.bestTime}s` : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors duration-200"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main game content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {!isGameStarted ? (
            <div className="text-center">
              <img 
                src="/subtraction.png" 
                alt="Subtraction" 
                className="w-48 h-48 mx-auto mb-6"
              />
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Subtraction Challenge</h1>
              <button
                onClick={startGame}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg
                         hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
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
                      src="/subtraction.png" 
                      alt="Subtraction" 
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <div className="text-6xl font-bold text-gray-800 mb-4">
                    {num1} - {num2}
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="w-full text-center text-4xl font-bold py-3 border-2 border-gray-300 rounded-lg
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      placeholder="Your answer"
                      ref={inputRef}
                    />
                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold
                               hover:bg-green-700 transition-colors duration-200"
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
  );
};

export default Subtraction;
