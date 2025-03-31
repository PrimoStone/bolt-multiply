import React from 'react';

interface FirebaseImageProxyProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * FirebaseImageProxy component
 * Completely avoids CORS issues with Firebase Storage by using placeholders
 * for any Firebase Storage URLs
 * 
 * @param src - Original image source URL
 * @param alt - Alt text for the image
 * @param className - Additional CSS classes
 * @param fallbackSrc - Fallback image source if Firebase image can't be loaded
 */
const FirebaseImageProxy: React.FC<FirebaseImageProxyProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc
}) => {
  // Generate a placeholder URL based on the alt text if no fallback provided
  const getDefaultPlaceholder = () => {
    // Extract first letter or use 'N' as default
    const initial = alt && alt.length > 0 ? alt.charAt(0).toUpperCase() : 'N';
    return `https://via.placeholder.com/150/${getColorForName(alt)}/FFFFFF?text=${initial}`;
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

  // Check if the URL is a Firebase Storage URL
  const isFirebaseStorageUrl = src && src.includes('firebasestorage.googleapis.com');
  
  // Use the appropriate image source
  const imageSrc = isFirebaseStorageUrl 
    ? (fallbackSrc || getDefaultPlaceholder())
    : src;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        // If the image fails to load, use the fallback
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite error loops
        target.src = fallbackSrc || getDefaultPlaceholder();
      }}
    />
  );
};

export default FirebaseImageProxy;
