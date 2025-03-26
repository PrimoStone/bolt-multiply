import React from 'react';
import { Helmet } from 'react-helmet';
import RewardsDashboard from '../components/rewards/RewardsDashboard';
import { RewardProvider } from '../contexts/RewardContext';

/**
 * RewardsPage component
 * 
 * Displays the rewards dashboard with all reward-related components
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
          <RewardsDashboard />
        </RewardProvider>
      </div>
    </>
  );
};

export default RewardsPage;
