import React from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface CoinAnimationProps {
  amount: number;
  onComplete?: () => void;
  type?: 'correct' | 'streak' | 'perfect';
}

/**
 * CoinAnimation component that shows animated coins with zoom and movement effects
 * Animates from center of screen to the coin counter in the header
 */
const CoinAnimation: React.FC<CoinAnimationProps> = ({ 
  amount, 
  onComplete,
  type = 'correct'
}) => {
  // Different colors based on reward type
  const colors = {
    correct: 'bg-yellow-100 text-yellow-600 border-yellow-400',
    streak: 'bg-blue-100 text-blue-600 border-blue-400',
    perfect: 'bg-purple-100 text-purple-600 border-purple-400'
  };
  
  // Different messages based on reward type
  const messages = {
    correct: 'Correct!',
    streak: 'Streak Bonus!',
    perfect: 'Perfect Game!'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: -50 }}
      animate={{ 
        opacity: 1, 
        scale: 1.2, 
        y: 0,
        transition: { 
          duration: 0.3,
          type: "spring",
          stiffness: 200
        }
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.5, 
        y: -50,
        transition: { duration: 0.5 }
      }}
      className="fixed top-16 inset-x-0 z-50 pointer-events-none flex justify-center"
    >
      <div className={`
        flex flex-col items-center 
        p-3 rounded-lg shadow-lg border 
        w-[90%] max-w-md
        ${colors[type]}
      `}>
        <div className="text-base font-bold mb-1">{messages[type]}</div>
        <div className="flex items-center space-x-2">
          <Coins className="w-6 h-6" />
          <span className="text-xl font-bold">
            +{amount}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CoinAnimation;
