import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { convertToBase64 } from '../firebase/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserStats } from '../hooks/useUserStats';
import StatsModal from '../components/StatsModal'; // Import StatsModal component
import { gameStyles, gameColors } from '../styles/gameStyles';
import CoinAnimation from '../components/CoinAnimation'; // Import CoinAnimation component

const TOTAL_QUESTIONS = 20;

interface GameProps {
  // twoje istniejące props
}

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const Game: React.FC = () => {
  const { user, setUser, updateCoins } = useUser();
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
  const [selectedNumber, setSelectedNumber] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [usedNumbers, setUsedNumbers] = useState<number[]>([]);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

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
    // If a number is selected, use it as one of the factors
    let newNum1: number;
    let newNum2: number;

    // Get max range based on difficulty
    let maxRange;
    switch (difficulty) {
      case 'easy':
        maxRange = 10;
        break;
      case 'medium':
        maxRange = 20;
        break;
      case 'hard':
        maxRange = 30;
        break;
      default:
        maxRange = 10;
    }

    // Keep track of available numbers that haven't been used yet
    let availableNumbers = Array.from({ length: maxRange }, (_, i) => i + 1)
      .filter(num => !usedNumbers.includes(num));

    // If all numbers have been used, reset the usedNumbers array
    if (availableNumbers.length === 0) {
      setUsedNumbers([]);
      availableNumbers = Array.from({ length: maxRange }, (_, i) => i + 1);
    }

    // Select a random number from available numbers
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const randomNumber = availableNumbers[randomIndex];

    // Add the number to used numbers
    setUsedNumbers(prev => [...prev, randomNumber]);

    if (selectedNumber) {
      // If a number is selected, use it as num1 and generate random num2
      newNum1 = selectedNumber;
      newNum2 = randomNumber;
    } else {
      // If no number is selected, generate both numbers randomly
      newNum1 = Math.floor(Math.random() * 9) + 1;
      newNum2 = randomNumber;
    }

    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = parseInt(userAnswer);
    const isCorrect = answer === num1 * num2;
    
    if (isCorrect) {
      // Calculate coin reward
      const baseReward = 10;
      const streakBonus = Math.floor(currentStreak / 5) * 5;
      const speedBonus = time < 5 ? 5 : 0;
      const totalReward = baseReward + streakBonus + speedBonus;
      
      setScore(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
      setEarnedCoins(totalReward);
      setShowCoinAnimation(true);
      
      await updateCoins(totalReward);
      setGameHistory(prev => [...prev, 
        `${num1} × ${num2} = ${answer} (Correct! +${totalReward} coins)`
      ]);
    } else {
      setCurrentStreak(0);
      setGameHistory(prev => [...prev, 
        `${num1} × ${num2} = ${answer} (correct answer was ${num1 * num2})`
      ]);
    }
    
    setQuestionsAnswered(prev => prev + 1);
    setUserAnswer('');
    
    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const finalScore = score + (isCorrect ? 1 : 0);
      const finalHistory = [...gameHistory, 
        `${num1} × ${num2} = ${answer} (${isCorrect ? 'Correct' : 'Incorrect, answer was ' + num1 * num2})`
      ];

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
    setStartTime(new Date());
    setUsedNumbers([]); // Reset used numbers when starting new game
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

  return (
    <div className={`${gameStyles.container} ${gameColors.multiplication.background}`}>
      {showCoinAnimation && (
        <CoinAnimation 
          amount={earnedCoins}
          onComplete={() => setShowCoinAnimation(false)}
        />
      )}
      <div className={gameStyles.innerContainer}>
        {/* Logo at top */}
        <div className={gameStyles.numberNinjasLogo.wrapper}>
          <Link to="/" className="inline-block">
            <img 
              src="/number-ninjas-logo.png" 
              alt="Number Ninjas" 
              className={gameStyles.numberNinjasLogo.image}
            />
          </Link>
        </div>

        {/* User menu */}
        <div className={gameStyles.userMenu.wrapper}>
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={gameStyles.userMenu.button}
            >
              <div className={gameStyles.userMenu.avatar.wrapper}>
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className={gameStyles.userMenu.avatar.image}
                  />
                ) : (
                  <div className={`${gameStyles.userMenu.avatar.placeholder} ${gameColors.multiplication.button}`}>
                    {getInitials(user?.firstName, user?.lastName)}
                  </div>
                )}
              </div>
            </button>

            {isUserMenuOpen && (
              <div
                ref={dropdownRef}
                className={gameStyles.userMenu.dropdown.wrapper}
              >
                <Link
                  to="/profile"
                  className={gameStyles.userMenu.dropdown.item}
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Users className={gameStyles.userMenu.dropdown.icon} />
                  Profile
                </Link>

                <button
                  onClick={() => setShowStats(true)}
                  className={gameStyles.userMenu.dropdown.item}
                >
                  <BarChart2 className={gameStyles.userMenu.dropdown.icon} />
                  Stats
                </button>

                <button
                  onClick={() => {
                    setUser(null);
                    navigate('/login');
                  }}
                  className={gameStyles.userMenu.dropdown.item}
                >
                  <LogOut className={gameStyles.userMenu.dropdown.icon} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main game content */}
        <div className={gameStyles.contentWrapper}>
          <div className={gameStyles.gameCard}>
            <div className={`${gameStyles.gameCardGradient} ${gameColors.multiplication.gradient}`}></div>
            <div className={gameStyles.gameCardInner}>
              <div className="max-w-md mx-auto">
                <div className="divide-y divide-gray-200">
                  <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                    <div className="flex justify-between items-center mb-8">
                      <button
                        onClick={() => navigate('/gameselect')}
                        className={`${gameStyles.backButton} ${gameColors.multiplication.button}`}
                      >
                        <ArrowLeft className={gameStyles.backIcon} />
                        <span>Back</span>
                      </button>
                    </div>

                    <div className={gameStyles.gameContent.wrapper}>
                      {!isGameStarted ? (
                        <div className={gameStyles.gameContent.startScreen.wrapper}>
                          <img 
                            src="/multiplication.png" 
                            alt="Multiplication" 
                            className="w-48 h-48 object-contain mx-auto mb-4"
                          />
                          {/* <h1 className={gameStyles.gameContent.startScreen.title}>Multiplication Challenge</h1> */}

                          {/* Number Selection */}
                          <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-center">
                              Select a Number (Optional)
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3 max-w-[320px] mx-auto">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                                <div key={num} className="flex items-center justify-center">
                                  <button
                                    onClick={() => setSelectedNumber(selectedNumber === num ? undefined : num)}
                                    className={`
                                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-semibold
                                      transition-all duration-200 ease-in-out
                                      ${selectedNumber === num 
                                        ? 'bg-blue-500 text-white shadow-lg scale-110' 
                                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-500 hover:text-blue-500'}
                                    `}
                                  >
                                    {num}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-center">
                              {selectedNumber === undefined ? (
                                <p className="text-sm text-gray-500">
                                  No number selected - using random numbers
                                </p>
                              ) : (
                                <p className="text-sm text-blue-600">
                                  Practice multiplying by {selectedNumber}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Difficulty Selection */}
                          <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                              Difficulty Level
                            </label>
                            <div className="flex gap-2">
                              {['easy', 'medium', 'hard'].map((d) => (
                                <button
                                  key={d}
                                  className={`flex-1 py-2 px-4 rounded-lg capitalize ${
                                    difficulty === d
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200 text-gray-700'
                                  } hover:bg-blue-400 hover:text-white transition-colors`}
                                  onClick={() => setDifficulty(d as 'easy' | 'medium' | 'hard')}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={startGame}
                            className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg transition-colors duration-200 flex items-center space-x-2 mx-auto text-sm sm:text-base bg-blue-600/70 hover:bg-blue-700/80 text-white backdrop-blur"
                          >
                            <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span>Start Game</span>
                          </button>
                        </div>
                      ) : (
                        <div className={gameStyles.gameContent.gameScreen.wrapper}>
                          {/* Progress Bar */}
                          <div className={gameStyles.gameContent.progressBar.wrapper}>
                            <div 
                              className={gameStyles.gameContent.progressBar.inner}
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
                                0% { background-position: 200% center; }
                                100% { background-position: -200% center; }
                              }
                            `}
                          </style>

                          <div className="flex justify-between mb-6 text-gray-600 font-medium">
                            <div>Score: {score}</div>
                            <div>Time: {formatTime(time)}</div>
                            <div>
                              Question: {questionsAnswered + 1}/{TOTAL_QUESTIONS}
                            </div>
                          </div>

                          <div className="mb-4 sm:mb-8">
                            <img 
                              src="/multiplication.png" 
                              alt="Multiplication" 
                              className="w-48 h-48 object-contain mx-auto mb-2"
                            />
                          </div>

                          <div className="text-4xl font-bold text-center mb-8 text-gray-700">
                            {num1} × {num2} = ?
                          </div>

                          <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                              type="number"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                              placeholder="Your answer"
                              ref={inputRef}
                            />
                            <button
                              type="submit"
                              className="w-full py-3 rounded-lg font-semibold shadow-lg transition-colors duration-200 bg-blue-600/70 hover:bg-blue-700/80 text-white backdrop-blur"
                            >
                              Submit Answer
                            </button>
                          </form>

                          {/* Game History */}
                          <div className="flex gap-1 mt-6 justify-center">
                            {gameHistory.map((result, index) => (
                              <div
                                key={index}
                                className={`w-3 h-3 rounded-full ${
                                  result.includes('Correct') ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mr. Primo logo at bottom */}
        <div className={gameStyles.mrPrimoLogo.wrapper}>
          <Link to="https://mrprimo.org" target="_blank" rel="noopener noreferrer" className="inline-block">
            <img 
              src="/MrPrimo-LOGO-sm.png" 
              alt="Mr. Primo" 
              className={gameStyles.mrPrimoLogo.image}
            />
          </Link>
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
      </div>
    </div>
  );
};

export default Game;