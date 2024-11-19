import React, { useContext, useRef, useState, useCallback } from 'react';
import { UserContext } from '../contexts/UserContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import UserInfo from './UserInfo';
import { convertToBase64 } from '../utils/imageUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Profile: React.FC = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getInitials = (firstName: string = '', lastName: string = '') => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        if (user) {
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, {
            photoURL: base64
          });
          setUser({ ...user, photoURL: base64 });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <div className="w-20"></div>
        </div>

        {/* Profile Picture Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-center">
            <div className="relative group">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg
                           group-hover:opacity-90 transition-all duration-200"
                />
              ) : (
                <div 
                  className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center 
                           text-white text-3xl font-bold border-4 border-white shadow-lg
                           group-hover:bg-blue-600 transition-all duration-200"
                >
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
              )}
              
              {/* Camera Icon Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full
                         bg-black/0 group-hover:bg-black/30 transition-all duration-200
                         cursor-pointer"
              >
                <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 
                               transition-all duration-200" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          <div className="text-center mt-4">
            <h2 className="text-xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-500">@{user?.username}</p>
          </div>
        </div>

        <UserInfo 
          userId={user.id}
          username={user.username}
          firstName={user.firstName}
          lastName={user.lastName}
          onLoadingChange={handleLoadingChange}
        />
      </div>
    </div>
  );
};

export default Profile;
