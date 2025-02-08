import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameConfig, GameDifficulty } from '../types/gameConfig';

interface GameStartScreenProps {
  gameType: string;
}

const GameStartScreen: React.FC<GameStartScreenProps> = ({ gameType }) => {
  const navigate = useNavigate();
  const [selectedNumber, setSelectedNumber] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');

  const handleStartGame = () => {
    const config: GameConfig = {
      mode: selectedNumber ? 'fixed' : 'random',
      difficulty,
      fixedNumber: selectedNumber
    };

    navigate(`/${gameType.toLowerCase()}`, { state: { config } });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-3xl font-bold text-center mb-8">
                  {gameType} Practice
                </h2>

                {/* Number Selection Grid */}
                <div className="mb-8">
                  <label className="block text-gray-700 text-sm font-bold mb-4">
                    Select a Number (Optional)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setSelectedNumber(selectedNumber === num ? undefined : num)}
                        className={`py-2 px-4 rounded-lg ${
                          selectedNumber === num
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        } hover:bg-blue-400 hover:text-white transition-colors`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {selectedNumber === undefined && (
                    <p className="text-sm text-gray-500 mt-2">
                      No number selected - using random numbers
                    </p>
                  )}
                </div>

                {/* Difficulty Selection */}
                <div className="mb-8">
                  <label className="block text-gray-700 text-sm font-bold mb-4">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button
                        key={d}
                        className={`flex-1 py-2 px-4 rounded-lg capitalize ${
                          difficulty === d
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        } hover:bg-blue-400 hover:text-white transition-colors`}
                        onClick={() => setDifficulty(d as GameDifficulty)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <div className="pt-8">
                  <button
                    onClick={handleStartGame}
                    className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-bold"
                  >
                    Start {gameType}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStartScreen;
