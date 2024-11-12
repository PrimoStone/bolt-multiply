import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { convertToBase64 } from '../firebase/utils';

const TOTAL_QUESTIONS = 20;

interface GameProps {
  // twoje istniejące props
}

const getInitials = (firstName: string = '', lastName: string = '') => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const DivisionGame: React.FC = () => {
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
  const [userStats, setUserStats] = useState({
    totalGames: 0,
    perfectGames: 0,
    bestScore: 0,
    bestTime: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const fetchUserStats = async () => {
      if (user?.id) {
        // Tutaj dodaj logikę pobierania statystyk z Firebase
        // Tymczasowo używamy przykładowych danych
        setUserStats({
          totalGames: 15,
          perfectGames: 5,
          bestScore: 20,
          bestTime: 45
        });
      }
    };

    fetchUserStats();
  }, [user]);

  const generateQuestion = () => {
    let num2 = Math.floor(Math.random() * 9) + 1;
    let correctAnswer = Math.floor(Math.random() * 10) + 1;
    let num1 = num2 * correctAnswer;

    setNum1(num1);
    setNum2(num2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctAnswer = num1 * num2;
    const isCorrect = parseInt(userAnswer) === correctAnswer;
    const result = `${num1} x ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect'})`;
    setGameHistory([...gameHistory, result]);
    if (isCorrect) {
      setScore(score + 1);
    }
    setQuestionsAnswered(questionsAnswered + 1);

    if (questionsAnswered + 1 < TOTAL_QUESTIONS) {
      generateQuestion();
    } else {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const finalScore = score + (isCorrect ? 1 : 0);
      
      // Zapisz statystyki gry
      if (user) {
        try {
          await saveGameStats(
            user.id,
            user.username,
            user.firstName,
            user.lastName,
            finalScore,
            timeSpent,
            finalScore === TOTAL_QUESTIONS
          );
        } catch (error) {
          console.error('Błąd podczas zapisywania statystyk:', error);
        }
      }

      // Przejdź do strony z wynikami
      navigate('/proof', { 
        state: { 
          score: score + (isCorrect ? 1 : 0), 
          totalQuestions: TOTAL_QUESTIONS, 
          startTime: startTime, 
          endTime: endTime,
          gameHistory: [...gameHistory, result]
        } 
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startGame = () => {
    setIsGameStarted(true);
    setTime(0);
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
    <div className="min-h-[100dvh] h-[100dvh] bg-gradient-to-b from-orange-100 to-orange-200">
      <div className="max-w-3xl mx-auto px-4 h-full flex flex-col">
        {/* Header */}
        <div className="h-[80px] py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="mr-4 text-gray-700 hover:text-gray-900 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Wybór gry
            </Link>
          </div>

          {/* User menu */}
          <div className="flex flex-col items-end ml-auto relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="focus:outline-none"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User avatar"
                  className="w-12 h-12 rounded-full object-cover shadow-md hover:ring-2 hover:ring-blue-400 transition-all"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md hover:ring-2 hover:ring-blue-400 transition-all">
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
              )}
            </button>
            <div className="text-sm font-medium mt-1 text-gray-700">{user?.firstName}</div>

            {/* User Menu Popup */}
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50">
                {/* Profil użytkownika */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    {/* Avatar z możliwością zmiany */}
                    <div 
                      className="relative group cursor-pointer"
                      onClick={handleAvatarClick}
                      role="button"
                      tabIndex={0}
                      aria-label="Zmień zdjęcie profilowe"
                    >
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover 
                                   group-hover:opacity-80 transition-all duration-200"
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center 
                                   text-white font-bold group-hover:bg-blue-600 transition-all duration-200"
                        >
                          {getInitials(user?.firstName, user?.lastName)}
                        </div>
                      )}
                      {/* Overlay z tekstem */}
                      <div className="absolute inset-0 flex items-center justify-center 
                                    bg-black bg-opacity-0 group-hover:bg-opacity-30 
                                    rounded-full transition-all duration-200">
                        <div className="text-white text-xs font-medium opacity-0 
                                      group-hover:opacity-100 transition-all duration-200 
                                      px-2 py-1 bg-black bg-opacity-50 rounded-lg">
                          Zmień zdjęcie
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                      <div className="text-sm text-gray-500">@{user?.username}</div>
                    </div>
                  </div>
                </div>
                
                {/* Statystyki użytkownika */}
                <div className="px-4 py-3 border-b">
                  <div className="text-sm font-medium text-gray-700 mb-2">Statistics</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Total Games</div>
                      <div className="text-lg font-bold text-blue-600">{userStats.totalGames}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Perfect Games</div>
                      <div className="text-lg font-bold text-green-600">{userStats.perfectGames}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Best Score</div>
                      <div className="text-lg font-bold text-purple-600">{userStats.bestScore}/20</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Best Time</div>
                      <div className="text-lg font-bold text-orange-600">{formatTime(userStats.bestTime)}</div>
                    </div>
                  </div>
                </div>

                {/* Dane użytkownika */}
                <div className="px-4 py-2 border-b">
                  <div className="text-sm text-gray-600">
                    <div className="mb-2">
                      <span className="font-medium">Username:</span> {user?.username}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">First Name:</span> {user?.firstName}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Last Name:</span> {user?.lastName}
                    </div>
                  </div>
                </div>

                {/* Przycisk wylogowania */}
                <div className="px-4 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-4">Division Ninja</h2>
            {!isGameStarted ? (
              <div className="text-center">
                <p className="mb-4">Trenuj dzielenie liczb!</p>
                <button
                  onClick={startGame}
                  className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300"
                >
                  Start Game
                </button>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-center mb-4">
                  {num1} ÷ {num2} = ?
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter your answer"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300"
                  >
                    Submit Answer
                  </button>
                </form>
                <div className="flex justify-between">
                  <button
                    onClick={() => navigate('/progress')}
                    className="flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300"
                  >
                    <BarChart2 className="h-5 w-5" />
                    <span>View Progress</span>
                  </button>
                  <button
                    onClick={() => navigate('/leaderboard')}
                    className="flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition duration-300"
                  >
                    <Users className="h-5 w-5" />
                    <span>Leaderboard</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition duration-300"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivisionGame;