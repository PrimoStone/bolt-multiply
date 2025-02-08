import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, BarChart2, LogOut, PlayIcon, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatsModal from './StatsModal';
import { gameStyles, gameColors } from '../styles/gameStyles';
import { UserContext } from '../contexts/UserContext';
import { convertToBase64 } from '../utils/imageUtils';
import { saveGameStats } from '../firebase/utils';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUserStats } from '../hooks/useUserStats';
import { Award, X } from 'lucide-react';

interface Question {
  num1: number;
  num2: number;
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
    // Fixed number mode - selected number is always first (minuend)
    const fixedNum = selectedNumber;
    let maxSubtrahend: number;
    
    switch (difficulty) {
      case 'easy':
        maxSubtrahend = Math.min(10, fixedNum - 1); // Result at least 1
        break;
      case 'medium':
        maxSubtrahend = Math.min(20, fixedNum - 1);
        break;
      case 'hard':
        maxSubtrahend = Math.min(50, fixedNum - 1);
        break;
      default:
        maxSubtrahend = Math.min(10, fixedNum - 1);
    }
    
    // Generate all possible combinations
    const possibleQuestions: Question[] = [];
    for (let i = 1; i <= maxSubtrahend; i++) {
      possibleQuestions.push({ num1: fixedNum, num2: i });
    }
    
    // If we need more questions than possible combinations, we'll need to repeat
    while (questions.length < totalQuestions) {
      const shuffledBatch = shuffleArray([...possibleQuestions]);
      questions.push(...shuffledBatch);
    }
    
  } else {
    // Random mode
    let maxMinuend: number;
    switch (difficulty) {
      case 'easy':
        maxMinuend = 20; // Numbers 1-20
        break;
      case 'medium':
        maxMinuend = 50; // Numbers 1-50
        break;
      case 'hard':
        maxMinuend = 100; // Numbers 1-100
        break;
      default:
        maxMinuend = 20;
    }
    
    // Generate all possible combinations within the range
    const possibleQuestions: Question[] = [];
    for (let minuend = 2; minuend <= maxMinuend; minuend++) {
      // Subtrahend must be less than minuend to ensure positive result
      for (let subtrahend = 1; subtrahend < minuend; subtrahend++) {
        possibleQuestions.push({ num1: minuend, num2: subtrahend });
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
    if (finalQuestions[i].num1 === finalQuestions[i-1].num1 && 
        finalQuestions[i].num2 === finalQuestions[i-1].num2) {
      // If we find a repeat, swap with the next non-repeating question
      for (let j = i + 1; j < finalQuestions.length; j++) {
        if (finalQuestions[j].num1 !== finalQuestions[i-1].num1 || 
            finalQuestions[j].num2 !== finalQuestions[i-1].num2) {
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

const Subtraction = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
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
  const { stats: userStats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'subtraction');
  const [showStats, setShowStats] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Game configuration
  const [selectedNumber, setSelectedNumber] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');

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
      <div className={`${gameStyles.userMenu.avatar.placeholder} ${gameColors.subtraction.button}`}>
        {getInitials(user?.firstName, user?.lastName)}
      </div>
    );
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
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
    const isCorrect = answer === num1 - num2;
    
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
          gameType: 'subtraction',
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

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleSubmit(e);
    }
  };

  const handleGameEnd = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const endTime = new Date();
    const gameTime = (endTime.getTime() - startTime.getTime()) / 1000;
    const finalScore = score + (parseInt(userAnswer) === num1 - num2 ? 1 : 0);

    try {
      await saveGameStats(user?.id || '', {
        gameType: 'subtraction',
        score: finalScore,
        totalQuestions: TOTAL_QUESTIONS,
        timeSpent: gameTime,
        history: gameHistory,
      });

      // Refresh stats after saving
      await refreshStats();

      // Navigate to proof page with game results
      navigate('/proof', { 
        state: { 
          score: finalScore,
          totalQuestions: TOTAL_QUESTIONS,
          startTime: startTime.getTime(),
          endTime: endTime.getTime(),
          gameHistory: gameHistory,
          gameType: 'subtraction'
        }
      });

    } catch (error) {
      console.error('Error saving game stats:', error);
    }

    setIsGameStarted(false);
    setTime(0);
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
    <div className={`${gameStyles.container} ${gameColors.subtraction.background}`}>
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
                  <div className={`${gameStyles.userMenu.avatar.placeholder} ${gameColors.subtraction.button}`}>
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
            <div className={`${gameStyles.gameCardGradient} ${gameColors.subtraction.gradient}`}></div>
            <div className={gameStyles.gameCardInner}>
              <div className="max-w-md mx-auto">
                <div className="divide-y divide-gray-200">
                  <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                    <div className="flex justify-between items-center mb-8">
                      <button
                        onClick={() => navigate('/gameselect')}
                        className={`${gameStyles.backButton} ${gameColors.subtraction.button}`}
                      >
                        <ArrowLeft className={gameStyles.backIcon} />
                        <span>Back</span>
                      </button>
                    </div>

                    <div className={gameStyles.gameContent.wrapper}>
                      {!isGameStarted ? (
                        <div className={gameStyles.gameContent.startScreen.wrapper}>
                          <img 
                            src="/subtraction.png" 
                            alt="Subtraction" 
                            className={gameStyles.gameContent.startScreen.image}
                          />
                          <h1 className={gameStyles.gameContent.startScreen.title}>Subtraction Challenge</h1>
                          <div className="mb-8">
                            <label className="block text-gray-700 text-sm font-bold mb-4">
                              Select a Number (Optional)
                            </label>
                            <div className="grid grid-cols-4 gap-4 mb-6">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => setSelectedNumber(selectedNumber === num ? undefined : num)}
                                  className={`
                                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                                    transition-all duration-200 ease-in-out
                                    ${selectedNumber === num 
                                      ? 'bg-red-500 text-white shadow-lg scale-110' 
                                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-500 hover:text-red-500'}
                                  `}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                            {selectedNumber === undefined && (
                              <p className="text-sm text-gray-500 mt-2">
                                No number selected - using random numbers
                              </p>
                            )}
                          </div>
                          <div className="mb-8">
                            <label className="block text-gray-700 text-sm font-bold mb-4">
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
                                  onClick={() => setDifficulty(d as GameDifficulty)}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={startGame}
                            className={`${gameStyles.gameContent.startScreen.startButton} ${gameColors.subtraction.button}`}
                          >
                            <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span>Start Game</span>
                          </button>
                        </div>
                      ) : (
                        <div className={gameStyles.gameContent.gameScreen.wrapper}>
                          <div className={gameStyles.gameContent.gameScreen.inner}>
                            <div className={gameStyles.gameContent.gameScreen.content}>
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
                              <div className="mb-4 sm:mb-8">
                                <img 
                                  src="/subtraction.png" 
                                  alt="Subtraction" 
                                  className={gameStyles.gameContent.startScreen.image}
                                />
                              </div>
                              <div className={gameStyles.gameContent.gameScreen.equation}>
                                {num1} - {num2}
                              </div>
                              <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                  type="number"
                                  value={userAnswer}
                                  onChange={(e) => setUserAnswer(e.target.value)}
                                  className={`${gameStyles.gameContent.gameScreen.input} ${gameColors.subtraction.focus}`}
                                  placeholder="Your answer"
                                  ref={inputRef}
                                  onKeyPress={handleKeyPress}
                                />
                                <button
                                  type="submit"
                                  className={`${gameStyles.gameContent.gameScreen.submitButton} ${gameColors.subtraction.button}`}
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
            gameType="subtraction"
          />
        )}
      </div>
    </div>
  );
};

export default Subtraction;
