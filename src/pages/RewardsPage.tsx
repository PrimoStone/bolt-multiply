import React from 'react';
import { Helmet } from 'react-helmet';
import UserCards from '../components/UserCards';
import { RewardProvider } from '../contexts/RewardContext';

/**
 * RewardsPage component
 * 
 * Displays the unified user dashboard with swipeable cards for profile, avatar settings, and rewards
 * Wrapped in the RewardProvider to ensure reward data is available
 */
const RewardsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Rewards - Number Ninjas</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <RewardProvider>
          <UserCards />
        </RewardProvider>
      </div>
    </>
  );
};

export default RewardsPage;
