import React, { useState, useRef } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ImageUploaderProps {
  folder: string; // Firebase storage folder path
  onImageUploaded: (imageUrl: string) => void;
  defaultImageUrl?: string;
}

/**
 * ImageUploader component
 * Handles image uploading to Firebase Storage and returns the download URL
 * Used across admin interfaces for badge, trophy, and avatar item image uploads
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  folder, 
  onImageUploaded, 
  defaultImageUrl 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(defaultImageUrl || '');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate a unique ID based on timestamp and random number
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  // Handle file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file (PNG, JPG, JPEG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      // Generate a unique filename using timestamp and random number
      const fileName = `${generateUniqueId()}-${file.name}`;
      const storage = getStorage();
      const storageRef = ref(storage, `${folder}/${fileName}`);

      // Upload the file
      const uploadTask = uploadBytes(storageRef, file);
      
      // Simulate progress for better UX (Firebase's uploadBytes doesn't provide progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 200);

      // Wait for upload to complete
      await uploadTask;
      clearInterval(progressInterval);
      setProgress(100);

      // Get download URL
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      onImageUploaded(url);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Image preview */}
      <div 
        onClick={triggerFileInput}
        className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden bg-gray-50"
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="w-full h-full object-contain" 
          />
        ) : (
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm">Click to upload image</p>
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : (imageUrl ? 'Change Image' : 'Upload Image')}
      </button>

      {/* Progress bar */}
      {isUploading && (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default ImageUploader;
