import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

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
 * Displays a horizontally scrollable list of avatars with arrow navigation
 * Shows all avatars including those without images (using placeholders)
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
  const [scrollPosition, setScrollPosition] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key to force re-fetch
  const [refreshing, setRefreshing] = useState(false); // Track refresh state
  
  // Reference to the avatar container for scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch avatars from Firestore with no caching
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching avatars from Firestore...');
        
        // Create query based on showOnlyDefaults prop
        const avatarsCollection = collection(db, 'avatars');
        let avatarsQuery;
        
        if (showOnlyDefaults) {
          avatarsQuery = query(avatarsCollection, where('isDefault', '==', true));
        } else {
          avatarsQuery = avatarsCollection;
        }
        
        // Get fresh data from Firestore with no cache
        console.log('Fetching all avatars from Firestore without limit...');
        
        // Force a fresh fetch with no cache
        const snapshot = await getDocs(avatarsQuery);
        console.log('Raw snapshot size:', snapshot.size);
        
        let avatarsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Avatar[];
        
        // Log all avatars for debugging
        console.log('All avatars from Firestore:', avatarsList);
        console.log('Avatar names:', avatarsList.map(a => a.name));
        console.log('Avatar categories:', avatarsList.map(a => a.category));
        console.log('Total avatar count:', avatarsList.length);
        
        // Filter out avatars without image URLs
        const filteredList = avatarsList.filter(avatar => 
          avatar.imageUrl && avatar.imageUrl.trim() !== ''
        );
        
        console.log('Avatars to display (with images):', filteredList.length);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(filteredList.map(avatar => avatar.category).filter(Boolean))
        );
        
        setAvatars(filteredList);
        setCategories(uniqueCategories);
        
        // Set initial category to null to show all avatars
        setSelectedCategory(null);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching avatars:', err);
        setError('Failed to load avatars');
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
  }, [showOnlyDefaults, refreshKey]); // Remove selectedCategory dependency to prevent refetching when category changes

  // Filter avatars by selected category
  const filteredAvatars = selectedCategory 
    ? avatars.filter(avatar => avatar.category === selectedCategory)
    : avatars;
  
  // Log filtered avatars for the selected category
  useEffect(() => {
    if (selectedCategory) {
      console.log(`Avatars in category "${selectedCategory}":`, 
        filteredAvatars.map(a => a.name));
    }
  }, [selectedCategory, filteredAvatars]);
  
  // Handle scroll left
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const newPosition = Math.max(scrollPosition - 200, 0);
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };
  
  // Handle scroll right
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newPosition = Math.min(scrollPosition + 200, maxScroll);
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };
  
  // Update scroll position when container is scrolled
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  };

  return (
    <div className={`avatar-selector ${className}`}>
      {/* Category tabs with refresh button */}
      <div className="flex justify-between items-center border-b border-gray-200 mb-4">
        <div className="flex overflow-x-auto">
          {/* All categories option */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 whitespace-nowrap focus:outline-none ${
              selectedCategory === null
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            All Categories
          </button>
          
          {categories.length > 0 && categories.map(category => (
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
        
        {/* Refresh button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => {
              console.log('Manual refresh triggered');
              setRefreshKey(prev => prev + 1);
              setRefreshing(true);
              setAvatars([]);
              setError('Refreshing avatars...');
              setTimeout(() => setRefreshing(false), 500);
            }}
            className="flex items-center gap-1 text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Avatars'}
          </button>
        </div>
      </div>

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

      {/* Avatar scrollable container with navigation arrows */}
      {!loading && !error && filteredAvatars.length > 0 && (
        <div className="relative">
          {/* Left scroll button */}
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={scrollPosition <= 0}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          
          {/* Scrollable avatar container */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto py-4 px-8 scrollbar-hide snap-x"
            onScroll={handleScroll}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Show all avatars when no category is selected */}
            {!selectedCategory && (
              <div className="flex-shrink-0 cursor-pointer rounded-lg p-2 mx-2 bg-blue-50 hover:bg-blue-100">
                <div className="flex items-center justify-center aspect-square w-16 h-16 bg-blue-100 rounded-full mb-2">
                  <span className="text-blue-600 font-bold">All</span>
                </div>
                <p className="text-xs text-center">Show All</p>
              </div>
            )}
            
            {filteredAvatars.map(avatar => (
              <div
                key={avatar.id}
                onClick={() => onSelectAvatar(avatar)}
                className={`flex-shrink-0 cursor-pointer rounded-lg p-2 mx-2 transition-all snap-start ${
                  selectedAvatarId === avatar.id
                    ? 'bg-blue-100 ring-2 ring-blue-500'
                    : 'hover:bg-gray-100'
                }`}
                style={{ width: '100px' }}
              >
                <div className="aspect-square overflow-hidden rounded-full mb-2">
                  {avatar.imageUrl ? (
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide avatars with broken images
                        (e.target as HTMLElement).parentElement?.parentElement?.classList.add('hidden');
                      }}
                    />
                  ) : (
                    // Placeholder for avatars without images
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xl font-bold">
                      {avatar.name.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-center truncate">{avatar.name}</p>
              </div>
            ))}
          </div>
          
          {/* Right scroll button */}
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={scrollContainerRef.current ? 
              scrollPosition >= (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) : false}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </button>
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
