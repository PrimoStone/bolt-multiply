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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Multiplication Game</h1>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <p className="font-semibold">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
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
  );
};

export default Game;