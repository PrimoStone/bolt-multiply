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
    <div className="min-h-screen h-screen bg-gradient-to-b from-orange-100 to-orange-200 overflow-auto">
      <div className="max-w-3xl mx-auto px-4 h-full relative flex flex-col">
        {/* Header z logo */}
        <div className="pt-4 pb-4 text-center">
          <img 
            src="/number-ninjas-logo.png"
            alt="Number Ninjas"
            className="w-24 h-auto mx-auto"
          />
        </div>

        {/* Główna zawartość */}
        <div className="flex-1 flex flex-col space-y-8 py-4">
          {/* Przycisk powrotu i tytuł */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              onClick={() => navigate('/game')}
              className="flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 w-full md:w-auto"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Powrót do gry</span>
            </button>
            <h1 className="text-2xl font-bold">Ranking</h1>
          </div>

          {/* Sekcje rankingu */}
          <div className="space-y-8 overflow-auto">
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

            {/* Najszybsze gry */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Najszybsze perfekcyjne gry</h2>
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
          </div>
        </div>

        {/* Footer z logo */}
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