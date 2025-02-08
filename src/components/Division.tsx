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
import { GameDifficulty } from '../types/gameConfig';

interface Question {
  dividend: number;
  divisor: number;
}

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
    // Fixed number mode - selected number is always the divisor
    const fixedNum = selectedNumber;
    let maxMultiplier: number;
    
    switch (difficulty) {
      case 'easy':
        maxMultiplier = 3; // max dividend 36
        break;
      case 'medium':
        maxMultiplier = 6; // max dividend 72
        break;
      case 'hard':
        maxMultiplier = 12; // max dividend 144
        break;
      default:
        maxMultiplier = 3;
    }
    
    // Generate all possible combinations
    const possibleQuestions: Question[] = [];
    for (let i = 1; i <= maxMultiplier; i++) {
      possibleQuestions.push({ 
        divisor: fixedNum,
        dividend: fixedNum * i
      });
    }
    
    // If we need more questions than possible combinations, we'll need to repeat
    while (questions.length < totalQuestions) {
      const shuffledBatch = shuffleArray([...possibleQuestions]);
      questions.push(...shuffledBatch);
    }
    
  } else {
    // Random mode
    let maxDivisor: number;
    let maxMultiplier: number;
    
    switch (difficulty) {
      case 'easy':
        maxDivisor = 6;
        maxMultiplier = 6; // Result will be 1-6 (max 36)
        break;
      case 'medium':
        maxDivisor = 9;
        maxMultiplier = 8; // Result will be 1-8 (max 72)
        break;
      case 'hard':
        maxDivisor = 12;
        maxMultiplier = 12; // Result will be 1-12 (max 144)
        break;
      default:
        maxDivisor = 6;
        maxMultiplier = 6;
    }
    
    // Generate all possible combinations
    const possibleQuestions: Question[] = [];
    for (let divisor = 1; divisor <= maxDivisor; divisor++) {
      for (let multiplier = 1; multiplier <= maxMultiplier; multiplier++) {
        possibleQuestions.push({
          divisor: divisor,
          dividend: divisor * multiplier
        });
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
    if (finalQuestions[i].dividend === finalQuestions[i-1].dividend && 
        finalQuestions[i].divisor === finalQuestions[i-1].divisor) {
      // If we find a repeat, swap with the next non-repeating question
      for (let j = i + 1; j < finalQuestions.length; j++) {
        if (finalQuestions[j].dividend !== finalQuestions[i-1].dividend || 
            finalQuestions[j].divisor !== finalQuestions[i-1].divisor) {
          [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
          break;
        }
      }
    }
  }
  
  return finalQuestions;
};

const TOTAL_QUESTIONS = 20;

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const Division = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [dividend, setDividend] = useState(0);
  const [divisor, setDivisor] = useState(0);
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
  const { stats: userStats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'division');
  const [showStats, setShowStats] = useState(false);

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
    setDivisor(firstQuestion.divisor);
    setDividend(firstQuestion.dividend);
    
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
      setDivisor(nextQuestion.divisor);
      setDividend(nextQuestion.dividend);
      setUserAnswer('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = parseInt(userAnswer);
    const isCorrect = answer === dividend / divisor;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setGameHistory(prev => [...prev, 'correct']);
    } else {
      setGameHistory(prev => [...prev, 'incorrect']);
    }
    
    setQuestionsAnswered(prev => prev + 1);
    setUserAnswer('');
    
    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      if (user?.id) {
        await saveGameStats(user.id, {
          gameType: 'division',
          score,
          totalQuestions: TOTAL_QUESTIONS,
          timeSpent,
          difficulty,
          timestamp: new Date().toISOString()
        });
      }
      
      // Reset game
      setIsGameStarted(false);
      setTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      await refreshStats();
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
    <div className={gameStyles.container}>
      <div className={gameStyles.contentWrapper}>
        <div className={gameStyles.gameCard}>
          <div className={`${gameStyles.gameCardGradient} ${gameColors.division.gradient}`}></div>
          <div className={gameStyles.gameCardInner}>
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <div className="flex justify-between items-center mb-8">
                    <button
                      onClick={() => navigate('/gameselect')}
                      className={`${gameStyles.backButton} ${gameColors.division.button}`}
                    >
                      <ArrowLeft className={gameStyles.backIcon} />
                      <span>Back</span>
                    </button>
                  </div>

                  <div className={gameStyles.gameContent.wrapper}>
                    {!isGameStarted ? (
                      <div className={gameStyles.gameContent.startScreen.wrapper}>
                        <img 
                          src="/division.png" 
                          alt="Division" 
                          className="w-48 h-48 object-contain mx-auto mb-4"
                        />
                        {/* <h1 className={gameStyles.gameContent.startScreen.title}>Division Challenge</h1> */}

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
                                No number selected - using random numbers
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
                                onClick={() => setDifficulty(d as 'easy' | 'medium' | 'hard')}
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

                        <div className="flex justify-between mb-6 text-gray-600 font-medium">
                          <div>Score: {score}</div>
                          <div>Time: {formatTime(time)}</div>
                          <div>
                            Question: {questionsAnswered + 1}/{TOTAL_QUESTIONS}
                          </div>
                        </div>

                        <div className="mb-4 sm:mb-8">
                          <img 
                            src="/division.png" 
                            alt="Division" 
                            className="w-48 h-48 object-contain mx-auto mb-2"
                          />
                        </div>

                        <div className="text-4xl font-bold text-center mb-8 text-gray-700">
                          {dividend} ÷ {divisor} = ?
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
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
  );
};

export default Division;
