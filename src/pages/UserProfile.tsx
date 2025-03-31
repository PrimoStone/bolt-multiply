import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useUser } from '../contexts/UserContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AvatarSelector, { Avatar } from '../components/avatar/AvatarSelector';
import UserAvatar from '../components/avatar/UserAvatar';

/**
 * UserProfile component
 * Allows users to view and update their profile information
 * including selecting an avatar from the standard options
 */
const UserProfile: React.FC = () => {
  const { user, updateUserData } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user's current avatar when component mounts
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user) return;
      
      try {
        // If user already has an avatar, set it as selected
        if (user.avatarId) {
          const avatarDoc = await getDoc(doc(db, 'avatars', user.avatarId));
          if (avatarDoc.exists()) {
            setSelectedAvatar({
              id: avatarDoc.id,
              ...avatarDoc.data()
            } as Avatar);
          }
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }
    };

    fetchUserAvatar();
  }, [user]);

  // Handle avatar selection
  const handleSelectAvatar = (avatar: Avatar) => {
    setSelectedAvatar(avatar);
  };

  // Save selected avatar to user profile
  const handleSaveAvatar = async () => {
    if (!user || !selectedAvatar) return;
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Update user document with selected avatar
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        avatarId: selectedAvatar.id,
        avatarUrl: selectedAvatar.imageUrl
      });
      
      // Update local user context
      updateUserData({
        ...user,
        avatarId: selectedAvatar.id,
        avatarUrl: selectedAvatar.imageUrl
      });
      
      setMessage({
        type: 'success',
        text: 'Avatar updated successfully!'
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update avatar. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // If no user is logged in, show a message
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h1>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Helmet>
        <title>User Profile - NumberNinjas</title>
      </Helmet>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <p className="text-sm opacity-80">Customize your NumberNinjas experience</p>
        </div>

        <div className="p-6">
          {/* Profile header with current avatar */}
          <div className="flex flex-col sm:flex-row items-center mb-8 gap-4">
            <UserAvatar 
              imageUrl={user.avatarUrl || 'https://via.placeholder.com/150?text=N'} 
              name={user.displayName || 'User'} 
              size="xl" 
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{user.displayName || 'User'}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* Status message */}
          {message && (
            <div className={`mb-6 p-3 rounded ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-400' 
                : 'bg-red-100 text-red-700 border border-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {/* Avatar selection section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Choose Your Avatar</h3>
            <AvatarSelector
              selectedAvatarId={selectedAvatar?.id || null}
              onSelectAvatar={handleSelectAvatar}
              showOnlyDefaults={true}
              className="mb-4"
            />
            
            <button
              onClick={handleSaveAvatar}
              disabled={loading || !selectedAvatar || selectedAvatar.id === user.avatarId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Avatar'}
            </button>
          </div>

          {/* Other profile settings could go here */}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
