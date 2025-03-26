import React, { useState, useEffect } from 'react';
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
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    // Set up auto-close if enabled
    let closeTimer: NodeJS.Timeout | null = null;
    
    if (autoClose) {
      closeTimer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
    }
    
    // Cleanup timers
    return () => {
      clearTimeout(showTimer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [autoClose, autoCloseDelay]);
  
  // Handle the close animation
  const handleClose = () => {
    setIsLeaving(true);
    
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 500); // Match transition duration
  };
  
  // Get appropriate styles and icons based on notification type
  const getNotificationStyles = () => {
    switch(notification.type) {
      case 'badge':
        return {
          backgroundColor: 'bg-yellow-100',
          borderColor: 'border-yellow-400',
          textColor: 'text-yellow-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        };
      case 'trophy':
        return {
          backgroundColor: notification.rarity === 'legendary' ? 'bg-purple-100' : 'bg-blue-100',
          borderColor: notification.rarity === 'legendary' ? 'border-purple-400' : 'border-blue-400',
          textColor: notification.rarity === 'legendary' ? 'text-purple-800' : 'text-blue-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${notification.rarity === 'legendary' ? 'text-purple-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          )
        };
      case 'level':
        return {
          backgroundColor: 'bg-green-100',
          borderColor: 'border-green-400',
          textColor: 'text-green-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )
        };
      default:
        return {
          backgroundColor: 'bg-gray-100',
          borderColor: 'border-gray-400',
          textColor: 'text-gray-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
    }
  };
  
  const { backgroundColor, borderColor, textColor, icon } = getNotificationStyles();
  
  // Generate a type-specific title
  const getTitle = () => {
    switch(notification.type) {
      case 'badge':
        return 'New Badge Earned!';
      case 'trophy':
        return `New ${notification.rarity?.charAt(0).toUpperCase()}${notification.rarity?.slice(1)} Trophy!`;
      case 'level':
        return 'Level Up!';
      default:
        return 'New Reward!';
    }
  };
  
  // Render confetti for achievements
  const renderConfetti = () => {
    const isSpecial = notification.type === 'trophy' && 
      (notification.rarity === 'very-rare' || notification.rarity === 'legendary');
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: isSpecial ? 30 : 15 }).map((_, i) => {
          const randomLeft = Math.random() * 100;
          const randomDelay = Math.random() * 0.5;
          const randomDuration = 1 + Math.random() * 2;
          const size = 5 + Math.random() * 10;
          const colors = isSpecial 
            ? ['bg-purple-500', 'bg-yellow-500', 'bg-pink-500'] 
            : ['bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <div
              key={i}
              className={`absolute ${color} rounded-sm`}
              style={{
                left: `${randomLeft}%`,
                top: '-20px',
                width: `${size}px`,
                height: `${size}px`,
                opacity: 0,
                transform: 'translateY(0)',
                animation: `confetti ${randomDuration}s ease-out ${randomDelay}s forwards`
              }}
            />
          );
        })}
      </div>
    );
  };
  
  return (
    <div
      className={`
        fixed inset-x-0 top-4 mx-auto max-w-md z-50
        transition-all duration-500 transform
        ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}
      `}
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
        
        <div className="p-4 flex items-start">
          {/* Notification icon */}
          <div className="flex-shrink-0 mr-4">
            {icon}
          </div>
          
          {/* Notification content */}
          <div className="flex-1 mt-1">
            <h3 className="font-bold text-lg mb-1">{getTitle()}</h3>
            <h4 className="font-semibold mb-1">{notification.name}</h4>
            <p className="text-sm opacity-90">{notification.description}</p>
            
            {/* Earned date */}
            <p className="text-xs mt-2 opacity-75">
              Earned {notification.earnedAt.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Reward image if available */}
        {notification.imageUrl && (
          <div className="px-4 pb-4 flex justify-center">
            <img 
              src={notification.imageUrl} 
              alt={notification.name}
              className="max-h-32 object-contain rounded shadow"
            />
          </div>
        )}
      </div>
      
      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0);
            opacity: 0;
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
    </div>
  );
};

export default RewardNotification;
