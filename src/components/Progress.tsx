import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { ArrowLeft } from 'lucide-react';
import { getGameStatsByUserId } from '../services/db';

interface GameStats {
  id: number;
  date: Date;
  score: number;
  totalQuestions: number;
}

const Progress: React.FC = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState<GameStats[]>([]);

  useEffect(() => {
    if (user) {
      getGameStatsByUserId(user.id).then(setStats);
    }
  }, [user]);

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Your Progress</h1>
      <p className="font-semibold">Player: {user.firstName} {user.lastName}</p>
      <div className="space-y-4">
        {stats.map((session) => (
          <div key={session.id} className="bg-gray-100 p-4 rounded">
            <p className="font-semibold">Date: {new Date(session.date).toLocaleDateString()}</p>
            <p>Score: {session.score}/{session.totalQuestions}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/game')}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 flex items-center justify-center"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to Game
      </button>
    </div>
  );
};

export default Progress;