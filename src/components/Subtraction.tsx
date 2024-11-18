import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { convertToBase64 } from '../firebase/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserStats } from '../hooks/useUserStats';

const TOTAL_QUESTIONS = 20;

const Subtraction: React.FC = () => {
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
  const { userStats, refreshStats } = useUserStats(user?.id);
  const [showStats, setShowStats] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    // First, generate the subtrahend (second number) from 0 to 12
    const subtrahend = Math.floor(Math.random() * 13);  // 0 to 12
    
    // Generate a difference from 0 to 12
    const difference = Math.floor(Math.random() * 13);  // 0 to 12
    
    // Calculate the minuend (first number) which will be subtrahend + difference
    // This ensures our minuend won't exceed 24 (max 12 + max 12)
    const minuend = subtrahend + difference;
    
    setNum1(minuend);      // First number (minuend)
    setNum2(subtrahend);   // Second number (subtrahend)
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctAnswer = num1 - num2;
    const isCorrect = parseInt(userAnswer) === correctAnswer;
    
    // Update game history
    const historyEntry = `${num1} - ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect, answer was ' + correctAnswer})`;
    setGameHistory([...gameHistory, historyEntry]);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setQuestionsAnswered(questionsAnswered + 1);

    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const finalScore = score + (isCorrect ? 1 : 0);

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
          await refreshStats();
        } catch (error) {
          console.error('Error saving game stats:', error);
        }
      }

      navigate('/proof', { 
        state: { 
          score: finalScore, 
          totalQuestions: TOTAL_QUESTIONS,
          startTime: startTime,
          endTime: endTime,
          gameHistory: [...gameHistory, historyEntry],
          gameType: 'subtraction'
        } 
      });
    } else {
      generateQuestion();
      setUserAnswer('');
    }
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 to-orange-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <Link to="/gameselect" className="text-gray-600 hover:text-gray-800 flex items-center">
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back to Games
          </Link>
        </div>

        {!isGameStarted ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Subtraction Challenge</h1>
            <p className="text-xl text-gray-600 mb-8">
              Test your subtraction skills! Subtract the numbers as quickly as you can.
            </p>
            <button
              onClick={startGame}
              className="bg-green-500 text-white px-8 py-4 rounded-lg text-xl font-semibold
                       hover:bg-green-600 transition-colors duration-200 flex items-center mx-auto"
            >
              <PlayIcon className="w-6 h-6 mr-2" />
              Start Game
            </button>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                <div>Question: {questionsAnswered + 1}/{TOTAL_QUESTIONS}</div>
                <div>Score: {score}</div>
                <div>Time: {formatTime(time)}</div>
              </div>

              <div className="text-center mb-8">
                <img 
                  src="/subtraction.png" 
                  alt="Subtraction" 
                  className="w-48 h-48 mx-auto mb-4"
                />
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%` }}
                  />
                </div>
                <div className="text-6xl font-bold text-gray-800 mt-6 mb-8">
                  {num1} - {num2} = ?
                </div>
              </div>

              <form onSubmit={handleSubmit} className="w-full">
                <input
                  ref={inputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full text-center text-4xl font-bold py-4 border-2 border-gray-300 rounded-lg
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Your answer"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full mt-4 bg-blue-500 text-white py-4 rounded-lg text-xl font-semibold
                           hover:bg-blue-600 transition-colors duration-200"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subtraction;
