import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Award, BarChart2, LogOut, Users, ArrowLeft, PlayIcon } from 'lucide-react';
import { saveGameStats } from '../firebase/utils';
import { useUserStats } from '../hooks/useUserStats';
import { StatsModal } from './StatsModal';

const TOTAL_QUESTIONS = 20;

const DivisionGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
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

  const { stats, loading: statsLoading, error: statsError, refreshStats } = useUserStats(user?.id || '', 'division');

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
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const generateQuestion = () => {
    let newNum2 = Math.floor(Math.random() * 9) + 1;
    let correctAnswer = Math.floor(Math.random() * 10) + 1;
    let newNum1 = newNum2 * correctAnswer;

    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAnswer();
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleAnswer();
    }
  };

  const handleAnswer = async () => {
    if (!userAnswer) return;

    if (!isGameStarted) {
      setIsGameStarted(true);
    }

    const correctAnswer = num1 / num2;
    const isCorrect = parseFloat(userAnswer) === correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    const historyEntry = `${num1} ÷ ${num2} = ${userAnswer} (${isCorrect ? 'Correct' : 'Incorrect, answer was ' + correctAnswer})`;
    setGameHistory([...gameHistory, historyEntry]);
    setUserAnswer('');
    
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);

    if (newQuestionsAnswered >= TOTAL_QUESTIONS) {
      await handleGameEnd();
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
    const finalScore = score + (parseFloat(userAnswer) === num1 / num2 ? 1 : 0);

    try {
      await saveGameStats(
        user?.id || '',
        user?.username || '',
        user?.firstName || '',
        user?.lastName || '',
        finalScore,
        gameTime,
        finalScore === TOTAL_QUESTIONS,
        'division'
      );

      await refreshStats();

      navigate('/proof', { 
        state: { 
          score: finalScore,
          totalQuestions: TOTAL_QUESTIONS,
          startTime: startTime.getTime(),
          endTime: endTime.getTime(),
          gameHistory: gameHistory,
          gameType: 'division'
        }
      });

    } catch (error) {
      console.error('Error saving game stats:', error);
    }

    setIsGameStarted(false);
    setTime(0);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 min-w-[500px]">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center mb-8">
                  <Link to="/game-select" className="text-blue-600 hover:text-blue-800">
                    <ArrowLeft className="h-6 w-6" />
                  </Link>
                  <button
                    onClick={() => setShowStats(true)}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    <BarChart2 className="h-5 w-5" />
                    <span>Stats</span>
                  </button>
                </div>

                {!isGameStarted ? (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Division Practice</h2>
                    <p className="mb-8">Ready to practice division? Click Start to begin!</p>
                    <button
                      onClick={() => setIsGameStarted(true)}
                      className="bg-green-500 text-white px-8 py-3 rounded-lg text-xl font-semibold hover:bg-green-600 transition-colors duration-200"
                    >
                      Start
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-lg font-semibold">
                        Score: {score}/{questionsAnswered}
                      </div>
                      <div className="text-lg font-semibold">
                        Time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-6xl font-bold text-gray-800 mb-4 text-center">
                      {num1} ÷ {num2}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        type="number"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full text-center text-4xl font-bold py-3 border-2 border-gray-300 rounded-lg
                                 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                        placeholder="Your answer"
                        ref={inputRef}
                      />
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold
                                 hover:bg-green-700 transition-colors duration-200"
                      >
                        Submit Answer
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
  );
};

export default DivisionGame;