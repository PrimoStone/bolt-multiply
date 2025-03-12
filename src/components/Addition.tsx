import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, LogOut, PlayIcon, Users, Award, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatsModal from './StatsModal';
import { gameStyles, gameColors } from '../styles/gameStyles';
import { UserContext } from '../contexts/UserContext';
import { convertToBase64 } from '../utils/imageUtils';
import { saveGameStats } from '../firebase/utils';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUserStats } from '../hooks/useUserStats';
import { useUser } from '../contexts/UserContext';
import { COIN_REWARDS, TransactionType } from '../types/coinTypes';
import { GameDifficulty } from '../types/gameConfig';
import CoinAnimation from '../components/CoinAnimation';

interface Question {
  num1: number;
  num2: number;
}

const TOTAL_QUESTIONS = 20;

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateQuestionsArray = (
  selectedNumber: number | undefined,
  difficulty: GameDifficulty,
  totalQuestions: number
): Question[] => {
  const questions: Question[] = [];
  
  if (selectedNumber !== undefined) {
    // Fixed number mode - selected number is always first
    const fixedNum = selectedNumber;
    let maxSecond: number;
    
    switch (difficulty) {
      case 'easy':
        maxSecond = 10; // Sum up to 20
        break;
      case 'medium':
        maxSecond = 20; // Sum up to 30
        break;
      case 'hard':
        maxSecond = 50; // Sum up to 60
        break;
      default:
        maxSecond = 10;
    }
    
    // Generate all possible combinations
    const possibleQuestions: Question[] = [];
    for (let i = 1; i <= maxSecond; i++) {
      possibleQuestions.push({ num1: fixedNum, num2: i });
    }
    
    // If we need more questions than possible combinations, we'll need to repeat
    while (questions.length < totalQuestions) {
      const shuffledBatch = shuffleArray([...possibleQuestions]);
      questions.push(...shuffledBatch);
    }
    
  } else {
    // Random mode
    let max: number;
    switch (difficulty) {
      case 'easy':
        max = 10; // Numbers 1-10, sum up to 20
        break;
      case 'medium':
        max = 15; // Numbers 1-15, sum up to 30
        break;
      case 'hard':
        max = 30; // Numbers 1-30, sum up to 60
        break;
      default:
        max = 10;
    }
    
    // Generate all possible combinations within the range
    const possibleQuestions: Question[] = [];
    for (let i = 1; i <= max; i++) {
      for (let j = 1; j <= max; j++) {
        // For addition, order doesn't matter (5+3 is same as 3+5)
        // So we'll only add one combination to avoid duplicates
        if (i <= j) {
          possibleQuestions.push({ num1: i, num2: j });
        }
      }
    }
    
    // If we need more questions than possible combinations, we'll need to repeat
    while (questions.length < totalQuestions) {
      const shuffledBatch = shuffleArray([...possibleQuestions]);
      questions.push(...shuffledBatch);
    }
  }
  
  // Take only the number of questions we need
  const finalQuestions = questions.slice(0, totalQuestions);
  
  // Ensure no consecutive repeats by reshuffling if necessary
  for (let i = 1; i < finalQuestions.length; i++) {
    if ((finalQuestions[i].num1 === finalQuestions[i-1].num1 && 
         finalQuestions[i].num2 === finalQuestions[i-1].num2) ||
        (finalQuestions[i].num1 === finalQuestions[i-1].num2 && 
         finalQuestions[i].num2 === finalQuestions[i-1].num1)) {
      // If we find a repeat, swap with the next non-repeating question
      for (let j = i + 1; j < finalQuestions.length; j++) {
        if ((finalQuestions[j].num1 !== finalQuestions[i-1].num1 || 
             finalQuestions[j].num2 !== finalQuestions[i-1].num2) &&
            (finalQuestions[j].num1 !== finalQuestions[i-1].num2 || 
             finalQuestions[j].num2 !== finalQuestions[i-1].num1)) {
          [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
          break;
        }
      }
    }
  }
  
  return finalQuestions;
};

const Addition = () => {
  const { user, setUser, updateCoins } = useContext(UserContext);
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
  const { stats: userStats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'addition');
  const [showStats, setShowStats] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [coinAnimationType, setCoinAnimationType] = useState<'correct' | 'streak' | 'perfect'>('correct');
  const [currentStreak, setCurrentStreak] = useState(0);

  // Game configuration
  const [selectedNumber, setSelectedNumber] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const renderAvatar = () => {
    if (user?.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt="Profile"
          className={gameStyles.userMenu.avatar.image}
        />
      );
    }
    return (
      <div className={gameStyles.userMenu.avatar.placeholder}>
        {getInitials(user?.firstName, user?.lastName)}
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await convertToBase64(file);
      if (user?.id) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          photoURL: base64
        });
        setUser(prev => prev ? { ...prev, photoURL: base64 } : null);
      }
    }
  };

  const startGame = () => {
    setIsGameStarted(true);
    setScore(0);
    setQuestionsAnswered(0);
    setCurrentQuestionIndex(0);
    setGameHistory([]);
    
    // Generate all questions at once
    const newQuestions = generateQuestionsArray(selectedNumber, difficulty, TOTAL_QUESTIONS);
    setQuestions(newQuestions);
    
    // Set initial question
    const firstQuestion = newQuestions[0];
    setNum1(firstQuestion.num1);
    setNum2(firstQuestion.num2);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  };

  const moveToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = questions[nextIndex];
      setNum1(nextQuestion.num1);
      setNum2(nextQuestion.num2);
      setUserAnswer('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = parseInt(userAnswer);
    const isCorrect = answer === num1 + num2;
    
    if (isCorrect) {
      // Update score and streak
      setScore(prev => prev + 1);
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      
      let totalReward = COIN_REWARDS.CORRECT_ANSWER;
      let animationType: 'correct' | 'streak' | 'perfect' = 'correct';
      let transactionType: TransactionType = 'CORRECT_ANSWER';
      
      // First reset any existing animation
      setShowCoinAnimation(false);
      
      if (newStreak === 10) {
        totalReward += COIN_REWARDS.STREAK_BONUS;
        animationType = 'streak';
        transactionType = 'STREAK_BONUS';
        await updateCoins(
          COIN_REWARDS.STREAK_BONUS,
          transactionType,
          '10 correct answers in a row bonus'
        );
      }
      
      if (questionsAnswered + 1 === TOTAL_QUESTIONS && score + 1 === TOTAL_QUESTIONS) {
        totalReward += COIN_REWARDS.PERFECT_GAME;
        animationType = 'perfect';
        transactionType = 'PERFECT_GAME';
        await updateCoins(
          COIN_REWARDS.PERFECT_GAME,
          transactionType,
          'Perfect game bonus'
        );
      }
      
      // Update base coins
      await updateCoins(
        COIN_REWARDS.CORRECT_ANSWER,
        'CORRECT_ANSWER',
        'Correct answer reward'
      );
      
      // Show animation for exactly 1 second
      setEarnedCoins(totalReward);
      setCoinAnimationType(animationType);
      setShowCoinAnimation(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowCoinAnimation(false);
      
      // Now proceed with next question
      setQuestionsAnswered(prev => prev + 1);
      setUserAnswer('');
      moveToNextQuestion();
    } else {
      setGameHistory(prev => [...prev, 'incorrect']);
    }
    
    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      if (user?.id) {
        await saveGameStats(user.id, {
          gameType: 'addition',
          score,
          totalQuestions: TOTAL_QUESTIONS,
          timeSpent,
          difficulty,
          timestamp: new Date().toISOString()
        });
        
        await refreshStats();
        
        // Navigate to proof screen
        navigate('/proof', {
          state: {
            score,
            totalQuestions: TOTAL_QUESTIONS,
            startTime: startTime.getTime(),
            endTime: endTime.getTime(),
            gameHistory,
            gameType: 'addition'
          },
          replace: true
        });
      }
      
      // Reset game
      setIsGameStarted(false);
      setTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else {
      moveToNextQuestion();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${gameStyles.container} ${gameColors.addition.background}`}>
      {/* Coin animation that shows when coins are earned */}
      {showCoinAnimation && (
        <CoinAnimation 
          amount={earnedCoins}
          type={coinAnimationType}
          onComplete={() => setShowCoinAnimation(false)}
        />
      )}
      <div className={gameStyles.innerContainer}>
        {/* Main game content - reduced top spacing for better mobile experience */}
        <div className={`${gameStyles.contentWrapper} mt-2`}>
          <div className={gameStyles.gameCard}>
            <div className={`${gameStyles.gameCardGradient} ${gameColors.addition.gradient}`}></div>
            <div className={gameStyles.gameCardInner}>
              <div className="max-w-md mx-auto">
                {/* Game navigation and logo - moved to top and made more compact for better mobile experience */}
                <div className="flex items-center justify-between mb-2 py-2">
                  <button
                    onClick={() => navigate('/gameselect')}
                    className={`${gameStyles.backButton} ${gameColors.addition.button} text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2`}
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span>Back</span>
                  </button>
                  
                  <img 
                    src="/addition.png" 
                    alt="Addition" 
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
                                        ? 'bg-purple-500 text-white shadow-lg scale-110' 
                                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-500 hover:text-purple-500'}
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
                                <p className="text-sm text-purple-600">
                                  Practice adding {selectedNumber}
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
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-gray-200 text-gray-700'
                                  } hover:bg-purple-400 hover:text-white transition-colors`}
                                  onClick={() => setDifficulty(d as 'easy' | 'medium' | 'hard')}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={startGame}
                            className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg transition-colors duration-200 flex items-center space-x-2 mx-auto text-sm sm:text-base bg-purple-600/70 hover:bg-purple-700/80 text-white backdrop-blur"
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
                            {num1} + {num2} = ?
                          </div>

                          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            <input
                              type="number"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200"
                              placeholder="Your answer"
                              ref={inputRef}
                            />
                            <button
                              type="submit"
                              className="w-full py-3 rounded-lg font-semibold shadow-lg transition-colors duration-200 bg-purple-600/70 hover:bg-purple-700/80 text-white backdrop-blur"
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
                                  result === 'correct' ? 'bg-green-500' : 'bg-red-500'
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
          <img 
            src="/mr-primo.png" 
            alt="Mr. Primo" 
            className={gameStyles.mrPrimoLogo.image}
          />
        </div>

        {/* Stats Modal */}
        {showStats && (
          <StatsModal
            onClose={() => setShowStats(false)}
            stats={userStats}
            loading={statsLoading}
            error={statsError}
          />
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
};

export default Addition;
