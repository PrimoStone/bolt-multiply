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
    // Fixed number mode
    const fixedNum = selectedNumber;
    let maxMultiplier: number;
    
    switch (difficulty) {
      case 'easy':
        maxMultiplier = 3;
        break;
      case 'medium':
        maxMultiplier = 6;
        break;
      case 'hard':
        maxMultiplier = 12;
        break;
      default:
        maxMultiplier = 3;
    }
    
    // Generate all possible combinations
    const possibleQuestions: Question[] = [];
    for (let i = 1; i <= maxMultiplier; i++) {
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
        max = 6;
        break;
      case 'medium':
        max = 9;
        break;
      case 'hard':
        max = 12;
        break;
      default:
        max = 6;
    }
    
    // Generate all possible combinations within the range
    const possibleQuestions: Question[] = [];
    for (let i = 1; i <= max; i++) {
      for (let j = 1; j <= max; j++) {
        possibleQuestions.push({ num1: i, num2: j });
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

const Multiplication = () => {
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
  const { stats: userStats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'multiplication');
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
    const isCorrect = answer === num1 * num2;
    
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
          gameType: 'multiplication',
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
          <div className={gameStyles.gameCardGradient} />
          <div className={gameStyles.gameCardInner}>
            {/* Logo */}
            <div className={gameStyles.numberNinjasLogo.wrapper}>
              <Link to="/">
                <img src="/number-ninjas-logo.png" alt="Number Ninjas" className={gameStyles.numberNinjasLogo.image} />
              </Link>
            </div>

            {/* User Menu */}
            <div className={gameStyles.userMenu.wrapper}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={gameStyles.userMenu.button}>
                <div className={gameStyles.userMenu.avatar.wrapper}>
                  {renderAvatar()}
                </div>
              </button>
              {isUserMenuOpen && (
                <div className={gameStyles.userMenu.dropdown.wrapper}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={gameStyles.userMenu.dropdown.item}
                  >
                    <Users className={gameStyles.userMenu.dropdown.icon} />
                    Change Avatar
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className={gameStyles.userMenu.dropdown.item}
                  >
                    <Award className={gameStyles.userMenu.dropdown.icon} />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      // handle logout
                    }}
                    className={gameStyles.userMenu.dropdown.item}
                  >
                    <LogOut className={gameStyles.userMenu.dropdown.icon} />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Game Content */}
            <div className={gameStyles.gameContent.wrapper}>
              {!isGameStarted ? (
                <div className={gameStyles.gameContent.startScreen.wrapper}>
                  <img
                    src="/multiplication.png"
                    alt="Multiplication"
                    className={gameStyles.gameContent.startScreen.image}
                  />
                  <h1 className={gameStyles.gameContent.startScreen.title}>Multiplication Challenge</h1>
                  
                  {/* Number selection grid */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSelectedNumber(selectedNumber === num ? undefined : num)}
                        className={`
                          w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                          transition-all duration-200 ease-in-out
                          ${selectedNumber === num 
                            ? 'bg-yellow-500 text-white shadow-lg scale-110' 
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-yellow-500 hover:text-yellow-500'}
                        `}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Difficulty Selection */}
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
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          } hover:bg-purple-400 hover:text-white transition-colors`}
                          onClick={() => setDifficulty(d as GameDifficulty)}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startGame}
                    className={`${gameStyles.gameContent.startScreen.startButton} ${gameColors.multiplication.button}`}
                  >
                    <PlayIcon className="mr-2" />
                    Start Game
                  </button>
                </div>
              ) : (
                <div className={gameStyles.gameContent.gameScreen.wrapper}>
                  <div className={gameStyles.gameContent.gameScreen.inner}>
                    {/* Game Progress */}
                    <div className={gameStyles.gameContent.progressBar.wrapper}>
                      <div
                        className={`${gameStyles.gameContent.progressBar.inner} ${gameColors.multiplication.gradient}`}
                        style={{ width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%` }}
                      />
                    </div>

                    <div className={gameStyles.gameContent.gameScreen.content}>
                      {/* Game Stats */}
                      <div className="flex justify-between mb-6">
                        <div>Score: {score}</div>
                        <div>Time: {formatTime(time)}</div>
                        <div>
                          Question: {questionsAnswered + 1}/{TOTAL_QUESTIONS}
                        </div>
                      </div>

                      {/* Game Question */}
                      <div className={gameStyles.gameContent.gameScreen.equation}>
                        {num1} × {num2} = ?
                      </div>

                      {/* Answer Form */}
                      <form onSubmit={handleSubmit}>
                        <input
                          ref={inputRef}
                          type="number"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className={`${gameStyles.gameContent.gameScreen.input} ${gameColors.multiplication.focus}`}
                          placeholder="Enter your answer"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className={`${gameStyles.gameContent.gameScreen.submitButton} ${gameColors.multiplication.button}`}
                        >
                          Check Answer
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
                  </div>
                </div>
              )}
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

export default Multiplication;
