import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../firebase/utils';
import { ArrowLeft } from 'lucide-react';

interface LeaderboardStats {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  score: number;
  timeSpent: number;
  timestamp: Date;
  photoURL?: string;
}

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [bestScores, setBestScores] = useState<LeaderboardStats[]>([]);
  const [mostPracticed, setMostPracticed] = useState<LeaderboardStats[]>([]);
  const [fastestGames, setFastestGames] = useState<LeaderboardStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setBestScores(data.bestScores as LeaderboardStats[]);
        setMostPracticed(data.mostPracticed as LeaderboardStats[]);
        setFastestGames(data.fastestGames as LeaderboardStats[]);
      } catch (error) {
        setError('Nie udało się pobrać statystyk');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <div className="text-center">Ładowanie...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/game')}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 flex items-center"
        >
          <ArrowLeft className="mr-2" size={20} />
          Powrót do gry
        </button>
        <h1 className="text-2xl font-bold">Ranking</h1>
      </div>
      
      {/* Najlepsze wyniki */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Najlepsze wyniki</h2>
        <div className="space-y-2">
          {bestScores.slice(0, 3).map((stat, index) => (
            <div 
              key={stat.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold w-6">{index + 1}.</span>
                {stat.photoURL ? (
                  <img
                    src={stat.photoURL}
                    alt={`${stat.firstName} ${stat.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {stat.firstName?.[0]}{stat.lastName?.[0]}
                    </span>
                  </div>
                )}
                <span>{stat.firstName} {stat.lastName}</span>
              </div>
              <span className="font-bold">{stat.score} pkt</span>
            </div>
          ))}
        </div>
      </div>

      {/* Najwięcej czasu */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Najwięcej czasu spędzonego</h2>
        <div className="space-y-2">
          {mostPracticed.slice(0, 3).map((stat, index) => (
            <div 
              key={stat.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold w-6">{index + 1}.</span>
                {stat.photoURL ? (
                  <img
                    src={stat.photoURL}
                    alt={`${stat.firstName} ${stat.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {stat.firstName?.[0]}{stat.lastName?.[0]}
                    </span>
                  </div>
                )}
                <span>{stat.firstName} {stat.lastName}</span>
              </div>
              <span className="font-bold">{Math.round(stat.timeSpent / 60)} min</span>
            </div>
          ))}
        </div>
      </div>

      {/* Najszybsze perfekcyjne gry */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Najszybsze perfekcyjne gry</h2>
        <div className="space-y-2">
          {fastestGames.slice(0, 3).map((stat, index) => (
            <div 
              key={stat.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-2">
                <span className="font-bold">{index + 1}.</span>
                <span>{stat.firstName} {stat.lastName}</span>
              </div>
              <span className="font-bold">
                {stat.timeSpent} sek
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;