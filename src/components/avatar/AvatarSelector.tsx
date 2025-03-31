import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Interface for Avatar data structure
 */
export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  isDefault: boolean;
  category: string;
}

interface AvatarSelectorProps {
  selectedAvatarId: string | null;
  onSelectAvatar: (avatar: Avatar) => void;
  showOnlyDefaults?: boolean;
  className?: string;
}

/**
 * AvatarSelector component
 * Displays a grid of avatars for selection in both admin panel and user profile
 * 
 * @param selectedAvatarId - ID of the currently selected avatar
 * @param onSelectAvatar - Callback function when an avatar is selected
 * @param showOnlyDefaults - If true, only shows default avatars
 * @param className - Additional CSS classes
 */
const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatarId,
  onSelectAvatar,
  showOnlyDefaults = false,
  className = ''
}) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch avatars from Firestore
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        setLoading(true);
        
        // Create query based on showOnlyDefaults prop
        const avatarsCollection = collection(db, 'avatars');
        let avatarsQuery;
        
        if (showOnlyDefaults) {
          avatarsQuery = query(avatarsCollection, where('isDefault', '==', true));
        } else {
          avatarsQuery = avatarsCollection;
        }
        
        const snapshot = await getDocs(avatarsQuery);
        const avatarsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Avatar[];
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(avatarsList.map(avatar => avatar.category))
        );
        
        setAvatars(avatarsList);
        setCategories(uniqueCategories);
        
        // Set initial category if available
        if (uniqueCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(uniqueCategories[0]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching avatars:', err);
        setError('Failed to load avatars');
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
  }, [showOnlyDefaults]);

  // Filter avatars by selected category
  const filteredAvatars = selectedCategory 
    ? avatars.filter(avatar => avatar.category === selectedCategory)
    : avatars;

  return (
    <div className={`avatar-selector ${className}`}>
      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 whitespace-nowrap focus:outline-none ${
                selectedCategory === category
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Avatar grid */}
      {!loading && !error && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {filteredAvatars.map(avatar => (
            <div
              key={avatar.id}
              onClick={() => onSelectAvatar(avatar)}
              className={`cursor-pointer rounded-lg p-2 transition-all ${
                selectedAvatarId === avatar.id
                  ? 'bg-blue-100 ring-2 ring-blue-500'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="aspect-square overflow-hidden rounded-full mb-2">
                <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-center truncate">{avatar.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredAvatars.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No avatars found in this category.
        </div>
      )}
    </div>
  );
};

export default AvatarSelector;
