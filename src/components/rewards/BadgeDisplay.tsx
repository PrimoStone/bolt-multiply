import React from 'react';
import { Badge, UserBadge } from '../../types/rewardTypes';

/**
 * Props for the BadgeDisplay component
 */
interface BadgeDisplayProps {
  badges: Badge[];          // All available badges
  userBadges: UserBadge[];  // Badges earned by the user
  onBadgeClick?: (badge: Badge, earned: boolean) => void; // Optional click handler
}

/**
 * Component for displaying user badges in a grid layout
 * Shows badges as earned (colored) or unearned (grayscale)
 */
const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ 
  badges, 
  userBadges, 
  onBadgeClick 
}) => {
  // Create a map of badgeIds that the user has earned for quick lookup
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
  
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Badges</h2>
      
      {/* Badge grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {badges.map(badge => {
          const isEarned = earnedBadgeIds.has(badge.id);
          
          // Find the corresponding user badge if earned
          const userBadge = isEarned 
            ? userBadges.find(ub => ub.badgeId === badge.id) 
            : undefined;
          
          return (
            <div 
              key={badge.id}
              className={`
                p-4 rounded-lg border-2 transition-all duration-300
                ${isEarned 
                  ? 'border-yellow-400 bg-yellow-50' 
                  : 'border-gray-300 bg-gray-100 opacity-60'}
                ${onBadgeClick ? 'cursor-pointer hover:shadow-md' : ''}
              `}
              onClick={() => onBadgeClick && onBadgeClick(badge, isEarned)}
            >
              <div className="flex flex-col items-center">
                {/* Badge icon */}
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  ${isEarned ? '' : 'grayscale'}
                  mb-2 overflow-hidden
                `}>
                  {badge.iconUrl ? (
                    <img 
                      src={badge.iconUrl} 
                      alt={badge.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // Placeholder for badges without icons
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <span className="text-xl">?</span>
                    </div>
                  )}
                </div>
                
                {/* Badge name */}
                <h3 className="font-bold text-center text-sm">{badge.name}</h3>
                
                {/* Earned status with optional date */}
                {isEarned && userBadge ? (
                  <p className="text-green-600 text-xs mt-1">
                    Earned {userBadge.earnedAt.toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">
                    Not earned
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Empty state if no badges */}
      {badges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No badges available yet
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;
