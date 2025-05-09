import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RewardNotification as RewardNotificationType } from '../../types/rewardTypes';

/**
 * Props for the RewardNotification component
 */
interface RewardNotificationProps {
  notification: RewardNotificationType; // Notification to display
  onClose: () => void;                 // Callback when notification is closed
  autoClose?: boolean;                 // Whether to auto-close the notification
  autoCloseDelay?: number;             // Delay in ms before auto-closing
}

/**
 * Component for displaying reward notifications to the user
 * Shows animated alerts when earning badges, trophies, or leveling up
 */
const RewardNotification: React.FC<RewardNotificationProps> = ({
  notification,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  // State for controlling animation and visibility
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Show animation upon mounting
  useEffect(() => {
    // Short delay before showing for smoother animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    // Auto-close functionality
    let closeTimer: NodeJS.Timeout | null = null;
    if (autoClose) {
      closeTimer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
    }
    
    return () => {
      clearTimeout(timer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [autoClose, autoCloseDelay]);
  
  // Handle closing the notification with animation
  const handleClose = () => {
    setIsLeaving(true);
    // Allow time for exit animation before calling onClose
    setTimeout(() => {
      onClose();
    }, 500);
  };
  
  // Determine styling based on notification type
  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'achievement':
        return {
          backgroundColor: 'bg-yellow-100',
          borderColor: 'border-yellow-400',
          textColor: 'text-yellow-800'
        };
      case 'level':
        return {
          backgroundColor: 'bg-blue-100',
          borderColor: 'border-blue-400',
          textColor: 'text-blue-800'
        };
      case 'trophy':
        return {
          backgroundColor: 'bg-purple-100',
          borderColor: 'border-purple-400',
          textColor: 'text-purple-800'
        };
      case 'coins':
        return {
          backgroundColor: 'bg-green-100',
          borderColor: 'border-green-400',
          textColor: 'text-green-800'
        };
      default:
        return {
          backgroundColor: 'bg-gray-100',
          borderColor: 'border-gray-400',
          textColor: 'text-gray-800'
        };
    }
  };
  
  const { backgroundColor, borderColor, textColor } = getNotificationStyles();
  
  // Render confetti animation for celebrations
  const renderConfetti = () => {
    // Only show confetti for achievements, trophies, and level-ups
    if (!['achievement', 'trophy', 'level'].includes(notification.type)) {
      return null;
    }
    
    // Generate random confetti pieces
    const confettiCount = 30;
    const colors = ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#9370DB'];
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: confettiCount }).map((_, i) => {
          const size = Math.random() * 10 + 5;
          const color = colors[Math.floor(Math.random() * colors.length)];
          const left = `${Math.random() * 100}%`;
          const animationDuration = Math.random() * 3 + 2;
          const animationDelay = Math.random() * 0.5;
          
          return (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm confetti"
              style={{
                left,
                top: '-20px',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                animation: `confetti-fall ${animationDuration}s ease-in ${animationDelay}s forwards`
              }}
            />
          );
        })}
      </div>
    );
  };
  
  return (
    <AnimatePresence>
      {isVisible && !isLeaving && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-x-0 top-4 mx-auto max-w-md z-50"
        >
          <div className={`
            ${backgroundColor} ${borderColor} ${textColor}
            border-2 rounded-lg shadow-lg overflow-hidden relative
          `}>
            {/* Confetti animation */}
            {renderConfetti()}
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 rounded-full p-1 transition-colors duration-200"
              aria-label="Close notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Icon */}
            <div className="flex p-4">
              <div className="flex-shrink-0 mr-4">
                {notification.type === 'achievement' && (
                  <div className="bg-yellow-200 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                )}
                
                {notification.type === 'level' && (
                  <div className="bg-blue-200 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                
                {notification.type === 'trophy' && (
                  <div className="bg-purple-200 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                )}
                
                {notification.type === 'coins' && (
                  <div className="bg-green-200 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div>
                <h3 className="font-bold text-lg">{notification.title}</h3>
                <p className="mt-1">{notification.message}</p>
              </div>
            </div>
          </div>
          
          {/* CSS for confetti animation */}
          <style>{`
            @keyframes confetti-fall {
              0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
              }
              10% {
                opacity: 1;
              }
              100% {
                transform: translateY(400px) rotate(720deg);
                opacity: 0;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardNotification;
