import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Calendar, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { DAILY_BONUS_RULES } from '../types/coinTypes';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ isOpen, onClose }) => {
  const { updateCoins } = useUser();
  const [streak, setStreak] = useState(0);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check last claim date from localStorage
      const lastClaim = localStorage.getItem('lastDailyClaim');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastClaim === today) {
        setClaimed(true);
      } else {
        setClaimed(false);
        // Check streak
        const currentStreak = Number(localStorage.getItem('dailyStreak') || '0');
        const lastClaimDate = new Date(lastClaim || 0);
        const now = new Date();
        const hoursSinceLastClaim = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastClaim > DAILY_BONUS_RULES.RESET_HOURS) {
          setStreak(0);
        } else {
          setStreak(Math.min(currentStreak, DAILY_BONUS_RULES.MAX_STREAK));
        }
      }
    }
  }, [isOpen]);

  const handleClaim = async () => {
    const bonus = DAILY_BONUS_RULES.BASE_AMOUNT + (streak * DAILY_BONUS_RULES.STREAK_MULTIPLIER);
    await updateCoins(bonus);
    
    // Update localStorage
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastDailyClaim', today);
    localStorage.setItem('dailyStreak', String(streak + 1));
    
    setClaimed(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Daily Bonus!</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Coins className="w-16 h-16 text-yellow-500" />
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  {claimed ? 'Come back tomorrow!' : 'Claim your daily bonus!'}
                </h3>
                <p className="text-gray-600">
                  {claimed 
                    ? 'You've already claimed your bonus today.'
                    : `Get ${DAILY_BONUS_RULES.BASE_AMOUNT + (streak * DAILY_BONUS_RULES.STREAK_MULTIPLIER)} coins!`
                  }
                </p>
              </div>

              <div className="flex justify-center items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-medium">
                  Streak: {streak} day{streak !== 1 ? 's' : ''}
                </span>
              </div>

              {!claimed && (
                <button
                  onClick={handleClaim}
                  className="bg-yellow-500 text-white px-6 py-2 rounded-full font-semibold
                           hover:bg-yellow-600 transition-colors"
                >
                  Claim Bonus!
                </button>
              )}
            </div>

            <div className="text-center text-sm text-gray-500">
              Come back daily to increase your streak bonus!
              <br />
              Max streak: {DAILY_BONUS_RULES.MAX_STREAK} days
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyBonusModal;
