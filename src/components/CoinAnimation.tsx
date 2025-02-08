import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';

interface CoinAnimationProps {
  amount: number;
  onComplete?: () => void;
}

const CoinAnimation: React.FC<CoinAnimationProps> = ({ amount, onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -50 }}
          exit={{ opacity: 0 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
        >
          <div className="flex items-center space-x-2 bg-yellow-100 px-4 py-2 rounded-full shadow-lg">
            <Coins className="w-6 h-6 text-yellow-600" />
            <span className="text-xl font-bold text-yellow-600">
              +{amount}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoinAnimation;
