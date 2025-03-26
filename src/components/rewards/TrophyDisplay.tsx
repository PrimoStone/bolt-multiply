import React, { useState } from 'react';
import { Trophy, UserTrophy, TrophyRarity } from '../../types/rewardTypes';

/**
 * Props for the TrophyDisplay component
 */
interface TrophyDisplayProps {
  trophies: Trophy[];          // All available trophies
  userTrophies: UserTrophy[];  // Trophies earned by the user
  onTrophyClick?: (trophy: Trophy, earned: boolean) => void; // Optional click handler
}

/**
 * Component for displaying user trophies in a card layout
 * Shows trophies as earned (colored) or unearned (locked)
 */
const TrophyDisplay: React.FC<TrophyDisplayProps> = ({ 
  trophies, 
  userTrophies, 
  onTrophyClick 
}) => {
  // Create a map of trophyIds that the user has earned for quick lookup
  const earnedTrophyIds = new Set(userTrophies.map(ut => ut.trophyId));
  
  // State for the flipped trophy card
  const [flippedTrophyId, setFlippedTrophyId] = useState<string | null>(null);
  
  // Helper function to get the appropriate color based on rarity
  const getRarityColors = (rarity: TrophyRarity) => {
    switch(rarity) {
      case 'common':
        return 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-400';
      case 'uncommon':
        return 'bg-gradient-to-br from-blue-300 to-blue-400 border-blue-500';
      case 'rare':
        return 'bg-gradient-to-br from-purple-300 to-purple-500 border-purple-600';
      case 'very-rare':
        return 'bg-gradient-to-br from-orange-300 to-orange-500 border-orange-600';
      case 'legendary':
        return 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-600';
      default:
        return 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-400';
    }
  };
  
  // Helper function to get the rarity label
  const getRarityLabel = (rarity: TrophyRarity) => {
    switch(rarity) {
      case 'common':
        return 'Common';
      case 'uncommon':
        return 'Uncommon';
      case 'rare':
        return 'Rare';
      case 'very-rare':
        return 'Very Rare';
      case 'legendary':
        return 'Legendary';
      default:
        return 'Unknown';
    }
  };
  
  // Handle card flip
  const handleTrophyCardClick = (trophyId: string) => {
    if (flippedTrophyId === trophyId) {
      setFlippedTrophyId(null);
    } else {
      setFlippedTrophyId(trophyId);
    }
    
    const trophy = trophies.find(t => t.id === trophyId);
    const isEarned = earnedTrophyIds.has(trophyId);
    
    if (trophy && onTrophyClick) {
      onTrophyClick(trophy, isEarned);
    }
  };
  
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Trophies</h2>
      
      {/* Trophy shelf layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 bg-gradient-to-b from-amber-100 to-amber-50 rounded-lg border border-amber-200 shadow-inner">
        {trophies.map(trophy => {
          const isEarned = earnedTrophyIds.has(trophy.id);
          const isFlipped = flippedTrophyId === trophy.id;
          
          // Find the corresponding user trophy if earned
          const userTrophy = isEarned 
            ? userTrophies.find(ut => ut.trophyId === trophy.id) 
            : undefined;
          
          // Get rarity colors
          const rarityColors = getRarityColors(trophy.rarity);
          
          return (
            <div 
              key={trophy.id}
              className={`
                relative h-64 w-full cursor-pointer transition-transform duration-700 transform-gpu
                ${isFlipped ? 'rotate-y-180' : ''}
                perspective-1000
              `}
              onClick={() => handleTrophyCardClick(trophy.id)}
            >
              {/* Front of the card */}
              <div className={`
                absolute w-full h-full backface-hidden
                ${isFlipped ? 'invisible' : 'visible'}
                rounded-lg overflow-hidden border-4 ${rarityColors}
                shadow-lg transition-all duration-300
                ${isEarned ? '' : 'grayscale opacity-60'}
              `}>
                <div className="relative w-full h-full flex flex-col justify-between">
                  {/* Trophy image */}
                  <div className="flex-1 p-2 flex items-center justify-center bg-gradient-to-t from-transparent to-white/20">
                    {trophy.imageUrl ? (
                      <img 
                        src={trophy.imageUrl} 
                        alt={trophy.name}
                        className="max-h-32 max-w-full object-contain drop-shadow-md"
                      />
                    ) : (
                      // Placeholder for trophies without images
                      <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Trophy name and rarity */}
                  <div className="p-2 bg-black/70 text-white">
                    <h3 className="font-bold text-center">{trophy.name}</h3>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-yellow-400">{getRarityLabel(trophy.rarity)}</span>
                      {isEarned && userTrophy ? (
                        <span className="text-green-400">Earned</span>
                      ) : (
                        <span className="text-red-400">Locked</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Tap to flip indicator */}
                  <div className="absolute top-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded-full">
                    Tap for details
                  </div>
                </div>
              </div>
              
              {/* Back of the card */}
              <div className={`
                absolute w-full h-full backface-hidden rotate-y-180
                ${isFlipped ? 'visible' : 'invisible'}
                rounded-lg overflow-hidden border-4 ${rarityColors}
                shadow-lg transition-all duration-300
                bg-white
              `}>
                <div className="w-full h-full flex flex-col p-4">
                  <h3 className="font-bold text-xl text-center mb-2">{trophy.name}</h3>
                  
                  {/* Trophy description */}
                  <p className="text-sm mb-4">{trophy.description}</p>
                  
                  {/* Requirements heading */}
                  <h4 className="font-semibold mb-2">Requirements:</h4>
                  
                  {/* Requirements list */}
                  <ul className="text-xs list-disc pl-5 space-y-1 mb-4">
                    <li>Complete {trophy.requirements.gamesCompleted} games</li>
                    {trophy.requirements.minAccuracy && (
                      <li>Maintain at least {trophy.requirements.minAccuracy}% accuracy</li>
                    )}
                    {trophy.requirements.minCoins && (
                      <li>Earn at least {trophy.requirements.minCoins} coins</li>
                    )}
                    {trophy.requirements.specificBadges && trophy.requirements.specificBadges.length > 0 && (
                      <li>Earn {trophy.requirements.specificBadges.length} specific badges</li>
                    )}
                  </ul>
                  
                  {/* Status */}
                  {isEarned && userTrophy ? (
                    <div className="mt-auto p-2 bg-green-100 rounded-lg border border-green-200">
                      <p className="text-green-700 text-center font-semibold">
                        Earned on {userTrophy.earnedAt.toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-auto p-2 bg-gray-100 rounded-lg border border-gray-200">
                      <p className="text-gray-500 text-center font-semibold">
                        Not earned yet
                      </p>
                    </div>
                  )}
                  
                  {/* Rarity badge */}
                  <div className="absolute top-2 right-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-black text-white">
                      {getRarityLabel(trophy.rarity)}
                    </span>
                  </div>
                  
                  {/* Tap to flip back indicator */}
                  <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded-full">
                    Tap to flip back
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Empty state if no trophies */}
      {trophies.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No trophies available yet
        </div>
      )}
      
      {/* CSS for 3D card flip effect */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default TrophyDisplay;
