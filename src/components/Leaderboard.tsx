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

  // Dodajmy helper do wyświetlania medali
  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0:
        return '🏆';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}.`;
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-gradient-to-b from-orange-100 to-orange-200 overflow-auto">
      <div className="max-w-3xl mx-auto px-4 h-full flex flex-col">
        <div className="pt-4 pb-4 text-center">
          <img 
            src="/number-ninjas-logo.png"
            alt="Number Ninjas"
            className="w-24 h-auto mx-auto"
          />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Best Scores</h2>
              <div className="space-y-2">
                {bestScores.slice(0, 3).map((stat, index) => (
                  <div 
                    key={stat.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold w-6 text-xl">{getMedalEmoji(index)}</span>
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

            <div>
              <h2 className="text-xl font-semibold mb-4">Most Time Spent</h2>
              <div className="space-y-2">
                {mostPracticed.slice(0, 3).map((stat, index) => (
                  <div 
                    key={stat.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold w-6 text-xl">{getMedalEmoji(index)}</span>
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

            <div>
              <h2 className="text-xl font-semibold mb-4">Fastest Perfect Games</h2>
              <div className="space-y-2">
                {fastestGames.slice(0, 3).map((stat, index) => (
                  <div 
                    key={stat.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold w-6 text-xl">{getMedalEmoji(index)}</span>
                      <span>{stat.firstName} {stat.lastName}</span>
                    </div>
                    <span className="font-bold">{stat.timeSpent} sek</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/game')}
              className="w-full bg-blue-500 text-white p-4 rounded-lg text-xl font-bold hover:bg-blue-600 transition duration-300"
            >
              Back to Game
            </button>
          </div>
        </div>

        <div className="py-4 text-center">
          <img 
            src="/MrPrimo-LOGO-sm.png"
            alt="MrPrimo"
            className="w-16 h-auto mx-auto opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;