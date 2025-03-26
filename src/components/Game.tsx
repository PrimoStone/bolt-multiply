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
import { COIN_REWARDS } from '../types/coinTypes';
import { RewardProvider } from '../contexts/RewardContext';
import RewardNotification from './rewards/RewardNotification';
import { UserGameStats } from '../types/gameTypes';
import { RewardNotification as RewardNotificationType } from '../types/rewardTypes';
import { TransactionType } from '../contexts/UserContext';

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
  const [coinAnimationType, setCoinAnimationType] = useState<'correct' | 'streak' | 'perfect'>('correct');
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // Reward notification state
  const [rewardNotifications, setRewardNotifications] = useState<RewardNotificationType[]>([]);
  const [currentNotification, setCurrentNotification] = useState<RewardNotificationType | null>(null);

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

  // Function to check for achievements after game completion
  const checkGameAchievements = async () => {
    // Calculate accuracy
    const accuracy = Math.round((score / TOTAL_QUESTIONS) * 100);
    
    // Calculate time taken in seconds
    const endTime = new Date();
    const timeTaken = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Calculate coins earned based on score and difficulty
    const baseCoins = COIN_REWARDS.PERFECT_GAME;
    const difficultyMultiplier = 
      difficulty === 'easy' ? 1 :
      difficulty === 'medium' ? 1.5 : 2;
    
    const totalCoins = Math.round(baseCoins * difficultyMultiplier);
    
    // Show coin animation
    setEarnedCoins(totalCoins);
    setShowCoinAnimation(true);
    
    // Update user's coins
    if (user) {
      updateCoins(totalCoins, 'REWARD', `Perfect game bonus: ${score}/${TOTAL_QUESTIONS} correct`);
    }
    
    // Save game stats
    if (user) {
      const gameStats: UserGameStats = {
        gameType: 'multiplication',
        score,
        totalQuestions: TOTAL_QUESTIONS,
        accuracy,
        timeTaken,
        difficulty,
        date: new Date(),
        targetNumber: selectedNumber
      };
      
      await saveGameStats(gameStats);
      
      // Refresh stats after game completion
      refreshStats();
      
      // Check for achievements with the reward system
      try {
        // Get the RewardContext from the parent component
        const rewardContext = document.getElementById('reward-context-value');
        if (rewardContext && rewardContext.dataset.checkAchievements === 'true') {
          // This is a placeholder for the actual implementation
          // In a real implementation, you would use the useRewards hook from the RewardContext
          // But since we're wrapping the component with RewardProvider, we'll handle this differently
          
          // For now, we'll just show a notification if the score is perfect
          if (score === TOTAL_QUESTIONS) {
            const perfectGameNotification: RewardNotificationType = {
              id: `perfect-game-${Date.now()}`,
              type: 'badge',
              itemId: 'perfect-game-badge',
              name: 'Perfect Game',
              description: 'You answered all questions correctly!',
              imageUrl: '/badges/perfect-game.png',
              earnedAt: new Date(),
              seen: false
            };
            
            setRewardNotifications([perfectGameNotification]);
            setCurrentNotification(perfectGameNotification);
          }
        }
      } catch (error) {
        console.error('Error checking achievements:', error);
      }
    }
  };

  // Handle notification close
  const handleNotificationClose = () => {
    if (currentNotification) {
      // Mark notification as seen
      if (currentNotification) {
        const updatedNotification = { ...currentNotification, seen: true };
        // In a real implementation, you would update this in the database
        console.log('Marking notification as seen:', updatedNotification);
      }
      
      // Remove from current notifications array
      setRewardNotifications(prev => prev.filter(n => n.id !== currentNotification.id));
      
      // Show the next notification if available
      const nextNotifications = rewardNotifications.filter(n => n.id !== currentNotification.id);
      if (nextNotifications.length > 0) {
        setCurrentNotification(nextNotifications[0]);
      } else {
        setCurrentNotification(null);
      }
    }
  };

  // Handle game completion
  const handleGameEnd = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Check for achievements and show rewards
    await checkGameAchievements();
    
    // Wait a moment before resetting the game
    setTimeout(() => {
      setIsGameStarted(false);
      setScore(0);
      setQuestionsAnswered(0);
      setGameHistory([]);
      setTime(0);
      setCurrentStreak(0);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const answer = parseInt(userAnswer);
    const correctAnswer = num1 * num2;
    
    if (answer === correctAnswer) {
      // Correct answer
      setScore(score + 1);
      setCurrentStreak(currentStreak + 1);
      
      // Add to game history
      setGameHistory([...gameHistory, `Correct: ${num1} × ${num2} = ${correctAnswer}`]);
      
      // Show coin animation for correct answer
      setEarnedCoins(COIN_REWARDS.CORRECT_ANSWER);
      setCoinAnimationType('correct');
      setShowCoinAnimation(true);
      
      // Update user coins
      if (user) {
        updateCoins(COIN_REWARDS.CORRECT_ANSWER, 'REWARD', `Correct answer: ${num1} × ${num2} = ${correctAnswer}`);
      }
      
      // Check for streak bonus
      if ((currentStreak + 1) % 5 === 0) {
        // Award streak bonus
        setTimeout(() => {
          setEarnedCoins(COIN_REWARDS.STREAK_BONUS);
          setCoinAnimationType('streak');
          setShowCoinAnimation(true);
          
          // Update user coins
          if (user) {
            updateCoins(COIN_REWARDS.STREAK_BONUS, 'REWARD', `Streak bonus: ${currentStreak + 1} correct answers in a row`);
          }
        }, 1000);
      }
    } else {
      // Incorrect answer
      setGameHistory([...gameHistory, `Incorrect: ${num1} × ${num2} = ${correctAnswer}, you answered ${answer}`]);
      setCurrentStreak(0);
    }
    
    // Clear input
    setUserAnswer('');
    
    // Move to next question or end game
    setQuestionsAnswered(questionsAnswered + 1);
    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      // Game completed
      handleGameEnd();
    } else {
      // Generate next question
      generateQuestion();
    }
    
    // Focus on input
    inputRef.current?.focus();
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

  const handleGameCompletion = async () => {
    // Calculate accuracy
    const accuracy = Math.round((score / TOTAL_QUESTIONS) * 100);
    
    // Calculate time taken in seconds
    const endTime = new Date();
    const timeTaken = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Calculate coins earned based on score, accuracy, and difficulty
    const baseCoins = COIN_REWARDS.GAME_COMPLETION;
    const accuracyBonus = accuracy >= 90 ? COIN_REWARDS.HIGH_ACCURACY : 0;
    const difficultyMultiplier = 
      difficulty === 'easy' ? 1 :
      difficulty === 'medium' ? 1.5 : 2;
    
    const totalCoins = Math.round((baseCoins + accuracyBonus) * difficultyMultiplier);
    
    // Show coin animation
    setEarnedCoins(totalCoins);
    setShowCoinAnimation(true);
    
    // Update user's coins
    if (user) {
      updateCoins(totalCoins, 'REWARD', `Game completion bonus: ${score}/${TOTAL_QUESTIONS} correct`);
    }
    
    // Save game stats
    if (user) {
      const gameStats: UserGameStats = {
        userId: user.id,
        gameType: 'multiplication',
        score,
        totalQuestions: TOTAL_QUESTIONS,
        accuracy,
        timeTaken,
        difficulty,
        date: new Date(),
        targetNumber: selectedNumber
      };
      
      await saveGameStats(gameStats);
      
      // Check for achievements with the reward system
      if (window.rewardsContextValue) {
        const { checkGameAchievements, checkForPendingNotifications } = window.rewardsContextValue;
        
        // Check for achievements based on game stats
        const achievementResult = await checkGameAchievements(gameStats);
        
        // If achievements were earned, get notifications
        if (achievementResult.achievementsEarned) {
          const notifications = await checkForPendingNotifications();
          setRewardNotifications(notifications);
          
          // Show the first notification if available
          if (notifications.length > 0) {
            setCurrentNotification(notifications[0]);
          }
        }
      }
      
      // Refresh stats after game completion
      refreshStats();
    }
  };

  return (
    <RewardProvider>
      <div id="reward-context-value" data-check-achievements="true" className="hidden"></div>
      <div className={`${gameStyles.container} ${gameColors.multiplication.background}`}>
        {/* Coin animation */}
        {showCoinAnimation && (
          <CoinAnimation 
            amount={earnedCoins}
            type={coinAnimationType}
            onComplete={() => {
              console.log("Animation complete, hiding animation");
              setShowCoinAnimation(false);
            }}
          />
        )}
        
        <div className={gameStyles.innerContainer}>
          {/* Main game content - reduced top spacing for better mobile experience */}
          <div className={`${gameStyles.contentWrapper} mt-0`}>
            <div className={gameStyles.gameCard}>
              <div className={`${gameStyles.gameCardGradient} ${gameColors.multiplication.gradient}`}></div>
              <div className={gameStyles.gameCardInner}>
                {/* Fixed header - sticky position to ensure it's always visible */}
                <div className="sticky top-0 z-10 backdrop-blur-md rounded-t-lg -mt-10 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-4 pb-2 mb-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate('/gameselect')}
                      className={`${gameStyles.backButton} ${gameColors.multiplication.button} text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2`}
                    >
                      <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span>Back</span>
                    </button>
                    
                    <img 
                      src="/multiplication.png" 
                      alt="Multiplication" 
                      className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                    />
                  </div>
                </div>
                <div className="max-w-md mx-auto">
                  {/* Game content starts here - removed the old navigation */}
                  {!isGameStarted ? (
                    <div className="divide-y divide-gray-200">
                      <div className="py-4 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                        <div className={gameStyles.gameContent.wrapper}>
                          {/* Removed duplicate game logo from here since we added it at the top */}
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
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      <div className="py-4 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                        <div className={gameStyles.gameContent.wrapper}>
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

                          <div className="flex justify-between mb-2 text-gray-600 font-medium text-xs sm:text-sm">
                            <div>Score: {score}</div>
                            <div>Time: {formatTime(time)}</div>
                            <div>
                              Question: {questionsAnswered + 1}/{TOTAL_QUESTIONS}
                            </div>
                          </div>

                          {/* Removed duplicate game logo from here since we added it at the top */}

                          <div className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 text-gray-700">
                            {num1} × {num2} = ?
                          </div>

                          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
                      </div>
                    </div>
                  )}
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
      
      {/* Reward notification */}
      {currentNotification && (
        <RewardNotification
          notification={currentNotification}
          onClose={handleNotificationClose}
          autoClose={false}
        />
      )}
    </RewardProvider>
  );
};

export default Game;