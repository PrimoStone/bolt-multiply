import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';

const TOTAL_QUESTIONS = 20;

interface GameProps {
  // twoje istniejące props
}

const Game: React.FC<GameProps> = () => {
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

  const generateQuestion = () => {
    setNum1(Math.floor(Math.random() * 11) + 2);
    setNum2(Math.floor(Math.random() * 11) + 2);
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

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-orange-100 to-orange-200 p-4">
      {/* Logo w headerze */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <img 
          src="/number-ninjas-logo.png"
          alt="Number Ninjas"
          className="w-24 h-auto"
        />
      </div>

      {/* Avatar użytkownika */}
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.firstName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold border-2 border-white shadow-md">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        )}
        <span className="text-lg font-medium text-gray-700">
          {user?.firstName}
        </span>
      </div>

      {/* Timer */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-4 py-2">
        <div className="text-2xl font-bold text-gray-700">
          {formatTime(time)}
        </div>
      </div>

      {!isGameStarted ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <button
            onClick={startGame}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-xl font-bold 
                     shadow-lg hover:bg-blue-700 transition duration-300"
          >
            Rozpocznij grę
          </button>
        </div>
      ) : (
        <div className="space-y-6 pt-20">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Score: {score}/{questionsAnswered}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-2xl text-center font-bold">
              {num1} x {num2} = ?
            </div>
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
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 flex items-center"
            >
              <BarChart2 className="mr-2" size={20} />
              View Progress
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition duration-300 flex items-center"
            >
              <Users className="mr-2" size={20} />
              Leaderboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition duration-300 flex items-center"
            >
              <LogOut className="mr-2" size={20} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Footer z logo MrPrimo */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <img 
          src="/MrPrimo-LOGO-sm.png"
          alt="MrPrimo"
          className="w-16 h-auto opacity-80 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
};

export default Game;