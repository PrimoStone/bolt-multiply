import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { useUserStats } from '../hooks/useUserStats';
import { StatsModal } from './StatsModal';
import { gameStyles, gameColors } from '../styles/gameStyles';
import { COIN_REWARDS } from '../types/coinTypes';
import { GameDifficulty } from '../types/gameConfig';
import CoinAnimation from '../components/CoinAnimation';

const TOTAL_QUESTIONS = 20;

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const DivisionGame: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateCoins } = useContext(UserContext);
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
  const [selectedNumber, setSelectedNumber] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [usedQuestionPairs, setUsedQuestionPairs] = useState<string[]>([]);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [coinAnimationType, setCoinAnimationType] = useState<'correct' | 'streak' | 'perfect'>('correct');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  // Track if a new question is already being generated to prevent duplicate generations
  const isGeneratingRef = useRef(false);
  // Store the last question info to detect duplicates
  const lastQuestionRef = useRef({ num1: 0, num2: 0 });

  const { stats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'division');

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      // Only initialize the start time here, but don't generate a question
      // until the user explicitly starts the game
      setStartTime(new Date());
    }
  }, [user, navigate]);

  // Focus the input field whenever the question changes or when the game starts
  useEffect(() => {
    if (isGameStarted && inputRef.current && !isProcessingAnswer) {
      // Use a small timeout to ensure DOM is ready
      const focusTimeout = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('[DivisionGame] Input focused');
        }
      }, 50);
      
      return () => clearTimeout(focusTimeout);
    }
  }, [num1, num2, isGameStarted, isProcessingAnswer]);

  const startGame = () => {
    console.log('[DivisionGame] Starting new game');
    setIsGameStarted(true);
    setStartTime(new Date());
    
    // Reset all game state
    setUsedQuestionPairs([]);
    console.log('[DivisionGame] Reset used question pairs');
    
    setQuestionsAnswered(0);
    setScore(0);
    setGameHistory([]);
    setCurrentStreak(0);
    setTime(0);
    setIsProcessingAnswer(false);
    isGeneratingRef.current = false;
    lastQuestionRef.current = { num1: 0, num2: 0 };
    
    // Generate first question
    generateQuestion();
    
    // Start timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      console.log('[DivisionGame] Cleared existing timer');
    }
    
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    console.log('[DivisionGame] Started game timer');
  };

  // Debug function to log current state
  const logQuestionState = (message: string, data?: any) => {
    console.log(`[DivisionGame] ${message}`, data || '');
  };

  const generateQuestion = () => {
    // Prevent multiple simultaneous question generations
    if (isGeneratingRef.current) {
      logQuestionState('Already generating a question, skipping');
      return;
    }
    
    isGeneratingRef.current = true;
    logQuestionState('Generating new question');
    logQuestionState('Current used pairs:', [...usedQuestionPairs]);
    
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
    
    // Create all possible question pairs for the current divisor
    const allPossiblePairs = [];
    const allPairs = [];
    
    for (let answer = 1; answer <= maxAnswer; answer++) {
      const dividend = newNum2 * answer;
      const questionPair = `${dividend}:${newNum2}`;
      allPairs.push(questionPair);
      
      if (!usedQuestionPairs.includes(questionPair)) {
        allPossiblePairs.push({ dividend, divisor: newNum2, answer, questionPair });
      }
    }
    
    logQuestionState('All possible pairs for divisor ' + newNum2 + ':', allPairs);
    logQuestionState('Available unused pairs:', allPossiblePairs.map(p => p.questionPair));

    // If no unused pairs are available, try a different divisor or reset
    if (allPossiblePairs.length === 0) {
      // If a specific number is selected, we need to reset used pairs
      if (selectedNumber) {
        logQuestionState('Resetting used pairs for selected number ' + selectedNumber);
        setUsedQuestionPairs([]);
        // Regenerate with same selected number after reset
        isGeneratingRef.current = false;
        setTimeout(generateQuestion, 0);
        return;
      } else {
        // Try a different divisor by recursively calling with a forced different number
        logQuestionState('No available pairs for divisor ' + newNum2 + ', trying a different divisor');
        // Find a divisor that has unused pairs
        let foundNewDivisor = false;
        for (let tryNum = 2; tryNum <= 12; tryNum++) {
          if (tryNum === newNum2) continue; // Skip the current divisor
          
          // Check if this divisor has any unused pairs
          let hasUnusedPairs = false;
          for (let ans = 1; ans <= maxAnswer; ans++) {
            const testPair = `${tryNum * ans}:${tryNum}`;
            if (!usedQuestionPairs.includes(testPair)) {
              hasUnusedPairs = true;
              break;
            }
          }
          
          if (hasUnusedPairs) {
            // Use this divisor instead
            newNum2 = tryNum;
            foundNewDivisor = true;
            logQuestionState('Found new divisor with unused pairs:', tryNum);
            break;
          }
        }
        
        // If we couldn't find any divisor with unused pairs, reset everything
        if (!foundNewDivisor) {
          logQuestionState('No divisors with unused pairs, resetting all used pairs');
          setUsedQuestionPairs([]);
          isGeneratingRef.current = false;
          setTimeout(generateQuestion, 0);
          return;
        }
        
        // Recalculate possible pairs with the new divisor
        const newPossiblePairs = [];
        for (let answer = 1; answer <= maxAnswer; answer++) {
          const dividend = newNum2 * answer;
          const questionPair = `${dividend}:${newNum2}`;
          if (!usedQuestionPairs.includes(questionPair)) {
            newPossiblePairs.push({ dividend, divisor: newNum2, answer, questionPair });
          }
        }
        
        if (newPossiblePairs.length === 0) {
          // This shouldn't happen based on our checks above, but just in case
          logQuestionState('Still no available pairs after finding new divisor, resetting');
          setUsedQuestionPairs([]);
          isGeneratingRef.current = false;
          setTimeout(generateQuestion, 0);
          return;
        }
        
        // Use the recalculated pairs
        const randomIndex = Math.floor(Math.random() * newPossiblePairs.length);
        const selectedPair = newPossiblePairs[randomIndex];
        
        logQuestionState('Selected new pair after divisor change:', selectedPair);
        
        // Add the question pair to used pairs
        setUsedQuestionPairs(prev => {
          const newUsedPairs = [...prev, selectedPair.questionPair];
          logQuestionState('Updated used pairs:', newUsedPairs);
          return newUsedPairs;
        });
        
        // Set the question values
        const newDividend = selectedPair.dividend;
        const newDivisor = selectedPair.divisor;
        
        // Check if this is a duplicate of the last question
        if (newDividend === lastQuestionRef.current.num1 && newDivisor === lastQuestionRef.current.num2) {
          logQuestionState('Generated duplicate question, trying again');
          isGeneratingRef.current = false;
          setTimeout(generateQuestion, 0);
          return;
        }
        
        // Update last question reference
        lastQuestionRef.current = { num1: newDividend, num2: newDivisor };
        
        setNum1(newDividend);
        setNum2(newDivisor);
        setUserAnswer('');
        
        // Focus the input field
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            logQuestionState('Input focused after new question generation');
          }
        }, 150);
        
        isGeneratingRef.current = false;
        return;
      }
    }

    // Select a random pair from available pairs
    const randomIndex = Math.floor(Math.random() * allPossiblePairs.length);
    const selectedPair = allPossiblePairs[randomIndex];
    
    logQuestionState('Selected pair:', selectedPair);
    
    // Add the question pair to used pairs - use functional update to ensure we're working with latest state
    setUsedQuestionPairs(prev => {
      const newUsedPairs = [...prev, selectedPair.questionPair];
      logQuestionState('Updated used pairs:', newUsedPairs);
      return newUsedPairs;
    });
    
    // Set the question values
    const newDividend = selectedPair.dividend;
    const newDivisor = selectedPair.divisor;
    
    // Check if this is a duplicate of the last question
    if (newDividend === lastQuestionRef.current.num1 && newDivisor === lastQuestionRef.current.num2) {
      logQuestionState('Generated duplicate question, trying again');
      isGeneratingRef.current = false;
      setTimeout(generateQuestion, 0);
      return;
    }
    
    // Update last question reference
    lastQuestionRef.current = { num1: newDividend, num2: newDivisor };
    
    setNum1(newDividend);
    setNum2(newDivisor);
    setUserAnswer('');
    
    // Focus the input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        logQuestionState('Input focused after new question generation');
      }
    }, 150);
    
    isGeneratingRef.current = false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProcessingAnswer) {
      handleAnswer();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessingAnswer) {
      e.preventDefault();
      handleAnswer();
    }
  };

  const handleAnswer = () => {
    // Prevent processing if already processing or no answer
    if (isProcessingAnswer || !userAnswer) return;
    
    // Set processing flag to disable UI
    setIsProcessingAnswer(true);
    console.log('[DivisionGame] Processing answer, UI disabled');

    if (!isGameStarted) {
      setIsGameStarted(true);
    }

    const correctAnswer = num1 / num2;
    const isCorrect = parseFloat(userAnswer) === correctAnswer;
    
    // Add to history
    const historyEntry = `${num1} ÷ ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect, answer was ' + correctAnswer})`;
    setGameHistory(prev => [...prev, historyEntry]);
    console.log('[DivisionGame] Added to history:', historyEntry);
    
    // Update score and streak
    if (isCorrect) {
      setScore(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
      
      // Show coin animation
      setEarnedCoins(COIN_REWARDS.CORRECT_ANSWER);
      setCoinAnimationType('correct');
      setShowCoinAnimation(true);
      console.log('[DivisionGame] Correct answer, showing coin animation');
      
      // Add coins with all required parameters
      try {
        // Use the correct transaction type and description
        updateCoins(COIN_REWARDS.CORRECT_ANSWER, 'REWARD', 'Correct division answer');
      } catch (error) {
        console.error('Error updating coins:', error);
      }
    } else {
      setCurrentStreak(0);
      console.log('[DivisionGame] Incorrect answer');
    }
    
    // Store current question before incrementing counter
    const currentQuestionPair = `${num1}:${num2}`;
    console.log('[DivisionGame] Current question pair:', currentQuestionPair);
    
    // Increment questions counter - use functional update to ensure latest value
    setQuestionsAnswered(prev => {
      const newCount = prev + 1;
      console.log('[DivisionGame] Questions answered:', newCount);
      return newCount;
    });
    
    // Clear user answer
    setUserAnswer('');
    
    // Use a completely different approach with a single animation timeout
    // This ensures we only generate one question per answer
    const animationTimeout = setTimeout(() => {
      // Hide coin animation
      setShowCoinAnimation(false);
      console.log('[DivisionGame] Animation hidden');
      
      // Check if game is over - use local variable instead of state
      // to avoid race conditions
      const nextQuestionNumber = questionsAnswered + 1;
      if (nextQuestionNumber >= TOTAL_QUESTIONS) {
        console.log('[DivisionGame] Game complete, ending game');
        handleGameEnd();
      } else {
        // Need a separate timeout for generating the next question
        // to ensure all UI updates are complete first
        console.log('[DivisionGame] Will generate next question in 300ms');
        const nextQuestionTimeout = setTimeout(() => {
          console.log('[DivisionGame] Now generating next question');
          // Generate next question
          generateQuestion();
          
          // Only release the processing lock after the question is fully generated
          // with a small delay to ensure UI stability
          setTimeout(() => {
            setIsProcessingAnswer(false);
            console.log('[DivisionGame] Processing complete, UI enabled');
          }, 100);
        }, 300);
        
        return () => clearTimeout(nextQuestionTimeout);
      }
    }, 1000);
    
    // Cleanup function in case component unmounts
    return () => clearTimeout(animationTimeout);
  };

  const handleGameEnd = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Make sure processing flag is set to prevent any further interactions
    setIsProcessingAnswer(true);

    const endTime = new Date();
    const gameTime = (endTime.getTime() - startTime.getTime()) / 1000;

    try {
      saveGameStats(user?.id || '', {
        gameType: 'division',
        score,
        totalQuestions: TOTAL_QUESTIONS,
        timeSpent: gameTime,
        history: gameHistory,
      });

      // Refresh stats after saving
      refreshStats();
      
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
      // Even if there's an error, make sure we reset the game
      setIsGameStarted(false);
      setTime(0);
      setIsProcessingAnswer(false);
    }
  };

  return (
    <div className={`${gameStyles.container} ${gameColors.division.background}`}>
      {/* Coin animation that shows when coins are earned */}
      {showCoinAnimation && (
        <CoinAnimation 
          amount={earnedCoins}
          type={coinAnimationType}
          onComplete={() => {
            // Animation complete callback
            // We handle hiding in the main flow to avoid race conditions
          }}
        />
      )}
      <div className={gameStyles.innerContainer}>
        {/* Main game content - reduced top spacing for better mobile experience */}
        <div className={`${gameStyles.contentWrapper} mt-2`}>
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
                                  Practicing division by {selectedNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Difficulty Selection */}
                          <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-center">
                              Select Difficulty
                            </label>
                            <div className="flex justify-center space-x-4">
                              {(['easy', 'medium', 'hard'] as GameDifficulty[]).map((d) => (
                                <button
                                  key={d}
                                  onClick={() => setDifficulty(d)}
                                  className={`
                                    px-4 py-2 rounded-lg capitalize transition-colors duration-200
                                    ${difficulty === d
                                      ? 'bg-orange-500 text-white shadow-md'
                                      : 'bg-white text-gray-700 hover:bg-orange-100 hover:text-orange-600'}
                                  `}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={startGame}
                            className={`${gameStyles.gameContent.startScreen.startButton} ${gameColors.division.button}`}
                          >
                            <PlayIcon className="w-5 h-5 mr-2" />
                            Start Game
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
                              onKeyPress={handleKeyPress}
                              disabled={isProcessingAnswer}
                              autoComplete="off"
                            />
                            <button
                              type="submit"
                              className={`w-full py-3 rounded-lg font-semibold shadow-lg transition-colors duration-200 ${
                                isProcessingAnswer 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-orange-600/70 hover:bg-orange-700/80 text-white backdrop-blur'
                              }`}
                              disabled={isProcessingAnswer}
                            >
                              {isProcessingAnswer ? 'Processing...' : 'Submit Answer'}
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
