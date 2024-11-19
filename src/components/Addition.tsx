import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { convertToBase64 } from '../utils/imageUtils';
import { saveGameStats, getUserStats } from '../firebase/utils';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const TOTAL_QUESTIONS = 20;

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const Addition: React.FC = () => {
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
      // Load user stats
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
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctAnswer = num1 + num2;
    const isCorrect = parseInt(userAnswer) === correctAnswer;
    
    const historyEntry = `${num1} + ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect'})`;
    setGameHistory([...gameHistory, historyEntry]);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setQuestionsAnswered(questionsAnswered + 1);

    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const finalScore = score + (isCorrect ? 1 : 0);

      // Save game stats before navigating
      if (user) {
        await saveGameStats(
          user.id,
          user.username,
          user.firstName,
          user.lastName,
          finalScore,
          timeSpent,
          finalScore === TOTAL_QUESTIONS,
          'addition'
        );
      }

      navigate('/proof', { 
        state: { 
          score: finalScore, 
          totalQuestions: TOTAL_QUESTIONS,
          startTime: startTime.getTime(),
          endTime: endTime.getTime(),
          gameHistory: [...gameHistory, historyEntry],
          gameType: 'addition'
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

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

          {/* Right side user menu */}
          <div className="flex items-center space-x-6">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2"
              >
                {renderAvatar()}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-10">
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="relative group">
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            {getInitials(user?.firstName, user?.lastName)}
                          </div>
                        )}
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
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Addition Stats */}
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Addition Games</div>
                          <div className="text-lg font-bold text-blue-600">
                            {userStats.stats?.addition?.totalGames || 0}
                          </div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Best Time</div>
                          <div className="text-lg font-bold text-blue-600">
                            {userStats.stats?.addition?.bestTime || '-'}s
                          </div>
                        </div>
                        {/* Subtraction Stats */}
                        <div className="bg-green-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Subtraction Games</div>
                          <div className="text-lg font-bold text-green-600">
                            {userStats.stats?.subtraction?.totalGames || 0}
                          </div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Best Time</div>
                          <div className="text-lg font-bold text-green-600">
                            {userStats.stats?.subtraction?.bestTime || '-'}s
                          </div>
                        </div>
                        {/* Multiplication Stats */}
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Multiplication Games</div>
                          <div className="text-lg font-bold text-purple-600">
                            {userStats.stats?.multiplication?.totalGames || 0}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Best Time</div>
                          <div className="text-lg font-bold text-purple-600">
                            {userStats.stats?.multiplication?.bestTime || '-'}s
                          </div>
                        </div>
                        {/* Division Stats */}
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Division Games</div>
                          <div className="text-lg font-bold text-orange-600">
                            {userStats.stats?.division?.totalGames || 0}
                          </div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Best Time</div>
                          <div className="text-lg font-bold text-orange-600">
                            {userStats.stats?.division?.bestTime || '-'}s
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center">
          {!isGameStarted ? (
            <div className="text-center">
              <img 
                src="/addition.png" 
                alt="Addition" 
                className="w-32 h-32 mx-auto mb-8"
              />
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Addition Challenge</h1>
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
                      src="/addition.png" 
                      alt="Addition" 
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <div className="text-6xl font-bold text-gray-800 mb-4">
                    {num1} + {num2}
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

export default Addition;
