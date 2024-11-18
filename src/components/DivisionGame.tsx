import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { convertToBase64 } from '../utils/imageUtils';

const TOTAL_QUESTIONS = 20;

interface GameProps {
  // twoje istniejące props
}

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const DivisionGame: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;
      
      try {
        const userDocRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserStats({
            totalGames: data.totalGames || 0,
            perfectGames: data.perfectGames || 0,
            bestScore: data.bestScore || 0,
            bestTime: data.bestTime || null,
          });
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    loadUserStats();
  }, [user?.id]);

  const generateQuestion = () => {
    let num2 = Math.floor(Math.random() * 9) + 1;
    let correctAnswer = Math.floor(Math.random() * 10) + 1;
    let num1 = num2 * correctAnswer;

    setNum1(num1);
    setNum2(num2);
    setUserAnswer('');
  };

  const handleGameEnd = (finalScore: number, finalHistory: string[]) => {
    const endTime = new Date();
    const timeDiff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Save game stats
    if (user) {
      saveGameStats(user.id, {
        gameType: 'division',
        score: finalScore,
        totalQuestions: TOTAL_QUESTIONS,
        time: timeDiff,
        date: new Date()
      }).then(() => {
        refreshStats();
      });
    }

    navigate('/proof', {
      state: {
        score: finalScore,
        total: TOTAL_QUESTIONS,
        time: timeDiff,
        history: finalHistory,
        gameType: 'division'
      }
    });
  };

  const checkAnswer = () => {
    if (!isGameStarted) {
      setIsGameStarted(true);
    }

    const correctAnswer = num1 / num2;
    const isCorrect = parseFloat(userAnswer) === correctAnswer;
    const historyEntry = `${num1} ÷ ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect, answer was ' + correctAnswer})`;
    const newHistory = [...gameHistory, historyEntry];
    setGameHistory(newHistory);

    if (isCorrect) {
      setScore(score + 1);
    }

    setQuestionsAnswered(questionsAnswered + 1);
    setUserAnswer('');

    if (questionsAnswered + 1 === TOTAL_QUESTIONS) {
      handleGameEnd(score + (isCorrect ? 1 : 0), newHistory);
    } else {
      generateQuestion();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    checkAnswer();
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
    setStartTime(new Date());
    generateQuestion();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
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
          alt="User avatar"
          className="w-12 h-12 rounded-full object-cover shadow-md hover:ring-2 hover:ring-blue-400 transition-all"
        />
      );
    } else {
      return (
        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md hover:ring-2 hover:ring-blue-400 transition-all">
          {getInitials(user?.firstName, user?.lastName)}
        </div>
      );
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
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="cursor-pointer"
            >
              {renderAvatar()}
            </div>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-10">
                {/* User Profile */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={handleAvatarClick}
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
                      <div className="absolute inset-0 flex items-center justify-center 
                                    bg-black bg-opacity-0 group-hover:bg-opacity-30 
                                    rounded-full transition-all duration-200">
                        <Users className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                      <div className="text-sm text-gray-500">@{user?.username}</div>
                    </div>
                  </div>
                </div>

                {/* Game Stats */}
                {userStats && (
                  <div className="px-4 py-2 border-b">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Game Stats</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Total Games</div>
                        <div className="text-sm font-bold text-blue-600">{userStats.totalGames}</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Perfect Games</div>
                        <div className="text-sm font-bold text-green-600">{userStats.perfectGames}</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Best Score</div>
                        <div className="text-sm font-bold text-purple-600">{userStats.bestScore}/20</div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Best Time</div>
                        <div className="text-sm font-bold text-orange-600">
                          {userStats.bestTime ? `${userStats.bestTime}s` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Logout Button */}
                <div className="px-4 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-red-600 hover:bg-red-50 w-full px-2 py-1 rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Exit to Menu</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center">
          {!isGameStarted ? (
            <div className="text-center">
              <img 
                src="/division1.png" 
                alt="Division" 
                className="w-32 h-32 mx-auto mb-8"
              />
              <h1 className="text-4xl font-bold text-gray-800 mb-8">Division Challenge</h1>
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
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%` }}
                    />
                  </div>
                  <div className="mb-8">
                    <img 
                      src="/division1.png" 
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

export default DivisionGame;