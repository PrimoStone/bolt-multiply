import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { useUserStats } from '../hooks/useUserStats';
import { StatsModal } from './StatsModal';
import { gameStyles, gameColors } from '../styles/gameStyles';

const TOTAL_QUESTIONS = 20;

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
  const [selectedNumber, setSelectedNumber] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [usedNumbers, setUsedNumbers] = useState<number[]>([]);

  const { stats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'division');

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
    setUsedNumbers([]); // Reset used numbers when starting new game
    generateQuestion();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  };

  const generateQuestion = () => {
    // If a number is selected, use it as the divisor (num2)
    let newNum2 = selectedNumber || Math.floor(Math.random() * 9) + 2;
    
    // Generate the answer based on difficulty
    let maxAnswer;
    switch (difficulty) {
      case 'easy':
        maxAnswer = 10;
        break;
      case 'medium':
        maxAnswer = 20;
        break;
      case 'hard':
        maxAnswer = 30;
        break;
      default:
        maxAnswer = 10;
    }
    
    // Keep track of available answers that haven't been used yet
    let availableAnswers = Array.from({ length: maxAnswer }, (_, i) => i + 1)
      .filter(num => !usedNumbers.includes(num));

    // If all numbers have been used, reset the usedNumbers array
    if (availableAnswers.length === 0) {
      setUsedNumbers([]);
      availableAnswers = Array.from({ length: maxAnswer }, (_, i) => i + 1);
    }

    // Select a random answer from available answers
    const randomIndex = Math.floor(Math.random() * availableAnswers.length);
    const correctAnswer = availableAnswers[randomIndex];
    
    // Add the answer to used numbers
    setUsedNumbers(prev => [...prev, correctAnswer]);
    
    // Calculate num1 by multiplying num2 and correctAnswer
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
      
      // Navigate to proof screen
      navigate('/proof', { 
        state: { 
          score, 
          totalQuestions: TOTAL_QUESTIONS,
          startTime: startTime.getTime(),
          endTime: endTime.getTime(),
          gameHistory,
          gameType: 'division'
        },
        replace: true  // Use replace to prevent back navigation
      });

    } catch (error) {
      console.error('Error saving game stats:', error);
    }

    setIsGameStarted(false);
    setTime(0);
  };

  return (
    <div className={`${gameStyles.container} ${gameColors.division.background}`}>
      <div className={gameStyles.innerContainer}>
        {/* Main game content */}
        <div className={gameStyles.contentWrapper}>
          <div className={gameStyles.gameCard}>
            <div className={`${gameStyles.gameCardGradient} ${gameColors.division.gradient}`}></div>
            <div className={gameStyles.gameCardInner}>
              <div className="max-w-md mx-auto">
                {/* Game navigation and logo - moved to top and made more compact for better mobile experience */}
                <div className="flex items-center justify-between mb-2 py-2">
                  <button
                    onClick={() => navigate('/')}
                    className={`${gameStyles.backButton} ${gameColors.division.button} text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2`}
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span>Back</span>
                  </button>
                  
                  <img 
                    src="/division.png" 
                    alt="Division" 
                    className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                  />
                </div>

                <div className="divide-y divide-gray-200">
                  <div className="py-4 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                    <div className={gameStyles.gameContent.wrapper}>
                      {!isGameStarted ? (
                        <div className={gameStyles.gameContent.startScreen.wrapper}>
                          {/* Removed duplicate game logo since we already have it at the top */}
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
                                        ? 'bg-orange-500 text-white shadow-lg scale-110' 
                                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-500 hover:text-orange-500'}
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
                                  No number selected - using random divisors
                                </p>
                              ) : (
                                <p className="text-sm text-orange-600">
                                  Practice dividing by {selectedNumber}
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
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-200 text-gray-700'
                                  } hover:bg-orange-400 hover:text-white transition-colors`}
                                  onClick={() => setDifficulty(d as GameDifficulty)}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={startGame}
                            className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg transition-colors duration-200 flex items-center space-x-2 mx-auto text-sm sm:text-base bg-orange-600/70 hover:bg-orange-700/80 text-white backdrop-blur"
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

                          <div className="flex justify-between mb-2 text-gray-600 font-medium text-xs sm:text-sm">
                            <div>Score: {score}</div>
                            <div>Time: {formatTime(time)}</div>
                            <div>
                              Question: {questionsAnswered + 1}/{TOTAL_QUESTIONS}
                            </div>
                          </div>

                          {/* Removed duplicate game logo since we already have it at the top */}

                          <div className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 text-gray-700">
                            {num1} ÷ {num2} = ?
                          </div>

                          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            <input
                              type="number"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200"
                              placeholder="Your answer"
                              ref={inputRef}
                            />
                            <button
                              type="submit"
                              className="w-full py-3 rounded-lg font-semibold shadow-lg transition-colors duration-200 bg-orange-600/70 hover:bg-orange-700/80 text-white backdrop-blur"
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
    </div>
  );
};

export default DivisionGame;