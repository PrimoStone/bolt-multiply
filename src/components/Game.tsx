import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useRewards } from '../contexts/RewardContext';
import { PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { useUserStats } from '../hooks/useUserStats';
import CoinAnimation from '../components/CoinAnimation'; 
import { COIN_REWARDS } from '../types/coinTypes';
import RewardNotification from './rewards/RewardNotification';
import { UserGameStats, GameType as UserGameStatsGameType } from '../types/gameTypes';
import { RewardNotification as RewardNotificationType } from '../types/rewardTypes';

const TOTAL_QUESTIONS = 20;

const Game: React.FC = () => {
  const { user, updateCoins } = useUser();
  const { checkGameAchievements: contextCheckGameAchievements, notifications: contextNotifications, refreshRewards: refreshRewardsContext } = useRewards();
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedNumber, setSelectedNumber] = useState<number | undefined>(undefined);
  const [time, setTime] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshStats } = useUserStats(user?.id || '', 'multiplication');
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [coinAnimationType, setCoinAnimationType] = useState<'correct' | 'streak' | 'perfect'>('correct');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false); 
  const [currentNotification, setCurrentNotification] = useState<RewardNotificationType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [usedNumbers, setUsedNumbers] = useState<string[]>([]); 
  const [showResults, setShowResults] = useState(false); 

  useEffect(() => {
    if (isGameStarted && !showResults) {
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

  const generateQuestion = () => {
    let newNum1: number;
    let newNum2: number;

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

    let availableNumbers = Array.from({ length: maxRange }, (_, i) => i + 1)
      .filter(num => !usedNumbers.includes(num.toString()));

    if (availableNumbers.length === 0) {
      setUsedNumbers([]);
      availableNumbers = Array.from({ length: maxRange }, (_, i) => i + 1);
    }

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const randomNumber = availableNumbers[randomIndex];

    setUsedNumbers((prev: string[]) => [...prev, randomNumber.toString()]);

    if (selectedNumber) {
      newNum1 = selectedNumber;
      newNum2 = randomNumber;
    } else {
      newNum1 = Math.floor(Math.random() * 9) + 1;
      newNum2 = randomNumber;
    }

    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingAnswer) return;
    setIsProcessingAnswer(true);

    const correctAnswer = num1 * num2;
    const userAnswerNum = parseInt(userAnswer);

    if (userAnswerNum === correctAnswer) {
      setScore(prev => prev + 1);
      setGameHistory(prev => [...prev, `Question: ${num1} × ${num2} = ${userAnswerNum} (Correct)`]);
      setCurrentStreak(prev => prev + 1);
      
      // Handle correct answer coins
      setEarnedCoins(COIN_REWARDS.CORRECT_ANSWER);
      setCoinAnimationType('correct');
      setShowCoinAnimation(true);
      
      if (user && updateCoins) {
        await updateCoins(COIN_REWARDS.CORRECT_ANSWER, 'REWARD', `Correct answer: ${num1} × ${num2} = ${correctAnswer}`);
      }
      
      // Check for streak bonus - but don't show animation yet
      // We'll handle this in the onComplete callback of the first animation
      const hasStreakBonus = (currentStreak + 1) % 5 === 0;
      if (hasStreakBonus && user && updateCoins) {
        // Still award the coins in the database
        await updateCoins(COIN_REWARDS.STREAK_BONUS, 'REWARD', `Streak bonus: ${currentStreak + 1} correct answers in a row`);
      }
    } else {
      setGameHistory(prev => [...prev, `Question: ${num1} × ${num2} = ${userAnswerNum} (Incorrect, Correct: ${correctAnswer})`]);
      setCurrentStreak(0);
    }

    setUserAnswer('');
    setQuestionsAnswered(prev => prev + 1);

    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      await handleGameCompletion();
    } else {
      generateQuestion();
    }
    setIsProcessingAnswer(false); 
  };

  const handleGameCompletion = async () => {
    setIsGameStarted(false);
    setShowResults(true);

    const accuracy = (score / TOTAL_QUESTIONS) * 100;
    let totalCoinsEarned = 0;

    if (accuracy >= 90) {
      totalCoinsEarned += COIN_REWARDS.HIGH_ACCURACY;
    }
    totalCoinsEarned += COIN_REWARDS.GAME_COMPLETION;

    if (user && updateCoins) {
      await updateCoins(totalCoinsEarned, 'REWARD', 'Coins earned for completing the game'); 
    }

    const gameStats: UserGameStats = {
      gameType: 'multiplication' as UserGameStatsGameType,
      score,
      totalQuestions: TOTAL_QUESTIONS,
      accuracy,
      timeTaken: time, 
      timeSpent: time, 
      difficulty: difficulty,
      date: new Date(),
      targetNumber: selectedNumber,
      history: gameHistory, 
    };

    if (user) { 
      await saveGameStats(user.id, gameStats); 
      refreshStats(); 

      try {
        if (contextCheckGameAchievements) {
          await contextCheckGameAchievements(gameStats); 
          refreshRewardsContext(); 

          const unseenNotifications = contextNotifications?.filter(n => !n.seen);
          if (unseenNotifications && unseenNotifications.length > 0) {
            setCurrentNotification(unseenNotifications[0]);
          }
        }
      } catch (err) {
        console.error("Error checking achievements or refreshing rewards:", err);
      }
    }
  };

  const handleNotificationClose = () => {
    if (currentNotification && contextNotifications) {
      // Add a small delay before removing the notification to allow for animation
      setTimeout(() => {
        setCurrentNotification(null);
        
        // Update the context to mark notification as seen
        if (refreshRewardsContext) {
          refreshRewardsContext();
        }
      }, 300); // Short delay for animation to complete
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startGame = () => {
    setIsGameStarted(true);
    setUsedNumbers([]); 
    generateQuestion();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  };

  const resetGame = () => {
    setShowResults(false);
    setScore(0);
    setQuestionsAnswered(0);
    setGameHistory([]);
    setCurrentStreak(0);
    setTime(0);
    setIsGameStarted(false);
    setUsedNumbers([]); 
    startGame();
  };

  const currentBgColor = 'bg-gray-100';
  const currentTextColor = 'text-gray-800';

  return (
    <div className={`min-h-screen flex flex-col ${currentBgColor} ${currentTextColor}`}> 
      {/* Coin animation */}
      {showCoinAnimation && (
        <CoinAnimation 
          amount={earnedCoins} 
          type={coinAnimationType}
          onComplete={() => {
            // Check if this was a correct answer and if we have a streak bonus to show
            const hasStreakBonus = coinAnimationType === 'correct' && currentStreak % 5 === 0 && currentStreak > 0;
            
            if (hasStreakBonus) {
              // Show streak bonus animation
              setEarnedCoins(COIN_REWARDS.STREAK_BONUS);
              setCoinAnimationType('streak');
              // The animation will continue showing
            } else {
              // No streak bonus, just hide the animation
              setShowCoinAnimation(false);
            }
          }}
        />
      )}
      {/* Reward notification */}
      {currentNotification && (
        <RewardNotification
          notification={currentNotification}
          onClose={handleNotificationClose} 
          autoClose={false} 
        />
      )}
      {/* Results Modal/Screen - Placeholder */} 
      {showResults && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Game Over!</h2>
            <p className="text-xl mb-2 text-gray-700">Your Score: {score}/{TOTAL_QUESTIONS}</p>
            <p className="text-lg mb-2 text-gray-600">Accuracy: {((score / TOTAL_QUESTIONS) * 100).toFixed(0)}%</p>
            <p className="text-lg mb-4 text-gray-600">Time: {formatTime(time)}</p>
            <button 
              onClick={() => {
                resetGame();
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      {/* Main game content */}
      {!isGameStarted ? (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg text-gray-700">
            <img 
                src="/multiplication.png" 
                alt="Multiplication Challenge Icon"
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-blue-600">Multiplication Challenge</h1>
            
            {/* Number Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2 text-center">
                Practice a Specific Times Table (Optional)
              </label>
              <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                {[...Array(12)].map((_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedNumber(selectedNumber === num ? undefined : num)}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 
                      ${selectedNumber === num 
                        ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {selectedNumber !== undefined && (
                <p className="text-center text-sm text-blue-600 mt-2">
                  Practice Mode: Multiplying by {selectedNumber}
                </p>
              )}
              {selectedNumber === undefined && (
                 <p className="text-center text-sm text-gray-500 mt-2">
                  Random Mode: All numbers will be used
                </p>
              )}
            </div>

            {/* Difficulty Selection */}
            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-bold mb-2 text-center">
                Difficulty Level
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {(['easy', 'medium', 'hard'] as Array<'easy' | 'medium' | 'hard'>).map((d) => (
                  <button
                    key={d}
                    className={`py-2 px-4 sm:px-6 rounded-lg capitalize font-medium transition-colors duration-200 ease-in-out transform hover:scale-105
                      ${difficulty === d 
                        ? 'bg-green-500 text-white shadow-md ring-2 ring-green-300' 
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold shadow-lg transition-transform duration-200 ease-in-out bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
            {/* Top Bar: Score, Time, Question Count */}
            <div className="flex justify-between items-center mb-4 text-sm sm:text-base text-gray-600">
              <div className="font-medium">Score: <span className="text-blue-600 font-bold">{score}</span></div>
              <div className="font-medium">Time: <span className="text-green-600 font-bold">{formatTime(time)}</span></div>
              <div className="font-medium">Q: <span className="text-purple-600 font-bold">{questionsAnswered + 1}/{TOTAL_QUESTIONS}</span></div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 sm:mb-8">
              <div 
                className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>

            <div className="text-4xl sm:text-5xl font-bold text-center mb-6 sm:mb-8 text-gray-700">
              {num1} <span className="text-blue-500">×</span> {num2} = ?
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 ease-in-out text-center tabular-nums"
                placeholder="Your Answer"
                ref={inputRef}
                disabled={isProcessingAnswer} 
              />
              <button
                type="submit"
                className={`w-full py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 text-white
                  ${isProcessingAnswer 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'}`}
                disabled={isProcessingAnswer} 
              >
                {isProcessingAnswer ? 'Checking...' : 'Submit Answer'}
              </button>
            </form>

            {/* Game History Dots */}
            <div className="flex gap-1.5 mt-6 justify-center h-3">
              {gameHistory.map((result, index) => (
                <div
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full ${result.includes('Correct') ? 'bg-green-400' : 'bg-red-400'}`}
                  title={result} // Show full result on hover
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;