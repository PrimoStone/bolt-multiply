import React from 'react';
import { Helmet } from 'react-helmet';
import UserCards from '../components/UserCards';
import { RewardProvider } from '../contexts/RewardContext';

/**
 * UserProfile component
 * Displays a unified user dashboard with swipeable cards for:
 * - Profile information
 * - Avatar settings
 * - Rewards (badges and trophies)
 * 
 * Uses the UserCards component which provides a mobile-first UI
 * with card flipping effects and swipe gestures
 */
const UserProfile: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>User Profile - NumberNinjas</title>
      </Helmet>

      {/* Wrap UserCards in RewardProvider to ensure rewards data is available */}
      <RewardProvider>
        <UserCards />
      </RewardProvider>
    </div>
  );
};

export default UserProfile;
