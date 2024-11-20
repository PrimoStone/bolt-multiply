import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { convertToBase64 } from '../utils/imageUtils';
import { saveGameStats } from '../firebase/utils';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUserStats } from '../hooks/useUserStats';
import { StatsModal } from './StatsModal';
import { gameStyles, gameColors } from '../styles/gameStyles';

const TOTAL_QUESTIONS = 20;

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const Addition: React.FC = () => {
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
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'addition');
  const [showStats, setShowStats] = useState(false);

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
    generateQuestion();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  };

  const generateQuestion = () => {
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctAnswer = num1 + num2;
    const isCorrect = parseInt(userAnswer) === correctAnswer;
    
    const historyEntry = `${num1} + ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect'})`;
    setGameHistory([...gameHistory, historyEntry]);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setQuestionsAnswered(questionsAnswered + 1);

    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      handleGameEnd();
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
        gameType: 'addition',
        score,
        totalQuestions: TOTAL_QUESTIONS,
        timeSpent: gameTime,
        history: gameHistory,
      });

      // Refresh stats after saving
      await refreshStats();
      
      // Show stats modal
      setShowStats(true);

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

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className={`${gameStyles.container} ${gameColors.addition.background}`}>
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
                  <div className={`${gameStyles.userMenu.avatar.placeholder} ${gameColors.addition.button}`}>
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
            <div className={`${gameStyles.gameCardGradient} ${gameColors.addition.gradient}`}></div>
            <div className={gameStyles.gameCardInner}>
              <div className="max-w-md mx-auto">
                <div className="divide-y divide-gray-200">
                  <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                    <div className="flex justify-between items-center mb-8">
                      <button
                        onClick={() => navigate('/gameselect')}
                        className={`${gameStyles.backButton} ${gameColors.addition.button}`}
                      >
                        <ArrowLeft className={gameStyles.backIcon} />
                        <span>Back</span>
                      </button>
                    </div>

                    <div className={gameStyles.gameContent.wrapper}>
                      {!isGameStarted ? (
                        <div className={gameStyles.gameContent.startScreen.wrapper}>
                          <img 
                            src="/addition.png" 
                            alt="Addition" 
                            className={gameStyles.gameContent.startScreen.image}
                          />
                          <h1 className={gameStyles.gameContent.startScreen.title}>Addition Challenge</h1>
                          <button
                            onClick={startGame}
                            className={`${gameStyles.gameContent.startScreen.startButton} ${gameColors.addition.button}`}
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
                                  src="/addition.png" 
                                  alt="Addition" 
                                  className={gameStyles.gameContent.startScreen.image}
                                />
                              </div>
                              <div className={gameStyles.gameContent.gameScreen.equation}>
                                {num1} + {num2}
                              </div>
                              <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                  type="number"
                                  value={userAnswer}
                                  onChange={(e) => setUserAnswer(e.target.value)}
                                  className={`${gameStyles.gameContent.gameScreen.input} ${gameColors.addition.focus}`}
                                  placeholder="Your answer"
                                  ref={inputRef}
                                />
                                <button
                                  type="submit"
                                  className={`${gameStyles.gameContent.gameScreen.submitButton} ${gameColors.addition.button}`}
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
            stats={stats}
            loading={statsLoading}
            error={statsError}
            gameType="addition"
          />
        )}
      </div>
    </div>
  );
};

export default Addition;
