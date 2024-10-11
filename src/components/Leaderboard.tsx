import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock } from 'lucide-react';
import { getAllGameStats, getAllUsers } from '../services/db';

interface LeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  totalTime: number;
}

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'time'>('score');

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      const allStats = await getAllGameStats();
      const allUsers = await getAllUsers();

      const leaderboardData = allUsers.map(user => {
        const userStats = allStats.filter(stat => stat.userId === user.id);
        return {
          userId: user.id,
          username: user.username,
          totalScore: userStats.reduce((sum, stat) => sum + stat.score, 0),
          gamesPlayed: userStats.length,
          totalTime: userStats.reduce((sum, stat) => sum + stat.duration, 0),
        };
      });

      setLeaderboard(leaderboardData);
    };

    fetchLeaderboardData();
  }, []);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'score') {
      return b.totalScore - a.totalScore;
    } else {
      return b.totalTime - a.totalTime;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Leaderboard</h1>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setSortBy('score')}
          className={`p-2 rounded ${sortBy === 'score' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          <Trophy className="inline-block mr-2" size={20} />
          Best Scores
        </button>
        <button
          onClick={() => setSortBy('time')}
          className={`p-2 rounded ${sortBy === 'time' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          <Clock className="inline-block mr-2" size={20} />
          Most Time Practiced
        </button>
      </div>
      <div className="space-y-4">
        {sortedLeaderboard.map((entry, index) => (
          <div key={entry.userId} className="bg-gray-100 p-4 rounded flex justify-between items-center">
            <div>
              <p className="font-semibold">{index + 1}. {entry.username}</p>
              <p>Games Played: {entry.gamesPlayed}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {sortBy === 'score' ? `Total Score: ${entry.totalScore}` : `Total Time: ${Math.round(entry.totalTime / 60000)} min`}
              </p>
              <p>
                {sortBy === 'score' ? `Avg Score: ${(entry.totalScore / entry.gamesPlayed).toFixed(2)}` : `Avg Time: ${Math.round(entry.totalTime / entry.gamesPlayed / 1000)} sec`}
              </p>
            </div>
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

export default Leaderboard;