import React from 'react';
import FirebaseImageProxy from './FirebaseImageProxy';

interface UserAvatarProps {
  imageUrl: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * UserAvatar component
 * Displays a user's avatar with configurable size
 * Uses FirebaseImageProxy to handle CORS issues
 * 
 * @param imageUrl - URL of the avatar image
 * @param name - Name of the user (for alt text)
 * @param size - Size of the avatar (sm, md, lg, xl)
 * @param className - Additional CSS classes
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  imageUrl,
  name,
  size = 'md',
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Create a placeholder URL based on the name
  const getPlaceholderUrl = () => {
    // Extract first letter or use 'N' as default
    const initial = name && name.length > 0 ? name.charAt(0).toUpperCase() : 'N';
    return `https://via.placeholder.com/150/${getColorForName(name)}/FFFFFF?text=${initial}`;
  };

  // Generate a consistent color based on name
  const getColorForName = (name: string) => {
    if (!name) return '6366f1'; // Default indigo color
    
    // Simple hash function to generate a color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to hex color (without making it too light)
    let color = Math.abs(hash) % 0xFFFFFF;
    if ((color & 0xFEFEFE) > 0xAAAAAA) {
      // If color is too light, make it darker
      color = color & 0x7F7F7F;
    }
    
    return color.toString(16).padStart(6, '0');
  };

  return (
    <div className={`rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      <FirebaseImageProxy
        src={imageUrl || ''}
        alt={`${name}'s avatar`}
        className="w-full h-full object-cover"
        fallbackSrc={getPlaceholderUrl()}
      />
    </div>
  );
};

export default UserAvatar;
